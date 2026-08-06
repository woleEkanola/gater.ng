import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getManagedEvent, safeInviteeShape } from "@/lib/invitations";

async function updateInvite(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const { id: eventId, inviteId } = await params;
    const { user, event } = await getManagedEvent(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });

    const existing = await prisma.eventInvite.findFirst({ where: { id: inviteId, eventId } });
    if (!existing) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Invitation name is required" }, { status: 400 });
      data.name = body.name.trim();
    }
    if (body.accessMode !== undefined) {
      if (!["OPEN_RSVP", "TOKENIZED"].includes(body.accessMode)) return NextResponse.json({ error: "Invalid invitation access mode" }, { status: 400 });
      data.accessMode = body.accessMode;
    }
    if (body.maxPlusOnes !== undefined) {
      const value = body.maxPlusOnes === null ? null : Number(body.maxPlusOnes);
      if (value !== null && (!Number.isInteger(value) || value < 0)) return NextResponse.json({ error: "Invalid maxPlusOnes" }, { status: 400 });
      data.maxPlusOnes = value;
    }
    if (body.formConfig !== undefined) data.formConfig = body.formConfig;
    if (body.status !== undefined) {
       if (!["ACTIVE", "PAUSED", "ARCHIVED", "REVOKED"].includes(body.status)) return NextResponse.json({ error: "Invalid invitation status" }, { status: 400 });
      data.status = body.status;
    }

    const invite = await prisma.eventInvite.update({
      where: { id: inviteId },
      data,
      include: { invitees: true },
    });
    return NextResponse.json({ ...invite, invitees: invite.invitees.map(safeInviteeShape) });
  } catch (error) {
    console.error("Error updating event invitation:", error);
    return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 });
  }
}

export const PUT = updateInvite;
export const PATCH = updateInvite;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const { id: eventId, inviteId } = await params;
    const { user, event } = await getManagedEvent(eventId);
    if (!user) return NextResponse.json({ error: event ? "Forbidden" : "Unauthorized" }, { status: event ? 403 : 401 });

    const existing = await prisma.eventInvite.findFirst({ where: { id: inviteId, eventId } });
    if (!existing) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

    const invite = await prisma.eventInvite.update({ where: { id: inviteId }, data: { status: "REVOKED" } });
    return NextResponse.json({ success: true, inviteId: invite.id, status: invite.status });
  } catch (error) {
    console.error("Error revoking event invitation:", error);
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 });
  }
}
