import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
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

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, ticketIds } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const where: any = {
      ticketType: { eventId },
      deletedAt: null,
    };

    if (ticketIds && Array.isArray(ticketIds) && ticketIds.length > 0) {
      where.id = { in: ticketIds };
    }

    const ticketsToDelete = await prisma.ticket.findMany({
      where,
      select: { id: true },
    });

    const count = await prisma.ticket.updateMany({
      where: { id: { in: ticketsToDelete.map((t) => t.id) } },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: `${count.count} ticket(s) deleted`,
      deletedCount: count.count,
    });
  } catch (error) {
    console.error("Error bulk deleting tickets:", error);
    return NextResponse.json({ error: "Failed to delete tickets" }, { status: 500 });
  }
}
