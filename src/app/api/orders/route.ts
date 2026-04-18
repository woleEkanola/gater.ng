import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQRCode, generateTicketId } from "@/lib/qr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, items, email, name, phone } = body;

    if (!eventId || !items || !items.length || !email) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.isPublished) {
      return NextResponse.json({ error: "Event is not available for purchase" }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItems: { ticketTypeId: string; quantity: number }[] = [];

    for (const item of items) {
      const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);

      if (!ticketType) {
        return NextResponse.json(
          { error: `Ticket type ${item.ticketTypeId} not found` },
          { status: 400 }
        );
      }

      const available = ticketType.quantity - ticketType.soldCount;
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Not enough tickets for ${ticketType.name}. Available: ${available}` },
          { status: 400 }
        );
      }

      totalAmount += ticketType.price * item.quantity;
      orderItems.push({ ticketTypeId: item.ticketTypeId, quantity: item.quantity });
    }

    let buyerId: string | undefined = undefined;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) buyerId = user.id;
    }

    const orderData: Record<string, unknown> = {
      buyerId: buyerId || undefined,
      buyerEmail: email,
      buyerName: name || null,
      buyerPhone: phone || null,
      eventId,
      amount: totalAmount,
      status: "PENDING",
    };

    if (!buyerId) {
      delete orderData.buyerId;
    }

    const order = await prisma.order.create({
      data: orderData as Parameters<typeof prisma.order.create>[0]["data"],
    });

    return NextResponse.json({
      orderId: order.id,
      amount: totalAmount,
      email,
      name,
      eventTitle: event.title,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          event: true,
          tickets: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({
        orderId: order.id,
        status: order.status,
        eventTitle: order.event.title,
        amount: order.amount,
        tickets: order.tickets.length,
      });
    } catch (error) {
      console.error("Error verifying order:", error);
      return NextResponse.json({ error: "Failed to verify order" }, { status: 500 });
    }
  }

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

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        event: true,
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
