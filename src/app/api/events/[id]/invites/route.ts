import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  deliverInvitation,
  digestInviteSecret,
  generateInviteAccessCode,
  generateInviteSlug,
  generateInviteToken,
  getManagedEvent,
  safeInviteeShape,
} from "@/lib/invitations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user, event } = await getManagedEvent(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });

    const invites = await prisma.eventInvite.findMany({
      where: { eventId },
      include: { invitees: { include: { plusOnes: true } }, _count: { select: { deliveries: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites.map((invite) => ({
      ...invite,
      invitees: invite.invitees.map(safeInviteeShape),
    })));
  } catch (error) {
    console.error("Error listing event invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user, event } = await getManagedEvent(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });
    if (event!.accessMode === "TICKETS") {
      return NextResponse.json({ error: "This event is configured for tickets only" }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const accessMode = body.accessMode || "OPEN_RSVP";
    if (!name) return NextResponse.json({ error: "Invitation name is required" }, { status: 400 });
    if (!(["OPEN_RSVP", "TOKENIZED"] as string[]).includes(accessMode)) {
      return NextResponse.json({ error: "Invalid invitation access mode" }, { status: 400 });
    }

    const maxPlusOnes = body.maxPlusOnes === null ? null : body.maxPlusOnes === undefined ? 1 : Number(body.maxPlusOnes);
    if (maxPlusOnes !== null && (!Number.isInteger(maxPlusOnes) || maxPlusOnes < 0)) {
      return NextResponse.json({ error: "maxPlusOnes must be a non-negative integer or null" }, { status: 400 });
    }

    const formConfig = body.formConfig && typeof body.formConfig === "object"
      ? body.formConfig
      : { requireName: true, requireEmail: true, requirePhone: false, plusOneRequireEmail: false, fields: [] };

    const invite = await prisma.eventInvite.create({
      data: {
        eventId,
        name,
        description: typeof body.description === "string" ? body.description.trim() : null,
        accessMode,
        maxPlusOnes,
        maxAttendees: body.maxAttendees === undefined || body.maxAttendees === null ? null : Number(body.maxAttendees),
        rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
        formConfig,
        customMessage: typeof body.customMessage === "string" ? body.customMessage : null,
        customProperties: body.customProperties || undefined,
        publicSlug: generateInviteSlug(name),
      },
    });

    const rawCredentials: Array<{ invitee: any; token?: string; accessCode: string }> = [];
    const invitees = Array.isArray(body.invitees) ? body.invitees : [];
    for (const input of invitees) {
      const inviteeName = typeof input?.name === "string" ? input.name.trim() : "";
      if (!inviteeName) continue;
      const token = accessMode === "TOKENIZED" ? generateInviteToken() : undefined;
      const accessCode = generateInviteAccessCode();
      const invitee = await prisma.eventInvitee.create({
        data: {
          inviteId: invite.id,
          type: "PRIMARY",
          name: inviteeName,
          email: typeof input.email === "string" ? input.email.trim().toLowerCase() : null,
          phone: typeof input.phone === "string" ? input.phone.trim() : null,
          tokenDigest: token ? digestInviteSecret(token) : null,
          accessCodeDigest: digestInviteSecret(accessCode),
          accessCodeLast4: accessCode.slice(-4),
          expiresAt: new Date(event!.dateTime),
        },
      });
      rawCredentials.push({ invitee, token, accessCode });
    }

    await Promise.all(rawCredentials.map(({ invitee, token, accessCode }) => deliverInvitation({
      invite,
      invitee,
      event: event!,
      token,
      accessCode,
    })));

    const created = await prisma.eventInvite.findUnique({
      where: { id: invite.id },
      include: { invitees: true },
    });

    return NextResponse.json({
      ...created,
      invitees: created?.invitees.map(safeInviteeShape),
      credentials: rawCredentials.map(({ invitee, token, accessCode }) => ({
        inviteeId: invitee.id,
        token,
        accessCode,
      })),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event invitation:", error);
    return NextResponse.json({ error: error.message || "Failed to create invitation" }, { status: 500 });
  }
}
