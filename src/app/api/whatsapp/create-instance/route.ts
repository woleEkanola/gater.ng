import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createInstance } from "@/lib/evolution-api";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const instanceName = `org-${user.id}`;

    const existing = await prisma.user.findFirst({
      where: { whatsappInstanceName: instanceName, whatsappConnected: true },
    });

    if (existing) {
      return NextResponse.json({ error: "WhatsApp already connected" }, { status: 400 });
    }

    const result = await createInstance(instanceName);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create instance" }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { whatsappInstanceName: instanceName, whatsappConnected: false },
    });

    return NextResponse.json({ success: true, instanceName });
  } catch (error: any) {
    console.error("Error creating WhatsApp instance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
