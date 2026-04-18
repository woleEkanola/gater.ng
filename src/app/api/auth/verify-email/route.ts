import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    const verificationToken = crypto.randomUUID();
    const verificationTokenExpiry = new Date(Date.now() + 86400000);

    await prisma.user.update({
      where: { email },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}