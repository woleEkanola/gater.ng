import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const code = searchParams.get("code");
    const ticketTypeIds = searchParams.get("ticketTypeIds")?.split(",").filter(Boolean) || [];

    if (!eventId || !code) {
      return NextResponse.json({ error: "Event ID and code required" }, { status: 400 });
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: { code_eventId: { code: code.toUpperCase(), eventId } },
    });

    if (!discountCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    if (discountCode.maxUses && discountCode.usesCount >= discountCode.maxUses) {
      return NextResponse.json({ error: "Code usage limit reached" }, { status: 400 });
    }

    if (discountCode.validUntil && new Date() > discountCode.validUntil) {
      return NextResponse.json({ error: "Code has expired" }, { status: 400 });
    }

    // If the discount code is linked to a specific ticket type, validate it's in the cart
    if (discountCode.ticketTypeId) {
      if (ticketTypeIds.length === 0 || !ticketTypeIds.includes(discountCode.ticketTypeId)) {
        return NextResponse.json(
          { error: "This code is not valid for the selected ticket type" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      code: discountCode.code,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      ticketTypeId: discountCode.ticketTypeId,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }
}