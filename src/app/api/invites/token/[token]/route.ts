import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { digestInviteSecret, publicInviteShape } from "@/lib/invitations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invitee = await prisma.eventInvitee.findFirst({
      where: { tokenDigest: digestInviteSecret(token) },
      include: { invite: { include: { event: true } }, plusOnes: true },
    });
    if (!invitee || invitee.invite.status !== "ACTIVE" || invitee.invite.accessMode !== "TOKENIZED" || (invitee.expiresAt && invitee.expiresAt < new Date())) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }
    return NextResponse.json({ invite: publicInviteShape(invitee.invite), invitee: {
      id: invitee.id,
      type: invitee.type,
      name: invitee.name,
      email: invitee.email,
      phone: invitee.phone,
      rsvpStatus: invitee.rsvpStatus,
      admissionStatus: invitee.admissionStatus,
      plusOnes: invitee.plusOnes.map((plusOne) => ({ id: plusOne.id, name: plusOne.name, rsvpStatus: plusOne.rsvpStatus })),
    } });
  } catch (error) {
    console.error("Error fetching tokenized invitation:", error);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}
