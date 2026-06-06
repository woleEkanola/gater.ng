import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendCheckinInvitationEmail } from "@/lib/email";
import { sendCheckinInvitationWhatsApp } from "@/lib/whatsapp-messages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: eventId, staffId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.eventStaff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff || staff.eventId !== eventId) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (staff.status === "ACTIVE") {
      return NextResponse.json({ error: "Staff member already active" }, { status: 400 });
    }

    const token = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.eventStaff.update({
      where: { id: staffId },
      data: { token, tokenExpiry, status: "PENDING", invitedAt: new Date() },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.hitix.online";
    const acceptUrl = `${baseUrl}/checkin/accept?token=${token}&eventId=${eventId}`;

    await sendCheckinInvitationEmail(staff.user.email, token, eventId, event.title);

    if (staff.user.phone) {
      sendCheckinInvitationWhatsApp(staff.user.phone, event.title, acceptUrl, event.organizerId).catch((err) =>
        console.error("WhatsApp invitation failed (non-blocking):", err)
      );
    }

    return NextResponse.json({ success: true, message: "Invitation resent" });
  } catch (error: any) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
