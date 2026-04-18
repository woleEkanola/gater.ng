import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function createPaystackSubaccount(
  businessName: string,
  bankCode: string,
  accountNumber: string
): Promise<{ success: boolean; subaccountCode?: string; error?: string }> {
  try {
    const response = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to create subaccount" };
    }

    return { success: true, subaccountCode: data.data.subaccount_code };
  } catch (error) {
    console.error("Paystack API error:", error);
    return { success: false, error: "Failed to connect to Paystack" };
  }
}

async function validateBankAccount(
  bankCode: string,
  accountNumber: string
): Promise<{ success: boolean; accountName?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?bank_code=${bankCode}&account_number=${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Invalid account details" };
    }

    return { success: true, accountName: data.data.account_name };
  } catch (error) {
    console.error("Paystack API error:", error);
    return { success: false, error: "Failed to validate account" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
        paystackSubaccountCode: true,
        paystackSettlementBank: true,
        transactionFeePercent: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { payoutBankCode, payoutAccountNumber, payoutAccountName } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only organizers can set payout account" }, { status: 403 });
    }

    if (!payoutBankCode || !payoutAccountNumber || !payoutAccountName) {
      return NextResponse.json({ error: "All bank fields are required" }, { status: 400 });
    }

    const validation = await validateBankAccount(payoutBankCode, payoutAccountNumber);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const accountNameFromBank = validation.accountName;

    if (user.paystackSubaccountCode) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          payoutBankCode,
          payoutAccountNumber,
          payoutAccountName: accountNameFromBank,
          paystackSettlementBank: payoutBankCode,
        },
      });

      return NextResponse.json({
        success: true,
        payoutAccountName: updated.payoutAccountName,
      });
    }

    const businessName = user.name || user.email?.split("@")[0] || "Event Organizer";
    const subaccount = await createPaystackSubaccount(businessName, payoutBankCode, payoutAccountNumber);

    if (!subaccount.success) {
      return NextResponse.json({ error: subaccount.error }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        payoutBankCode,
        payoutAccountNumber,
        payoutAccountName: accountNameFromBank,
        paystackSubaccountCode: subaccount.subaccountCode,
        paystackSettlementBank: payoutBankCode,
      },
    });

    return NextResponse.json({
      success: true,
      payoutAccountName: updated.payoutAccountName,
      subaccountCreated: true,
    });
  } catch (error) {
    console.error("Error updating payout settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}