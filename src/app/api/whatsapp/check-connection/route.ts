import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getConnectionState } from "@/lib/evolution-api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, whatsappInstanceName: true, whatsappConnected: true, whatsappPhone: true },
    });

    if (!user?.whatsappInstanceName) {
      return NextResponse.json({ connected: false, phone: null, instanceExists: false });
    }

    const result = await getConnectionState(user.whatsappInstanceName);
    const wasConnected = user.whatsappConnected;
    let changed = false;

    if (result.success) {
      if (result.connected && !wasConnected) {
        await prisma.user.update({
          where: { id: user.id },
          data: { whatsappConnected: true, whatsappPhone: result.phone || user.whatsappPhone },
        });
        changed = true;
      } else if (!result.connected && wasConnected) {
        await prisma.user.update({
          where: { id: user.id },
          data: { whatsappConnected: false, whatsappPhone: null },
        });
        changed = true;
      } else if (result.connected && result.phone && result.phone !== user.whatsappPhone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { whatsappPhone: result.phone },
        });
      }
    }

    return NextResponse.json({
      connected: result.success ? result.connected : wasConnected,
      phone: result.success ? (result.phone || null) : user.whatsappPhone,
      instanceExists: true,
      changed,
      state: result.success ? result.state : "unknown",
    });
  } catch (error: any) {
    console.error("Error checking WhatsApp connection:", error);
    return NextResponse.json({ error: error.message, connected: false }, { status: 500 });
  }
}
