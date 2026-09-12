import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/email";

interface ReminderRecipient {
  email: string;
  name: string;
  ticketCount: number;
  orderIds: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { name: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { dryRun } = body;

    const orders = await prisma.order.findMany({
      where: { eventId, status: "PAID" },
      include: {
        tickets: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    const byEmail = new Map<string, ReminderRecipient>();
    let skippedNoEmail = 0;

    for (const order of orders) {
      if (order.tickets.length === 0) continue;
      if (!order.buyerEmail || !order.buyerEmail.trim()) {
        skippedNoEmail += 1;
        continue;
      }
      const key = order.buyerEmail.trim().toLowerCase();
      const existing = byEmail.get(key);
      const name = order.buyerName?.trim() || key.split("@")[0];
      if (existing) {
        existing.ticketCount += order.tickets.length;
        existing.orderIds.push(order.id);
      } else {
        byEmail.set(key, {
          email: order.buyerEmail.trim(),
          name,
          ticketCount: order.tickets.length,
          orderIds: [order.id],
        });
      }
    }

    const recipients = Array.from(byEmail.values());
    const totalTickets = recipients.reduce((sum, r) => sum + r.ticketCount, 0);
    const eventDate = new Date(event.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        eventId,
        eventTitle: event.title,
        totalRecipients: recipients.length,
        totalTickets,
        skippedNoEmail,
        recipients,
      });
    }

    const results = await Promise.allSettled(
      recipients.map((r) =>
        sendEventReminderEmail({
          email: r.email,
          name: r.name,
          eventTitle: event.title,
          eventDate,
          eventLocation: event.location || "TBD",
          eventBanner: event.banner,
          organizerName: event.organizer?.name,
          ticketCount: r.ticketCount,
          orderIds: r.orderIds,
          eventId: event.id,
        })
      )
    );

    let sent = 0;
    const failures: { email: string; error: string }[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        sent += 1;
      } else {
        const err =
          result.status === "rejected"
            ? String(result.reason)
            : String((result.value as { error?: unknown }).error || "Failed to send");
        failures.push({ email: recipients[index].email, error: err });
      }
    });

    console.log(`[Reminder] Event ${eventId}: sent ${sent}/${recipients.length}, failed ${failures.length}`);

    return NextResponse.json({
      success: true,
      dryRun: false,
      eventTitle: event.title,
      sent,
      failed: failures.length,
      totalRecipients: recipients.length,
      totalTickets,
      skippedNoEmail,
      failures,
    });
  } catch (error) {
    console.error("Error sending event reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
