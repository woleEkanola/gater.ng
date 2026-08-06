import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOrUpdateRsvp, publicInviteShape, safeInviteeShape } from "@/lib/invitations";
import { rateLimit } from "@/lib/rate-limit-config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const invite = await prisma.eventInvite.findUnique({ where: { publicSlug: slug }, include: { event: true } });
  if (!invite || invite.status === "REVOKED") return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (invite.accessMode !== "OPEN_RSVP") return NextResponse.json({ error: "This invitation requires a token" }, { status: 400 });
  return NextResponse.json(publicInviteShape(invite));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const limit = await rateLimit("inviteRsvp", request);
    if (!limit.success) return NextResponse.json({ error: "Too many RSVP attempts" }, { status: 429, headers: limit.headers });
    const { slug } = await params;
    const invite = await prisma.eventInvite.findUnique({ where: { publicSlug: slug }, include: { event: true } });
    if (!invite || invite.status !== "ACTIVE") return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invite.accessMode !== "OPEN_RSVP") return NextResponse.json({ error: "This invitation requires a token" }, { status: 400 });

    const result = await createOrUpdateRsvp(invite, await request.json());
    return NextResponse.json({
      success: true,
      invite: publicInviteShape(invite),
      accessCode: result.accessCode,
      invitee: result.primary ? safeInviteeShape(result.primary) : null,
      plusOnes: result.primary?.plusOnes?.map(safeInviteeShape) || [],
      plusOneCredentials: result.plusOneCredentials,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "RSVP failed" }, { status: 400 });
  }
}
