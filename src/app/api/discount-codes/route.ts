import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const codes = await prisma.discountCode.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, code, discountType, discountValue, maxUses, validUntil, ticketTypeId } = body;

    if (!eventId || !code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If ticketTypeId is provided, verify it belongs to the event
    if (ticketTypeId) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId, deletedAt: null },
      });
      if (!ticketType || ticketType.eventId !== eventId) {
        return NextResponse.json({ error: "Ticket type not found for this event" }, { status: 400 });
      }
    }

    const existing = await prisma.discountCode.findUnique({
      where: { code_eventId: { code: code.toUpperCase(), eventId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 });
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        maxUses,
        validUntil: validUntil ? new Date(validUntil) : null,
        eventId,
        ticketTypeId: ticketTypeId || null,
      },
    });

    return NextResponse.json(discountCode, { status: 201 });
  } catch (error) {
    console.error("Error creating discount code:", error);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, code, discountType, discountValue, maxUses, validUntil, ticketTypeId } = body;

    if (!id) {
      return NextResponse.json({ error: "Code ID required" }, { status: 400 });
    }

    const existing = await prisma.discountCode.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || existing.event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If code is being changed, check for duplicates
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.discountCode.findUnique({
        where: { code_eventId: { code: code.toUpperCase(), eventId: existing.eventId } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Code already exists" }, { status: 400 });
      }
    }

    // If ticketTypeId is being set, verify it belongs to the event
    if (ticketTypeId) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId, deletedAt: null },
      });
      if (!ticketType || ticketType.eventId !== existing.eventId) {
        return NextResponse.json({ error: "Ticket type not found for this event" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (ticketTypeId !== undefined) updateData.ticketTypeId = ticketTypeId || null;

    const updated = await prisma.discountCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("id");

    if (!codeId) {
      return NextResponse.json({ error: "Code ID required" }, { status: 400 });
    }

    const code = await prisma.discountCode.findUnique({
      where: { id: codeId },
      include: { event: true },
    });

    if (!code) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || code.event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.discountCode.delete({ where: { id: codeId } });

    return NextResponse.json({ message: "Code deleted" });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}