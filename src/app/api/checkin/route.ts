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

    const body = await request.json();
    const { ticketId, eventId, count } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = eventId
      ? await prisma.event.findUnique({ where: { id: eventId } })
      : null;

    if (event && event.organizerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketId },
      include: {
        ticketType: { include: { event: true } },
        owner: { select: { name: true, email: true } },
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found", status: "INVALID" }, { status: 404 });
    }

    const checkInCount = count ? parseInt(count) : 1;
    const remaining = ticket.groupSize - ticket.checkedInCount;

    if (remaining <= 0) {
      return NextResponse.json({
        error: "Ticket fully checked in",
        status: "ALREADY_USED",
        checkedInCount: ticket.checkedInCount,
        groupSize: ticket.groupSize,
      }, { status: 400 });
    }

    if (checkInCount > remaining) {
      return NextResponse.json({
        error: `Only ${remaining} admission${remaining === 1 ? "" : "s"} remaining on this ticket`,
        status: "PARTIAL",
        remaining,
        groupSize: ticket.groupSize,
        checkedInCount: ticket.checkedInCount,
      }, { status: 400 });
    }

    if (event && ticket.ticketType.eventId !== event.id) {
      return NextResponse.json({
        error: "Ticket does not belong to this event",
        status: "WRONG_EVENT",
      }, { status: 400 });
    }

    const newCheckedInCount = ticket.checkedInCount + checkInCount;
    const isFullyUsed = newCheckedInCount >= ticket.groupSize;

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedInCount: newCheckedInCount,
        isUsed: isFullyUsed,
        ...(isFullyUsed && { usedAt: new Date(), usedBy: user.id }),
      },
    });

    for (let i = 0; i < checkInCount; i++) {
      await prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          checkedBy: user.id,
        },
      });
    }

    return NextResponse.json({
      message: "Check-in successful",
      status: "VALID",
      checkedInCount: newCheckedInCount,
      groupSize: ticket.groupSize,
      ticket: {
        ticketId: ticket.ticketId,
        ticketType: ticket.ticketType.name,
        event: ticket.ticketType.event.title,
        owner: ticket.owner?.name || ticket.owner?.email || "Unknown",
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}

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

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || (event.organizerId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: {
        ticket: {
          ticketType: { eventId },
        },
      },
      include: {
        ticket: {
          include: {
            ticketType: true,
            order: { include: { buyer: true } },
          },
        },
        checker: { select: { name: true, email: true } },
      },
      orderBy: { checkedAt: "desc" },
    });

    const totalTickets = await prisma.ticket.count({
      where: {
        ticketType: { eventId },
        order: { status: "PAID" },
      },
    });

    const totalAdmissions = await prisma.ticket.aggregate({
      where: {
        ticketType: { eventId },
        order: { status: "PAID" },
      },
      _sum: { groupSize: true },
    });

    return NextResponse.json({
      totalTickets,
      totalAdmissions: totalAdmissions._sum.groupSize || 0,
      checkedIn: checkIns.length,
      checkIns,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}
