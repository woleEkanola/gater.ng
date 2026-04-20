import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      return NextResponse.json({ error: "User already exists. Please login." }, { status: 400 });
    }

    const magicToken = crypto.randomUUID();
    const magicTokenExpiry = new Date(Date.now() + 86400000);

    const tempUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: "PENDING_SETUP",
        resetToken: magicToken,
        resetTokenExpiry: magicTokenExpiry,
        name: "Pending Setup",
        role: "ATTENDEE",
        defaultDashboard: "attendee",
      },
    });

    const emailResult = await sendPasswordResetEmail(email, magicToken, "set-password");

    if (!emailResult.success) {
      await prisma.user.delete({ where: { id: tempUser.id } });
      return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
    }

    return NextResponse.json({ message: "Magic link sent to your email" });
  } catch (error) {
    console.error("Error sending magic link:", error);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}