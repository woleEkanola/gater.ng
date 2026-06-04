import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { disconnectInstance } from "@/lib/evolution-api";

export async function POST(request: NextRequest) {
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

    const result = await disconnectInstance(user.whatsappInstanceName);

    await prisma.user.update({
      where: { id: user.id },
      data: { whatsappInstanceName: null, whatsappConnected: false, whatsappPhone: null },
    });

    if (!result.success) {
      return NextResponse.json({ success: true, warning: "Instance deleted from database but Evolution API returned: " + (result.error || "unknown error") });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error disconnecting WhatsApp:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
