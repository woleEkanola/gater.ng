import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  if (user.mfaEnabled) {
    return NextResponse.json({ mfaEnabled: true });
  }
  
  const secret = speakeasy.generateSecret({
    name: `Gater.ng (${user.email})`,
    length: 20,
  });
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");
  
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: secret.base32 },
  });
  
  return NextResponse.json({
    mfaEnabled: false,
    qrCode: qrCodeUrl,
    secret: secret.base32,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  const { code, enable } = await request.json();
  
  if (enable) {
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret || "",
      encoding: "base32",
      token: code,
      window: 1,
    });
    
    if (!verified) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });
    
    return NextResponse.json({ mfaEnabled: true });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    
    return NextResponse.json({ mfaEnabled: false });
  }
}