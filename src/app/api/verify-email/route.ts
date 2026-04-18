import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit-config";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit("auth", request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}