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
    const { eventId, name, price, quantity, groupSize, salesStart, salesEnd, image } = body;

    if (!eventId || !name || price === undefined || !quantity) {
      return NextResponse.json(
        { error: "Event ID, name, price, and quantity are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId,
        name,
        price: Math.round(price * 100),
        quantity,
        groupSize: groupSize ? parseInt(groupSize) : 1,
        ...(image && { image }),
        ...(salesStart && { salesStart: new Date(salesStart) }),
        ...(salesEnd && { salesEnd: new Date(salesEnd) }),
      },
    });

    return NextResponse.json(ticketType, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket type:", error);
    return NextResponse.json({ error: "Failed to create ticket type" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, price, quantity, groupSize, image, salesStart, salesEnd } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (ticketType.event.organizerId !== user.id && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (groupSize !== undefined) updateData.groupSize = parseInt(groupSize);
    if (image !== undefined) updateData.image = image;
    if (salesStart !== undefined) updateData.salesStart = salesStart ? new Date(salesStart) : null;
    if (salesEnd !== undefined) updateData.salesEnd = salesEnd ? new Date(salesEnd) : null;

    if (quantity !== undefined) {
      if (quantity < ticketType.soldCount) {
        return NextResponse.json({ error: "Quantity cannot be less than sold count" }, { status: 400 });
      }
      updateData.quantity = parseInt(quantity);
    }

    if (price !== undefined) {
      if (ticketType.soldCount > 0) {
        return NextResponse.json({ error: "Cannot update price - tickets already sold" }, { status: 400 });
      }
      updateData.price = Math.round(price * 100);
    }

    const updated = await prisma.ticketType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating ticket type:", error);
    return NextResponse.json({ error: "Failed to update ticket type" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(ticketTypes);
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return NextResponse.json({ error: "Failed to fetch ticket types" }, { status: 500 });
  }
}
