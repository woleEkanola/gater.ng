import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface AffectedOrder {
  orderId: string;
  buyerEmail: string | null;
  buyerName: string | null;
  ticketsFound: number;
  expectedTickets: number;
  duplicatesToDelete: number;
  ticketIdsToDelete: string[];
}

interface AmbiguousOrder {
  orderId: string;
  buyerEmail: string | null;
  ticketsFound: number;
  reason: string;
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { eventId, ticketTypeId, dryRun } = body;

    if (!eventId || !ticketTypeId) {
      return NextResponse.json({ error: "eventId and ticketTypeId are required" }, { status: 400 });
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    if (!ticketType || ticketType.eventId !== eventId) {
      return NextResponse.json({ error: "Ticket type not found for this event" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { eventId, status: "PAID" },
      include: {
        tickets: {
          include: { checkIns: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const affectedOrders: AffectedOrder[] = [];
    const ambiguousOrders: AmbiguousOrder[] = [];

    for (const order of orders) {
      const targetTickets = order.tickets.filter((t) => t.ticketTypeId === ticketTypeId);
      if (targetTickets.length === 0) continue;

      const distinctTypes = new Set(order.tickets.map((t) => t.ticketTypeId)).size;
      const buyerEmail = order.buyerEmail;
      const buyerName = order.buyerName;

      if (distinctTypes > 1) {
        ambiguousOrders.push({
          orderId: order.id,
          buyerEmail,
          ticketsFound: targetTickets.length,
          reason: "Order contains multiple ticket types - manual review required",
        });
        continue;
      }

      const expectedTickets = Math.round((order.amount + order.discountAmount) / ticketType.price);

      if (expectedTickets <= 0) {
        ambiguousOrders.push({
          orderId: order.id,
          buyerEmail,
          ticketsFound: targetTickets.length,
          reason: "Could not determine expected ticket count from order amount",
        });
        continue;
      }

      if (targetTickets.length !== expectedTickets * 2) {
        continue;
      }

      const ticketsToKeep = targetTickets.slice(0, expectedTickets);
      const ticketsToDelete = targetTickets.slice(expectedTickets);

      const hasProtectedTicket = ticketsToDelete.some(
        (t) => t.isUsed || t.checkIns.length > 0
      );

      if (hasProtectedTicket) {
        ambiguousOrders.push({
          orderId: order.id,
          buyerEmail,
          ticketsFound: targetTickets.length,
          reason: "Duplicate tickets are used or checked in - skipped to protect data",
        });
        continue;
      }

      affectedOrders.push({
        orderId: order.id,
        buyerEmail,
        buyerName,
        ticketsFound: targetTickets.length,
        expectedTickets,
        duplicatesToDelete: ticketsToDelete.length,
        ticketIdsToDelete: ticketsToDelete.map((t) => t.id),
      });
    }

    const totalDuplicates = affectedOrders.reduce((sum, o) => sum + o.duplicatesToDelete, 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        ticketType: { id: ticketType.id, name: ticketType.name, price: ticketType.price },
        affectedOrders: affectedOrders.map(({ ticketIdsToDelete, ...rest }) => rest),
        ambiguousOrders,
        totalDuplicates,
        totalAffectedOrders: affectedOrders.length,
        totalSkippedOrders: ambiguousOrders.length,
      });
    }

    const allTicketIdsToDelete = affectedOrders.flatMap((o) => o.ticketIdsToDelete);

    if (allTicketIdsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun: false,
        deletedTickets: 0,
        affectedOrders: 0,
        soldCountBefore: ticketType.soldCount,
        soldCountAfter: ticketType.soldCount,
      });
    }

    await prisma.$transaction([
      prisma.ticket.deleteMany({
        where: { id: { in: allTicketIdsToDelete } },
      }),
      prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: { soldCount: { decrement: totalDuplicates } },
      }),
    ]);

    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      deletedTickets: totalDuplicates,
      affectedOrders: affectedOrders.length,
      soldCountBefore: ticketType.soldCount,
      soldCountAfter: updatedTicketType?.soldCount ?? ticketType.soldCount - totalDuplicates,
      skippedOrders: ambiguousOrders.length,
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    return NextResponse.json({ error: "Failed to clean up duplicates" }, { status: 500 });
  }
}
