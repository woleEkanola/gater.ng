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
    const { ticketId, eventId } = body;

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

    if (ticket.isUsed) {
      return NextResponse.json({
        error: "Ticket already used",
        status: "ALREADY_USED",
        usedAt: ticket.usedAt,
        usedBy: ticket.usedBy,
      }, { status: 400 });
    }

    if (event && ticket.ticketType.eventId !== event.id) {
      return NextResponse.json({
        error: "Ticket does not belong to this event",
        status: "WRONG_EVENT",
      }, { status: 400 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: user.id,
      },
    });

    await prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        checkedBy: user.id,
      },
    });

    return NextResponse.json({
      message: "Check-in successful",
      status: "VALID",
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

    return NextResponse.json({
      totalTickets,
      checkedIn: checkIns.length,
      checkIns,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}
