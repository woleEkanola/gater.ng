import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  deliverInvitation,
  digestInviteSecret,
  generateInviteAccessCode,
  generateInviteToken,
  getManagedEvent,
} from "@/lib/invitations";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const { id: eventId, inviteId } = await params;
    const { user, event } = await getManagedEvent(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });

    const invite = await prisma.eventInvite.findFirst({
      where: { id: inviteId, eventId },
      include: { invitees: { where: { type: "PRIMARY" } } },
    });
    if (!invite) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invite.status === "REVOKED") return NextResponse.json({ error: "Invitation is revoked" }, { status: 400 });

    let sent = 0;
    const credentials: Array<{ inviteeId: string; token?: string; accessCode: string }> = [];
    for (const invitee of invite.invitees) {
      const token = invite.accessMode === "TOKENIZED" ? generateInviteToken() : undefined;
      const accessCode = generateInviteAccessCode();
      const updated = await prisma.eventInvitee.update({
        where: { id: invitee.id },
        data: {
          tokenDigest: token ? digestInviteSecret(token) : null,
          accessCodeDigest: digestInviteSecret(accessCode),
          accessCodeLast4: accessCode.slice(-4),
          expiresAt: new Date(event!.dateTime),
        },
      });
      await deliverInvitation({ invite, invitee: updated, event: event!, token, accessCode });
      credentials.push({ inviteeId: updated.id, token, accessCode });
      sent++;
    }

    return NextResponse.json({ success: true, sent, credentials });
  } catch (error) {
    console.error("Error resending event invitations:", error);
    return NextResponse.json({ error: "Failed to resend invitations" }, { status: 500 });
  }
}
