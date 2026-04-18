import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, email, name, amount, ticketData, eventId } = body;

    if (!orderId || !email || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
    }

    let splitConfig: Record<string, unknown> | undefined;

    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          organizer: { 
            select: { 
              id: true,
              payoutBankCode: true,
              payoutAccountNumber: true,
              paystackSubaccountCode: true,
              transactionFeePercent: true,
            } 
          } 
        },
      });

      if (event?.organizer?.paystackSubaccountCode) {
        const feePercent = event.organizer.transactionFeePercent || 5;
        const platformFee = Math.round((amount * feePercent) / 100);

        splitConfig = {
          type: "percentage",
          bearer_type: "account",
          subaccounts: [
            {
              subaccount: event.organizer.paystackSubaccountCode,
              share: 100 - feePercent,
            },
          ],
        };

        console.log(`Split payment: ${100 - feePercent}% to organizer, ${feePercent}% platform fee`);
      } else if (event?.organizer?.payoutBankCode && event?.organizer?.payoutAccountNumber) {
        const feePercent = event.organizer.transactionFeePercent || 5;
        const platformFee = Math.round((amount * feePercent) / 100);
        
        splitConfig = {
          type: "percentage",
          bearer_type: "account",
          subaccounts: [
            {
              subaccount: "ACCT_organizer_account",
              share: 100 - feePercent,
            },
          ],
        };

        console.log(`Split payment fallback: ${100 - feePercent}% to organizer, ${feePercent}% platform fee`);
      }
    }

    const requestBody: Record<string, unknown> = {
      email,
      amount,
      currency: "NGN",
      reference: orderId,
      metadata: {
        orderId,
        name,
        ticketData: ticketData || [],
      },
      callback_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/checkout/success?orderId=${orderId}`,
    };

    if (splitConfig) {
      requestBody.split = splitConfig;
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data: PaystackResponse = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({
      authorizationUrl: data.data?.authorization_url,
      reference: data.data?.reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}