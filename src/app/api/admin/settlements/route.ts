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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const userWhere: any = {
      role: "ORGANIZER",
      events: { some: { orders: { some: { status: "PAID" } } } },
    };

    if (search) {
      userWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [organizers, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          transactionFeePercent: true,
          payoutBankCode: true,
          payoutAccountNumber: true,
          payoutAccountName: true,
          paystackSubaccountCode: true,
          _count: { select: { events: { where: { orders: { some: { status: "PAID" } } } } } },
          events: {
            select: {
              orders: {
                where: { status: "PAID" },
                select: { amount: true },
              },
            },
          },
          payoutRecords: {
            orderBy: { paidAt: "desc" },
            select: {
              id: true,
              amount: true,
              reference: true,
              paidAt: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: userWhere }),
    ]);

    const rows = organizers.map((o) => {
      const totalRevenueKobo = o.events.reduce(
        (sum, e) => sum + e.orders.reduce((s, ord) => s + ord.amount, 0),
        0
      );
      const feePercent = o.transactionFeePercent || 5;
      const totalRevenue = Math.round(totalRevenueKobo / 100);
      const expectedSettlement = Math.round(totalRevenue * ((100 - feePercent) / 100));
      const actualSettled = Math.round(
        o.payoutRecords.reduce((sum, pr) => sum + pr.amount, 0) / 100
      );

      return {
        id: o.id,
        name: o.name || o.email,
        email: o.email,
        totalRevenue,
        feePercent,
        expectedSettlement,
        actualSettled,
        pending: Math.max(0, expectedSettlement - actualSettled),
        hasBankSetup: !!(o.payoutBankCode && o.payoutAccountNumber && o.payoutAccountName),
        hasSubaccount: !!o.paystackSubaccountCode,
        eventCount: o._count.events,
        orderCount: o.events.reduce((sum, e) => sum + e.orders.length, 0),
        payoutRecords: o.payoutRecords.map((pr) => ({
          id: pr.id,
          amount: pr.amount,
          reference: pr.reference,
          paidAt: pr.paidAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({
      organizers: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
  }
}
