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

    // If the current user already has an instance (connected or not), allow reconnecting
    if (user.whatsappInstanceName) {
      return NextResponse.json({ success: true, instanceName: user.whatsappInstanceName, alreadyExists: true });
    }

    const result = await createInstance(instanceName);

    if (!result.success) {
      // If instance already exists on Evolution API, just link it in our DB
      if (result.error?.toLowerCase().includes("already") || result.error?.toLowerCase().includes("exists")) {
        await prisma.user.update({
          where: { id: user.id },
          data: { whatsappInstanceName: instanceName, whatsappConnected: false },
        });
        return NextResponse.json({ success: true, instanceName, recovered: true });
      }
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
