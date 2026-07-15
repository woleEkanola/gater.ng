import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQRCode, generateTicketId } from "@/lib/qr";
import { sendTicketEmail, sendOrganizerSaleNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone } = body;

    if (!eventId || !ticketTypeId || !quantity || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: { where: { deletedAt: null } }, organizer: { select: { name: true, email: true } } },
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

    const ticketType = event.ticketTypes.find((tt) => tt.id === ticketTypeId);
    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    const available = ticketType.quantity - ticketType.soldCount;
    if (quantity > available) {
      return NextResponse.json({ error: `Only ${available} tickets available` }, { status: 400 });
    }

    const totalAmount = ticketType.price * quantity;

    const order = await prisma.order.create({
      data: {
        eventId,
        buyerEmail,
        buyerName: buyerName || null,
        buyerPhone: buyerPhone || null,
        amount: totalAmount,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = generateTicketId();
      const qrData = JSON.stringify({ ticketId, orderId: order.id, eventId });
      const qrCode = await generateQRCode(qrData);

      const ticket = await prisma.ticket.create({
        data: {
          ticketId,
          ticketTypeId,
          orderId: order.id,
          qrCode,
        },
      });

      tickets.push(ticket);
    }

    await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: { soldCount: { increment: quantity } },
    });

    // Send ticket emails to buyer
    for (const ticket of tickets) {
      sendTicketEmail({
        email: buyerEmail,
        name: buyerName || buyerEmail,
        eventTitle: event.title,
        eventDate: new Date(event.dateTime).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        eventLocation: event.location || "TBD",
        eventBanner: event.banner,
        organizerName: event.organizer?.name,
        organizerImage: null,
        ticketId: ticket.ticketId,
        ticketType: ticketType.name,
        qrCode: ticket.qrCode || "",
        orderId: order.id,
        amount: (totalAmount / 100).toString(),
        phone: buyerPhone || undefined,
        eventId: event.id,
        organizerId: event.organizerId,
      }).catch((err) => console.error("Failed to send buyer ticket email:", err));
    }

    // Notify organizer
    if (event.organizer?.email) {
      sendOrganizerSaleNotification({
        organizerEmail: event.organizer.email,
        organizerName: event.organizer.name || "Organizer",
        eventTitle: event.title,
        buyerName: buyerName || buyerEmail,
        buyerEmail: buyerEmail,
        ticketType: ticketType.name,
        quantity,
        amount: (totalAmount / 100).toString(),
      }).catch((err) => console.error("Failed to send organizer notification:", err));
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      tickets: tickets.length,
      totalAmount,
    });
  } catch (error) {
    console.error("Error logging sale:", error);
    return NextResponse.json({ error: "Failed to log sale" }, { status: 500 });
  }
}