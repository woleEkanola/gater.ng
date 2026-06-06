import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendCheckinInvitationEmail } from "@/lib/email";
import { sendCheckinInvitationWhatsApp } from "@/lib/whatsapp-messages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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

    const body = await request.json();
    const { email, phone } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let staffUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!staffUser) {
      staffUser = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: "PENDING_SETUP",
          role: "ATTENDEE",
          phone: phone || null,
        },
      });
    } else if (phone && !staffUser.phone) {
      await prisma.user.update({
        where: { id: staffUser.id },
        data: { phone },
      });
    }

    const existingStaff = await prisma.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: staffUser.id } },
    });

    if (existingStaff) {
      if (existingStaff.status === "ACTIVE") {
        return NextResponse.json({ error: "Staff member already active" }, { status: 400 });
      }
      if (existingStaff.status === "PENDING") {
        return NextResponse.json({ error: "Invitation already sent" }, { status: 400 });
      }
    }

    const token = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (existingStaff && existingStaff.status === "REVOKED") {
      await prisma.eventStaff.update({
        where: { id: existingStaff.id },
        data: { status: "PENDING", token, tokenExpiry, invitedAt: new Date() },
      });
    } else {
      await prisma.eventStaff.create({
        data: {
          eventId,
          userId: staffUser.id,
          role: "CHECKER",
          status: "PENDING",
          token,
          tokenExpiry,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.hitix.online";
    const acceptUrl = `${baseUrl}/checkin/accept?token=${token}&eventId=${eventId}`;

    await sendCheckinInvitationEmail(staffUser.email, token, eventId, event.title);

    if (staffUser.phone) {
      sendCheckinInvitationWhatsApp(staffUser.phone, event.title, acceptUrl, event.organizerId).catch((err) =>
        console.error("WhatsApp invitation failed (non-blocking):", err)
      );
    }

    return NextResponse.json({ success: true, message: "Invitation sent" });
  } catch (error: any) {
    console.error("Error inviting staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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

    const staff = await prisma.eventStaff.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, email: true, name: true, phone: true },
        },
      },
      orderBy: { invitedAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
