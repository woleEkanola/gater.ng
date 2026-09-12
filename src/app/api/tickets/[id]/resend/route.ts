import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendTicketEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketDbId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketDbId },
      include: {
        ticketType: { include: { event: { include: { organizer: { select: { name: true, image: true } } } } } },
        order: true,
        owner: { select: { name: true, email: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.deletedAt) {
      return NextResponse.json({ error: "Ticket has been cancelled" }, { status: 400 });
    }

    const event = ticket.ticketType.event;
    const isOrganizer = event.organizerId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    const isStaff = await prisma.eventStaff.findFirst({
      where: { eventId: event.id, userId: user.id, status: "ACTIVE" },
    });

    if (!isOrganizer && !isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = ticket.order?.buyerEmail || ticket.owner?.email;
    if (!email) {
      return NextResponse.json({ error: "No email address on file for this ticket" }, { status: 400 });
    }

    const name =
      ticket.order?.buyerName ||
      ticket.owner?.name ||
      email.split("@")[0];

    const result = await sendTicketEmail({
      email,
      name,
      eventTitle: event.title,
      eventDate: new Date(event.dateTime).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      eventLocation: event.location || "TBD",
      eventBanner: event.banner,
      organizerName: event.organizer?.name,
      organizerImage: event.organizer?.image,
      ticketId: ticket.ticketId,
      ticketType: ticket.ticketType.name,
      qrCode: ticket.qrCode || "",
      orderId: ticket.order?.id || "",
      amount: ticket.order ? (ticket.order.amount / 100).toString() : "0",
      discountCode: ticket.order?.discountCode || undefined,
      phone: ticket.order?.buyerPhone || null,
      eventId: event.id,
      organizerId: event.organizerId,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send ticket email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Error resending ticket email:", error);
    return NextResponse.json({ error: "Failed to resend ticket email" }, { status: 500 });
  }
}
