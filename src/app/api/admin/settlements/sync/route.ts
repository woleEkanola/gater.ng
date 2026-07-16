import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST() {
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

    const organizers = await prisma.user.findMany({
      where: {
        role: "ORGANIZER",
        payoutAccountNumber: { not: null },
      },
      select: {
        id: true,
        payoutAccountNumber: true,
        paystackSettlementBank: true,
      },
    });

    let allTransfers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const res = await fetch(
        `https://api.paystack.co/transfer?perPage=50&page=${page}&status=success`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) break;

      const data = await res.json();
      if (!data.status || !data.data) break;

      const transfers = data.data || [];
      allTransfers = allTransfers.concat(transfers);

      if (transfers.length < 50) hasMore = false;
      else page++;
    }

    let totalNew = 0;

    for (const transfer of allTransfers) {
      const accountNumber = transfer.recipient?.details?.account_number;
      const bankCode = transfer.recipient?.details?.bank_code;

      if (!accountNumber) continue;

      const matchedOrg = organizers.find(
        (o) =>
          o.payoutAccountNumber === accountNumber &&
          (!bankCode || !o.paystackSettlementBank || o.paystackSettlementBank === bankCode)
      );

      if (!matchedOrg) continue;

      const existing = await prisma.payoutRecord.findUnique({
        where: { reference: transfer.reference },
      });

      if (existing) continue;

      await prisma.payoutRecord.create({
        data: {
          userId: matchedOrg.id,
          amount: transfer.amount,
          reference: transfer.reference,
          status: transfer.status,
          paidAt: new Date(transfer.createdAt),
        },
      });

      totalNew++;
    }

    return NextResponse.json({
      success: true,
      newRecords: totalNew,
      totalTransfersChecked: allTransfers.length,
      organizersChecked: organizers.length,
    });
  } catch (error) {
    console.error("Error syncing payouts:", error);
    return NextResponse.json({ error: "Failed to sync payouts" }, { status: 500 });
  }
}
