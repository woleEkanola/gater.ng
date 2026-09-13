import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendTicketEmail, mapWithResendThrottle } from "@/lib/email";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { ticketIds } = body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: "ticketIds array required" }, { status: 400 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
      include: {
        ticketType: { include: { event: { include: { organizer: { select: { name: true, image: true } } } } } },
        order: true,
        owner: { select: { name: true, email: true } },
      },
    });

    if (tickets.length === 0) {
      return NextResponse.json({ error: "No tickets found" }, { status: 404 });
    }

    // Verify authorization for each ticket's event
    for (const ticket of tickets) {
      const event = ticket.ticketType.event;
      const isOrganizer = event.organizerId === user.id;
      const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
      const isStaff = await prisma.eventStaff.findFirst({
        where: { eventId: event.id, userId: user.id, status: "ACTIVE" },
      });

      if (!isOrganizer && !isAdmin && !isStaff) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const results = await mapWithResendThrottle(tickets, async (ticket) => {
      const email = ticket.order?.buyerEmail || ticket.owner?.email;
      if (!email) {
        return { ok: false, error: "No email on file", ticketId: ticket.ticketId };
      }

      const name = ticket.order?.buyerName || ticket.owner?.name || email.split("@")[0];

      try {
        const result = await sendTicketEmail({
          email,
          name,
          eventTitle: ticket.ticketType.event.title,
          eventDate: new Date(ticket.ticketType.event.dateTime).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          eventLocation: ticket.ticketType.event.location || "TBD",
          eventBanner: ticket.ticketType.event.banner,
          organizerName: ticket.ticketType.event.organizer?.name,
          organizerImage: ticket.ticketType.event.organizer?.image,
          ticketId: ticket.ticketId,
          ticketType: ticket.ticketType.name,
          qrCode: ticket.qrCode || "",
          orderId: ticket.order?.id || "",
          amount: ticket.order ? (ticket.order.amount / 100).toString() : "0",
          discountCode: ticket.order?.discountCode || undefined,
          phone: ticket.order?.buyerPhone || null,
          eventId: ticket.ticketType.event.id,
          organizerId: ticket.ticketType.event.organizerId,
        });

        return { ok: result.success, error: result.success ? "" : String((result as { error?: unknown }).error || "Failed to send"), ticketId: ticket.ticketId };
      } catch (err) {
        return { ok: false, error: String(err), ticketId: ticket.ticketId };
      }
    });

    const success = results.filter((r) => r.ok).length;
    const failures = results.filter((r) => !r.ok).map((r) => ({ ticketId: r.ticketId, error: r.error }));

    return NextResponse.json({ success, failed: failures.length, failures });
  } catch (error) {
    console.error("Error bulk resending tickets:", error);
    return NextResponse.json({ error: "Failed to bulk resend tickets" }, { status: 500 });
  }
}
