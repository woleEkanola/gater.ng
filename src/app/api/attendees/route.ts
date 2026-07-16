import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const format = searchParams.get("format") || "json";
    const discountCodeFilter = searchParams.get("discountCode");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "date_desc";

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const orderWhere: any = {
      eventId,
      status: "PAID",
    };

    if (discountCodeFilter && discountCodeFilter !== "ALL") {
      orderWhere.discountCode = discountCodeFilter;
    }

    if (search) {
      orderWhere.OR = [
        { buyerName: { contains: search } },
        { buyerEmail: { contains: search } },
      ];
    }

    const where: any = {
      deletedAt: null,
      order: orderWhere,
    };

    if (search) {
      where.OR = [
        { ticketId: { contains: search } },
        { order: { buyerName: { contains: search } } },
        { order: { buyerEmail: { contains: search } } },
        { owner: { name: { contains: search } } },
        { owner: { email: { contains: search } } },
      ];
      delete where.order.OR;
    }

    const orderBy: any = {};
    if (sort === "date_asc") orderBy.order = { paidAt: "asc" };
    else if (sort === "name_asc") orderBy.order = { buyerName: "asc" };
    else if (sort === "name_desc") orderBy.order = { buyerName: "desc" };
    else orderBy.createdAt = "desc";

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          ticketType: { select: { name: true } },
          owner: { select: { email: true, name: true } },
          order: { select: { discountCode: true, buyerName: true, buyerEmail: true, buyerPhone: true, paidAt: true, amount: true } },
        },
        orderBy,
        skip: format === "csv" ? 0 : (page - 1) * limit,
        take: format === "csv" ? undefined : limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    if (format === "csv") {
      const headers = ["Ticket ID", "Ticket Type", "Buyer Name", "Email", "Phone", "Promo Code", "Amount", "Purchase Date", "Status", "Used At"];
      const rows = tickets.map((t) => [
        t.ticketId,
        t.ticketType.name,
        t.order?.buyerName || t.owner?.name || "N/A",
        t.order?.buyerEmail || t.owner?.email || "N/A",
        t.order?.buyerPhone || "N/A",
        t.order?.discountCode || "N/A",
        t.order?.amount ? (t.order.amount / 100).toString() : "0",
        t.order?.paidAt ? new Date(t.order.paidAt).toLocaleDateString() : "",
        t.isUsed ? "Used" : t.checkedInCount > 0 ? "Partial" : "Not Used",
        t.usedAt?.toISOString() || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendees-${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}
