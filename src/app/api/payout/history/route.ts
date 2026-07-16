import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        transactionFeePercent: true,
        paystackSubaccountCode: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const feePercent = user.transactionFeePercent || 5;

    const [payoutRecords, totalRevenue, paidOrdersCount] = await Promise.all([
      prisma.payoutRecord.findMany({
        where: { userId: user.id },
        orderBy: { paidAt: "desc" },
        take: 50,
      }),
      prisma.order.aggregate({
        where: {
          event: { organizerId: user.id },
          status: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: {
          event: { organizerId: user.id },
          status: "PAID",
        },
      }),
    ]);

    const totalRevenueKobo = totalRevenue._sum.amount || 0;
    const totalRevenueNaira = totalRevenueKobo / 100;
    const netRevenueNaira = totalRevenueNaira * ((100 - feePercent) / 100);

    const totalSettled = payoutRecords.reduce((sum, r) => sum + r.amount, 0) / 100;
    const totalPending = netRevenueNaira - totalSettled;

    return NextResponse.json({
      feePercent,
      totalRevenue: Math.round(totalRevenueNaira),
      netRevenue: Math.round(netRevenueNaira),
      totalOrders: paidOrdersCount,
      totalSettled: Math.round(totalSettled),
      totalPending: Math.round(Math.max(0, totalPending)),
      payoutRecords: payoutRecords.map((r) => ({
        id: r.id,
        amount: r.amount,
        reference: r.reference,
        status: r.status,
        paidAt: r.paidAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching payout history:", error);
    return NextResponse.json({ error: "Failed to fetch payout history" }, { status: 500 });
  }
}
