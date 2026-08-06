import { NextRequest, NextResponse } from "next/server";
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
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const invitee = await findGuestInvitee(eventId, await request.json());
    if (!invitee) return NextResponse.json({ valid: false, error: "Guest invitation not found" }, { status: 404 });
    if (invitee.rsvpStatus !== "ACCEPTED") return NextResponse.json({ valid: false, error: "Guest has not accepted the invitation" }, { status: 400 });
    if (invitee.admissionStatus === "ADMITTED") return NextResponse.json({ valid: false, error: "Guest has already been admitted", invitee: safeInviteeShape(invitee) }, { status: 409 });

    return NextResponse.json({ valid: true, invitee: safeInviteeShape(invitee), event: { id: event.id, title: event.title } });
  } catch (error) {
    console.error("Error validating guest admission:", error);
    return NextResponse.json({ error: "Failed to validate guest" }, { status: 500 });
  }
}
