import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOrganizer = event.organizerId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    const isStaff = await prisma.eventStaff.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    if (!isOrganizer && !isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      eventTitle: event.title,
      role: isOrganizer ? "organizer" : isAdmin ? "admin" : "staff",
    });
  } catch (error: any) {
    console.error("Error verifying staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
