import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: eventId, staffId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.eventStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.eventId !== eventId) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    await prisma.eventStaff.update({
      where: { id: staffId },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true, message: "Staff access revoked" });
  } catch (error: any) {
    console.error("Error revoking staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
