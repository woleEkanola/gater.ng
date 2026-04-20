import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit-config";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit("auth", request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomUUID();
    const verificationTokenExpiry = new Date(Date.now() + 86400000);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: "ORGANIZER",
        defaultDashboard: "organizer",
        verificationToken,
        verificationTokenExpiry,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { 
        message: "User created. Please check your email to verify your account.", 
        userId: user.id,
        requiresVerification: true 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
