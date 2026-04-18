import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateQRCode, generateTicketId } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";

interface PaystackVerifyResponse {
  status: boolean;
  message?: string;
  data?: {
    status: string;
    amount: number;
    currency: string;
    reference: string;
    metadata: {
      orderId: string;
      buyerId?: string;
      name?: string;
      ticketData: { ticketTypeId: string; quantity: number }[];
    };
    customer?: {
      email: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    console.log("Verify called with reference:", reference);

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const data: PaystackVerifyResponse = await response.json();
    console.log("Paystack response:", data);

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json({ verified: false, message: "Payment not successful", debug: data });
    }

    const orderId = data.data?.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ verified: false, message: "No order ID in metadata" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: { include: { ticketTypes: true } }, tickets: true },
    });

    if (!order) {
      return NextResponse.json({ verified: false, message: "Order not found" });
    }

    if (order.status === "PAID") {
      return NextResponse.json({
        verified: true,
        orderId: order.id,
        status: order.status,
        eventTitle: order.event.title,
        amount: order.amount,
        tickets: order.tickets.length,
        buyerEmail: order.buyerEmail,
        email: order.buyerEmail,
      });
    }

    const ticketData = data.data?.metadata?.ticketData || [];
    const buyerId = data.data?.metadata?.buyerId;

    const tickets: { id: string; ticketId: string; qrCode: string }[] = [];

    for (const td of ticketData) {
      const ticketType = order.event.ticketTypes.find((tt) => tt.id === td.ticketTypeId);
      if (!ticketType) continue;

      for (let i = 0; i < td.quantity; i++) {
        const ticketId = generateTicketId();
        const qrData = JSON.stringify({ ticketId, orderId, eventId: order.eventId });
        const qrCode = await generateQRCode(qrData);

        const ticket = await prisma.ticket.create({
          data: { ticketId, ticketTypeId: td.ticketTypeId, ownerId: buyerId || null, orderId, qrCode },
        });

        tickets.push({ id: ticket.id, ticketId: ticket.ticketId, qrCode });
      }

      await prisma.ticketType.update({
        where: { id: td.ticketTypeId },
        data: { soldCount: { increment: Number(td.quantity) } },
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentRef: reference, paidAt: new Date() },
    });

    console.log(`Order ${orderId} processed. Created ${tickets.length} tickets.`);

    const buyerEmail = data.data?.customer?.email;
    const buyerName = data.data?.metadata?.name || buyerEmail?.split("@")[0];

    if (buyerEmail) {
      for (const ticket of tickets) {
        const ticketType = order.event.ticketTypes.find(
          (tt) => tt.id === ticketData.find((td: any) => td.ticketTypeId === tt.id)?.ticketTypeId
        );

        await sendTicketEmail({
          email: buyerEmail,
          name: buyerName || "Customer",
          eventTitle: order.event.title,
          eventDate: new Date(order.event.dateTime).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          eventLocation: order.event.location || "TBD",
          ticketId: ticket.ticketId,
          ticketType: ticketType?.name || "General",
          qrCode: ticket.qrCode,
          orderId: order.id,
          amount: (order.amount / 100).toString(),
        });
      }
      console.log(`Sent ${tickets.length} ticket emails for order ${orderId}`);
    }

    return NextResponse.json({
      verified: true,
      orderId: order.id,
      status: "PAID",
      eventTitle: order.event.title,
      amount: order.amount,
      tickets: tickets.length,
      buyerEmail: order.buyerEmail,
      email: order.buyerEmail,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}