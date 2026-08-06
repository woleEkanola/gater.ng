import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canAdmitGuests, findGuestInvitee, safeInviteeShape } from "@/lib/invitations";
import { rateLimit } from "@/lib/rate-limit-config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limit = await rateLimit("guestAdmission", request);
    if (!limit.success) return NextResponse.json({ error: "Too many admission attempts" }, { status: 429, headers: limit.headers });
    const { id: eventId } = await params;
    const { user, event } = await canAdmitGuests(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });

    const body = await request.json();
    const invitee = await findGuestInvitee(eventId, body);
    if (!invitee) return NextResponse.json({ error: "Guest invitation not found" }, { status: 404 });
    if (invitee.rsvpStatus !== "ACCEPTED") return NextResponse.json({ error: "Guest has not accepted the invitation" }, { status: 400 });

    const claimed = await prisma.eventInvitee.updateMany({
      where: { id: invitee.id, admissionStatus: "NOT_ADMITTED" },
      data: { admissionStatus: "ADMITTED", admittedAt: new Date() },
    });
    if (claimed.count === 0) return NextResponse.json({ error: "Guest has already been admitted" }, { status: 409 });

    const admission = await prisma.guestAdmission.create({
      data: {
        eventId,
        inviteeId: invitee.id,
        admittedById: user.id,
        method: body.method === "QR" ? "QR" : body.method === "NUMERIC_CODE" ? "NUMERIC_CODE" : "MANUAL",
      },
    });

    return NextResponse.json({ success: true, admissionId: admission.id, invitee: safeInviteeShape({ ...invitee, admissionStatus: "ADMITTED", admittedAt: admission.admittedAt }) });
  } catch (error) {
    console.error("Error admitting guest:", error);
    return NextResponse.json({ error: "Failed to admit guest" }, { status: 500 });
  }
}
