import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOrUpdateRsvp, digestInviteSecret, publicInviteShape, safeInviteeShape } from "@/lib/invitations";
import { rateLimit } from "@/lib/rate-limit-config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const limit = await rateLimit("inviteRsvp", request);
    if (!limit.success) return NextResponse.json({ error: "Too many RSVP attempts" }, { status: 429, headers: limit.headers });
    const { token } = await params;
    const invitee = await prisma.eventInvitee.findFirst({
      where: { tokenDigest: digestInviteSecret(token) },
      include: { invite: { include: { event: true } } },
    });
    if (!invitee || invitee.invite.status !== "ACTIVE" || invitee.invite.accessMode !== "TOKENIZED" || (invitee.expiresAt && invitee.expiresAt < new Date())) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const result = await createOrUpdateRsvp(invitee.invite, await request.json(), token);
    return NextResponse.json({
      success: true,
      invite: publicInviteShape(invitee.invite),
      invitee: result.primary ? safeInviteeShape(result.primary) : null,
      plusOnes: result.primary?.plusOnes?.map(safeInviteeShape) || [],
      plusOneCredentials: result.plusOneCredentials,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "RSVP failed" }, { status: 400 });
  }
}
