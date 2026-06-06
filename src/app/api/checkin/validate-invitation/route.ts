import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, eventId } = body;

    if (!token || !eventId) {
      return NextResponse.json({ error: "Token and eventId are required" }, { status: 400 });
    }

    const staff = await prisma.eventStaff.findFirst({
      where: {
        eventId,
        token,
        status: "PENDING",
        tokenExpiry: { gt: new Date() },
      },
      include: {
        user: { select: { email: true } },
        event: { select: { title: true } },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email: staff.user.email,
      eventTitle: staff.event.title,
    });
  } catch (error: any) {
    console.error("Error validating invitation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
