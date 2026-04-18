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
    const { eventId, name, price, quantity, salesStart, salesEnd } = body;

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

    if (!user || (event.organizerId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId,
        name,
        price: Math.round(price * 100),
        quantity,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(ticketTypes);
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return NextResponse.json({ error: "Failed to fetch ticket types" }, { status: 500 });
  }
}
