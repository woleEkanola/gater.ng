import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA not enabled" }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}