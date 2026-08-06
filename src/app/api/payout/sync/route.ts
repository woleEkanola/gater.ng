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
      select: {
        id: true,
        payoutAccountNumber: true,
        paystackSettlementBank: true,
        paystackSubaccountCode: true,
      },
    });

    if (!user?.payoutAccountNumber) {
      return NextResponse.json({ error: "No bank account configured" }, { status: 400 });
    }

    let allTransfers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
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

      if (transfers.length < 50) {
        hasMore = false;
      } else {
        page++;
      }
    }

    let newCount = 0;

    for (const transfer of allTransfers) {
      const accountNumber = transfer.recipient?.details?.account_number;
      const bankCode = transfer.recipient?.details?.bank_code;

      if (!accountNumber) continue;

      const matchedUser = bankCode
        ? await prisma.user.findFirst({
            where: {
              payoutAccountNumber: accountNumber,
              paystackSettlementBank: bankCode,
            },
          })
        : await prisma.user.findFirst({
            where: { payoutAccountNumber: accountNumber },
          });

      if (!matchedUser || matchedUser.id !== user.id) continue;

      const existing = await prisma.payoutRecord.findUnique({
        where: { reference: transfer.reference },
      });

      if (existing) continue;

      await prisma.payoutRecord.create({
        data: {
          userId: matchedUser.id,
          amount: transfer.amount,
          reference: transfer.reference,
          status: transfer.status,
          paidAt: new Date(transfer.createdAt),
        },
      });

      newCount++;
    }

    return NextResponse.json({
      success: true,
      newRecords: newCount,
      totalTransfers: allTransfers.length,
    });
  } catch (error) {
    console.error("Error syncing payouts:", error);
    return NextResponse.json({ error: "Failed to sync payouts" }, { status: 500 });
  }
}
