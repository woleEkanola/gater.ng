import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/email";

interface ReminderTicket {
  ticketId: string;
  ticketType: string;
  orderId: string;
}

interface ReminderRecipient {
  email: string;
  name: string;
  ticketCount: number;
  orderIds: string[];
  tickets: ReminderTicket[];
}

const SEND_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
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
    const { dryRun, offset, limit } = body;

    const orders = await prisma.order.findMany({
      where: { eventId, status: "PAID" },
      include: {
        tickets: {
          where: { deletedAt: null },
          select: { id: true, ticketId: true, ticketType: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
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
      const orderTickets: ReminderTicket[] = order.tickets.map((t) => ({
        ticketId: t.ticketId,
        ticketType: t.ticketType.name,
        orderId: order.id,
      }));
      if (existing) {
        existing.ticketCount += order.tickets.length;
        existing.orderIds.push(order.id);
        existing.tickets.push(...orderTickets);
      } else {
        byEmail.set(key, {
          email: order.buyerEmail.trim(),
          name,
          ticketCount: order.tickets.length,
          orderIds: [order.id],
          tickets: orderTickets,
        });
      }
    }

    const allRecipients = Array.from(byEmail.values()).sort((a, b) => a.email.localeCompare(b.email));
    const totalTickets = allRecipients.reduce((sum, r) => sum + r.ticketCount, 0);
    const start = Math.max(0, Number(offset) || 0);
    const batchLimit = limit === undefined || limit === null ? allRecipients.length : Math.max(0, Number(limit));
    const recipients = allRecipients.slice(start, start + batchLimit);
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
        totalRecipients: allRecipients.length,
        totalTickets,
        skippedNoEmail,
        recipients: allRecipients,
      });
    }

    const batchRecipients = recipients;
    const results = await mapWithConcurrency(batchRecipients, SEND_CONCURRENCY, async (r) => {
      try {
        const result = await sendEventReminderEmail({
          email: r.email,
          name: r.name,
          eventTitle: event.title,
          eventDate,
          eventLocation: event.location || "TBD",
          eventBanner: event.banner,
          organizerName: event.organizer?.name,
          ticketCount: r.ticketCount,
          tickets: r.tickets,
          eventId: event.id,
        });
        return { ok: result.success, error: result.success ? "" : String((result as { error?: unknown }).error || "Failed to send") };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });

    let sent = 0;
    const failures: { email: string; error: string }[] = [];
    results.forEach((result, index) => {
      if (result.ok) {
        sent += 1;
      } else {
        failures.push({ email: batchRecipients[index].email, error: result.error });
      }
    });

    console.log(`[Reminder] Event ${eventId}: batch offset=${start} limit=${batchLimit} sent ${sent}/${batchRecipients.length}, failed ${failures.length}`);

    return NextResponse.json({
      success: true,
      dryRun: false,
      eventTitle: event.title,
      batch: { offset: start, limit: batchLimit },
      sent,
      failed: failures.length,
      totalRecipients: allRecipients.length,
      batchRecipients: batchRecipients.length,
      totalTickets,
      skippedNoEmail,
      failures,
    });
  } catch (error) {
    console.error("Error sending event reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
