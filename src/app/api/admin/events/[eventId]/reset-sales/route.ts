import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 1. Delete all CheckIn records for tickets of this event
    const checkInsResult = await prisma.checkIn.deleteMany({
      where: {
        ticket: {
          ticketType: {
            eventId,
          },
        },
      },
    });

    // 2. Delete all Ticket records for this event
    const ticketsResult = await prisma.ticket.deleteMany({
      where: {
        ticketType: {
          eventId,
        },
      },
    });

    // 3. Delete all Order records for this event
    const ordersResult = await prisma.order.deleteMany({
      where: {
        eventId,
      },
    });

    // 4. Reset soldCount to 0 on all TicketType records for this event
    const ticketTypesResult = await prisma.ticketType.updateMany({
      where: {
        eventId,
      },
      data: {
        soldCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        checkIns: checkInsResult.count,
        tickets: ticketsResult.count,
        orders: ordersResult.count,
      },
      reset: {
        ticketTypes: ticketTypesResult.count,
      },
    });
  } catch (error) {
    console.error("Error resetting sales:", error);
    return NextResponse.json({ error: "Failed to reset sales" }, { status: 500 });
  }
}
