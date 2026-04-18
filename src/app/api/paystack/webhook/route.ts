import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { generateQRCode, generateTicketId } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    if (eventType === "charge.success") {
      const { reference, amount, metadata } = data;
      const { orderId, buyerId, ticketData } = metadata;

      if (!orderId) {
        console.error("No order ID in webhook");
        return NextResponse.json({ error: "No order ID" }, { status: 400 });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { event: { include: { ticketTypes: true } } },
      });

      if (!order) {
        console.error("Order not found:", orderId);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status === "PAID") {
        return NextResponse.json({ message: "Already processed" });
      }

      const tickets: { id: string; ticketId: string; qrCode: string }[] = [];

      for (const td of ticketData) {
        const ticketType = order.event.ticketTypes.find((tt) => tt.id === td.ticketTypeId);

        if (!ticketType) continue;

        for (let i = 0; i < td.quantity; i++) {
          const ticketId = generateTicketId();
          const qrData = JSON.stringify({
            ticketId,
            orderId,
            eventId: order.eventId,
          });
          const qrCode = await generateQRCode(qrData);

          const ticket = await prisma.ticket.create({
            data: {
              ticketId,
              ticketTypeId: td.ticketTypeId,
              ownerId: buyerId || null,
              orderId,
              qrCode,
            },
          });

          tickets.push({ id: ticket.id, ticketId: ticket.ticketId, qrCode });
        }

        await prisma.ticketType.update({
          where: { id: td.ticketTypeId },
          data: { soldCount: { increment: td.quantity } },
        });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentRef: reference,
          paidAt: new Date(),
        },
      });

      console.log(`Order ${orderId} paid successfully. Created ${tickets.length} tickets.`);

      const buyer = await prisma.user.findUnique({
        where: { id: buyerId },
      });

      if (buyer && buyer.email) {
        for (const ticket of tickets) {
          const ticketType = order.event.ticketTypes.find(
            (tt) => tt.id === ticketData.find((td: { ticketTypeId: string }) => td.ticketTypeId === tt.id)?.ticketTypeId
          );

          await sendTicketEmail({
            email: buyer.email,
            name: buyer.name || buyer.email.split("@")[0],
            eventTitle: order.event.title,
            eventDate: new Date(order.event.dateTime).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            eventLocation: order.event.location,
            ticketId: ticket.ticketId,
            ticketType: ticketType?.name || "General",
            qrCode: ticket.qrCode,
            orderId: order.id,
            amount: order.amount.toString(),
          });
        }
        console.log(`Sent ${tickets.length} ticket emails for order ${orderId}`);
      }
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
