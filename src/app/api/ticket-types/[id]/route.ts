import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketTypeId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });

    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    if (ticketType.deletedAt) {
      return NextResponse.json({ error: "Ticket type already deleted" }, { status: 400 });
    }

    const isOrganizer = ticketType.event.organizerId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Ticket type deleted" });
  } catch (error) {
    console.error("Error deleting ticket type:", error);
    return NextResponse.json({ error: "Failed to delete ticket type" }, { status: 500 });
  }
}
