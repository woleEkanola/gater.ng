import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getQRCode } from "@/lib/evolution-api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, whatsappInstanceName: true },
    });

    if (!user?.whatsappInstanceName) {
      return NextResponse.json({ error: "No WhatsApp instance found" }, { status: 404 });
    }

    const result = await getQRCode(user.whatsappInstanceName);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to get QR code" }, { status: 500 });
    }

    return NextResponse.json({ qrcode: result.qrcode });
  } catch (error: any) {
    console.error("Error getting QR code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
