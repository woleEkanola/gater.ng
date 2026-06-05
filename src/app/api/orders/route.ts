import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQRCode, generateTicketId } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/whatsapp-messages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, items, email, name, phone, discountCode, discountAmount } = body;

    console.log("[API /orders] POST - received eventId:", eventId, "type:", typeof eventId, "items:", JSON.stringify(items), "email:", email);

    if (!eventId || !items || !items.length) {
      console.log("[API /orders] POST - invalid request, missing eventId or items");
      return NextResponse.json({ error: "Event and tickets are required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      console.log("[API /orders] POST - name missing");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    console.log("[API /orders] POST - querying event by id:", eventId);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true, organizer: { select: { name: true, image: true } } },
    });

    if (!event) {
      console.log("[API /orders] POST - event not found for id:", eventId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("[API /orders] POST - event found:", event.id, event.slug, event.title, "isPublished:", event.isPublished);

    if (event.requireEmail !== false && (!email || !email.trim())) {
      console.log("[API /orders] POST - email missing");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (event.requirePhone && (!phone || !phone.trim())) {
      console.log("[API /orders] POST - phone missing");
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!event.isPublished) {
      console.log("[API /orders] POST - event not published");
      return NextResponse.json({ error: "Event is not available for purchase" }, { status: 400 });
    }

    const normalizedPhone = phone ? normalizePhone(phone) : null;

    let totalAmount = 0;
    const orderItems: { ticketTypeId: string; quantity: number }[] = [];
    const appliedDiscount = discountAmount || 0;

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

    // Validate discount code matches ticket types in the order
    if (discountCode) {
      const dc = await prisma.discountCode.findUnique({
        where: { code_eventId: { code: discountCode.toUpperCase(), eventId } },
      });
      if (dc?.ticketTypeId) {
        const orderTicketTypeIds = orderItems.map((oi) => oi.ticketTypeId);
        if (!orderTicketTypeIds.includes(dc.ticketTypeId)) {
          return NextResponse.json(
            { error: "Discount code is not valid for the selected ticket types" },
            { status: 400 }
          );
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - appliedDiscount);

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
      buyerEmail: email || null,
      buyerName: name || null,
      buyerPhone: normalizedPhone,
      eventId,
      amount: finalAmount,
      discountCode: discountCode || null,
      discountAmount: appliedDiscount,
      status: "PENDING",
    };

    if (!buyerId) {
      delete orderData.buyerId;
    }

    const order = await prisma.order.create({
      data: orderData as Parameters<typeof prisma.order.create>[0]["data"],
    });

    const isFree = finalAmount === 0;
    
    if (isFree) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      const tickets: { id: string; ticketId: string; qrCode: string }[] = [];

      for (const item of orderItems) {
        const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
        if (!ticketType) continue;

        for (let i = 0; i < item.quantity; i++) {
          const ticketId = generateTicketId();
          const qrData = JSON.stringify({ ticketId, orderId: order.id, eventId });
          const qrCode = await generateQRCode(qrData);

          const ticket = await prisma.ticket.create({
            data: {
              ticketId,
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              groupSize: ticketType.groupSize,
              qrCode,
            },
          });

          tickets.push({ id: ticket.id, ticketId: ticket.ticketId, qrCode });
        }

        await prisma.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      // Send ticket emails for free tickets
      if (email && tickets.length > 0) {
        console.log(`[Orders] Sending ${tickets.length} ticket emails for free order ${order.id}, phone: ${normalizedPhone}, organizerId: ${event.organizerId}`);
        for (const item of orderItems) {
          const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
          const itemTickets = tickets.splice(0, item.quantity);
          for (const ticket of itemTickets) {
            await sendTicketEmail({
              email,
              name: name || "Customer",
              eventTitle: event.title,
              eventDate: new Date(event.dateTime).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              }),
              eventLocation: event.location || "TBD",
              eventBanner: event.banner,
              organizerName: event.organizer?.name,
              organizerImage: event.organizer?.image,
              ticketId: ticket.ticketId,
              ticketType: ticketType?.name || "General",
              qrCode: ticket.qrCode,
              orderId: order.id,
              amount: "0",
              discountCode: order.discountCode || undefined,
              phone: normalizedPhone,
              eventId: event.id,
              organizerId: event.organizerId,
            });
          }
        }
      }

      // Increment discount code usage
      if (order.discountCode) {
        await prisma.discountCode.updateMany({
          where: { code: order.discountCode, eventId: event.id },
          data: { usesCount: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({
      orderId: order.id,
      amount: totalAmount,
      email,
      name,
      eventTitle: event.title,
      isFree,
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
