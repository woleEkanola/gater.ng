import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCheckinOtpEmail } from "@/lib/email";
import { sendCheckinOtpWhatsApp } from "@/lib/whatsapp-messages";

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
        user: true,
        event: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: staff.userId },
      data: {
        checkinOtp: otp,
        checkinOtpExpiry: otpExpiry,
      },
    });

    await sendCheckinOtpEmail(staff.user.email, otp);

    if (staff.user.phone) {
      sendCheckinOtpWhatsApp(staff.user.phone, otp, staff.event.organizerId).catch((err) =>
        console.error("WhatsApp OTP failed (non-blocking):", err)
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
