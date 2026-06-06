import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, eventId, otp } = body;

    if (!email || !eventId || !otp) {
      return NextResponse.json({ error: "Email, eventId, and OTP are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.checkinOtp || user.checkinOtp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (!user.checkinOtpExpiry || user.checkinOtpExpiry < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    const staff = await prisma.eventStaff.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "No pending invitation found" }, { status: 400 });
    }

    await prisma.eventStaff.update({
      where: { id: staff.id },
      data: { status: "ACTIVE" },
    });

    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        checkinOtp: null,
        checkinOtpExpiry: null,
        password: hashedPassword,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        checkinOtp: null,
        checkinOtpExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      redirectUrl: `/checkin/${eventId}`,
      tempCredentials: {
        email: user.email,
        password: tempPassword,
      },
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
