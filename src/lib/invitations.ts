import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { sendInvitationWhatsApp } from "@/lib/whatsapp-messages";

export function digestInviteSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateInviteAccessCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateInviteSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invite";
  return `${base}-${crypto.randomBytes(4).toString("hex")}`;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export function publicInviteUrl(publicSlug: string): string {
  return `${appUrl()}/invites/${publicSlug}`;
}

export function tokenInviteUrl(token: string): string {
  return `${appUrl()}/invites/token/${token}`;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function getManagedEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, event: null };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { user, event: null };

  const canManage = event.organizerId === user.id || user.role === "ADMIN" || user.role === "SUPERADMIN";
  return { user: canManage ? user : null, event };
}

export async function canAdmitGuests(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, event: null };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { user, event: null };

  const isStaff = await prisma.eventStaff.findFirst({
    where: { eventId, userId: user.id, status: "ACTIVE" },
  });
  const allowed = event.organizerId === user.id || user.role === "ADMIN" || user.role === "SUPERADMIN" || !!isStaff;
  return { user: allowed ? user : null, event };
}

export function publicInviteShape(invite: any) {
  return {
    id: invite.id,
    name: invite.name,
    accessMode: invite.accessMode,
    maxPlusOnes: invite.maxPlusOnes,
    maxAttendees: invite.maxAttendees,
    rsvpDeadline: invite.rsvpDeadline,
    formConfig: invite.formConfig,
    description: invite.description,
    customMessage: invite.customMessage,
    publicSlug: invite.publicSlug,
    status: invite.status,
    event: invite.event ? {
      id: invite.event.id,
      title: invite.event.title,
      dateTime: invite.event.dateTime,
      location: invite.event.location,
      banner: invite.event.banner,
      requireEmail: invite.event.requireEmail,
      requirePhone: invite.event.requirePhone,
    } : undefined,
  };
}

export function safeInviteeShape(invitee: any) {
  return {
    id: invitee.id,
    type: invitee.type,
    name: invitee.name,
    email: invitee.email,
    phone: invitee.phone,
    rsvpStatus: invitee.rsvpStatus,
    rsvpAt: invitee.rsvpAt,
    admissionStatus: invitee.admissionStatus,
    admittedAt: invitee.admittedAt,
    accessCodeLast4: invitee.accessCodeLast4,
    primaryInviteeId: invitee.primaryInviteeId,
    formResponse: invitee.formResponse,
  };
}

export async function findGuestInvitee(eventId: string, input: {
  inviteeId?: string;
  token?: string;
  accessCode?: string;
}) {
  const where: any = {
    invite: { eventId, status: "ACTIVE" },
  };

  if (input.inviteeId) where.id = input.inviteeId;
  if (input.token) where.tokenDigest = digestInviteSecret(input.token);
  if (input.accessCode) where.accessCodeDigest = digestInviteSecret(input.accessCode);
  if (!input.inviteeId && !input.token && !input.accessCode) return null;

  const invitee = await prisma.eventInvitee.findFirst({
    where,
    include: { invite: { include: { event: true } }, primaryInvitee: true },
  });

  if (!invitee || invitee.invite.eventId !== eventId || invitee.invite.event.accessMode === "TICKETS" || invitee.invite.status !== "ACTIVE") return null;
  if (invitee.expiresAt && invitee.expiresAt < new Date()) return null;
  return invitee;
}

export function validatePlusOnes(maxPlusOnes: number | null, value: unknown): number {
  const count = value === undefined || value === null || value === "" ? 0 : Number(value);
  if (!Number.isInteger(count) || count < 0 || (maxPlusOnes !== null && count > maxPlusOnes)) {
    throw new Error(maxPlusOnes === null ? "Invalid plus-one count" : `A maximum of ${maxPlusOnes} plus-one(s) is allowed`);
  }
  return count;
}

export async function createOrUpdateRsvp(invite: any, body: any, token?: string) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const config = invite.formConfig && typeof invite.formConfig === "object" ? invite.formConfig : {};
  const requireEmail = config.requireEmail !== undefined ? Boolean(config.requireEmail) : true;
  const requirePhone = Boolean(config.requirePhone);
  const plusOneRequireEmail = Boolean(config.plusOneRequireEmail);
  const rsvpStatus = body.rsvpStatus === "DECLINED" ? "DECLINED" : "ACCEPTED";
  if (!name) throw new Error("Name is required");
  if (requireEmail && !email) throw new Error("Email is required");
  if (requirePhone && !phone) throw new Error("Phone number is required");

  if (invite.rsvpDeadline && new Date(invite.rsvpDeadline) < new Date()) {
    throw new Error("RSVPs are closed for this invitation");
  }

  let primary = token
    ? await prisma.eventInvitee.findFirst({ where: { tokenDigest: digestInviteSecret(token), inviteId: invite.id } })
    : null;
  const accessCode = token ? null : generateInviteAccessCode();

  const plusOneEntries = Array.isArray(body.plusOnes)
    ? body.plusOnes
    : Array.from({ length: Number(body.plusOnes || 0) }, (_, index) => ({ name: body.plusOneNames?.[index] }));
  const plusOnes = validatePlusOnes(invite.maxPlusOnes, plusOneEntries.length);
  if (invite.maxAttendees) {
    const currentCount = await prisma.eventInvitee.count({ where: { inviteId: invite.id } });
    if (currentCount + 1 + plusOnes > invite.maxAttendees) throw new Error("This invitation has reached its attendee limit");
  }

  if (primary && body.accessCode && primary.accessCodeDigest !== digestInviteSecret(String(body.accessCode))) {
    throw new Error("Invalid access code");
  }

  if (!primary) {
    primary = await prisma.eventInvitee.create({
      data: {
        inviteId: invite.id,
        type: "PRIMARY",
        name,
        email,
        phone,
        tokenDigest: token ? digestInviteSecret(token) : null,
        accessCodeDigest: accessCode ? digestInviteSecret(accessCode) : null,
        accessCodeLast4: accessCode ? accessCode.slice(-4) : null,
        expiresAt: new Date(invite.event.dateTime),
        formResponse: body.formResponse ?? undefined,
        rsvpStatus,
        rsvpAt: new Date(),
      },
    });
  } else {
    primary = await prisma.eventInvitee.update({
      where: { id: primary.id },
      data: {
        name,
        email,
        phone,
        expiresAt: new Date(invite.event.dateTime),
        formResponse: body.formResponse ?? undefined,
        rsvpStatus,
        rsvpAt: new Date(),
      },
    });
  }

  if (rsvpStatus === "DECLINED") {
    const declined = await prisma.eventInvitee.findUnique({ where: { id: primary.id }, include: { plusOnes: true } });
    return { primary: declined, accessCode: null, plusOneCredentials: [] };
  }

  const existingPlusOnes = await prisma.eventInvitee.count({ where: { primaryInviteeId: primary.id } });
  if (plusOnes < existingPlusOnes) {
    throw new Error("Existing plus-ones cannot be removed from an RSVP");
  }

  const plusOneCredentials: Array<{ inviteeId: string; accessCode: string }> = [];
  for (let i = existingPlusOnes; i < plusOnes; i++) {
    const plusOne = plusOneEntries[i] || {};
    const plusOneName = typeof plusOne.name === "string" ? plusOne.name.trim() : "";
    if (!plusOneName) throw new Error(`Name is required for plus-one ${i + 1}`);
    const plusOneEmail = typeof plusOne.email === "string" && plusOne.email.trim() ? plusOne.email.trim().toLowerCase() : null;
    if (plusOneRequireEmail && !plusOneEmail) throw new Error(`Email is required for plus-one ${i + 1}`);
    const plusOneAccessCode = generateInviteAccessCode();
    const createdPlusOne = await prisma.eventInvitee.create({
      data: {
        inviteId: invite.id,
        primaryInviteeId: primary.id,
        type: "PLUS_ONE",
        name: plusOneName,
        email: plusOneEmail,
        phone: typeof plusOne.phone === "string" ? plusOne.phone.trim() || null : null,
        accessCodeDigest: digestInviteSecret(plusOneAccessCode),
        accessCodeLast4: plusOneAccessCode.slice(-4),
        expiresAt: new Date(invite.event.dateTime),
        rsvpStatus: "ACCEPTED",
        rsvpAt: new Date(),
      },
    });
    plusOneCredentials.push({ inviteeId: createdPlusOne.id, accessCode: plusOneAccessCode });
  }

  const result = await prisma.eventInvitee.findUnique({
    where: { id: primary.id },
    include: { plusOnes: true },
  });

  return { primary: result, accessCode, plusOneCredentials };
}

export async function deliverInvitation(data: {
  invite: any;
  invitee: any;
  event: any;
  token?: string;
  accessCode?: string;
}) {
  const inviteUrl = data.token ? tokenInviteUrl(data.token) : publicInviteUrl(data.invite.publicSlug);
  const common = {
    name: data.invitee.name,
    eventTitle: data.event.title,
    eventDate: new Date(data.event.dateTime).toLocaleString("en-NG"),
    eventLocation: data.event.location || "TBD",
    inviteUrl,
    accessCode: data.accessCode,
  };
  const deliveries: Promise<unknown>[] = [];

  if (data.invitee.email) {
    deliveries.push((async () => {
      const delivery = await prisma.invitationDelivery.create({
        data: {
          inviteId: data.invite.id,
          inviteeId: data.invitee.id,
          channel: "EMAIL",
          recipient: data.invitee.email,
        },
      });
      const result = await sendInvitationEmail({ email: data.invitee.email, ...common });
      await prisma.invitationDelivery.update({
        where: { id: delivery.id },
        data: result.success ? { status: "SENT", sentAt: new Date() } : { status: "FAILED", error: String(result.error) },
      });
    })());
  }

  if (data.invitee.phone) {
    deliveries.push((async () => {
      const delivery = await prisma.invitationDelivery.create({
        data: {
          inviteId: data.invite.id,
          inviteeId: data.invitee.id,
          channel: "WHATSAPP",
          recipient: data.invitee.phone,
        },
      });
      const sent = await sendInvitationWhatsApp({
        phone: data.invitee.phone,
        organizerId: data.event.organizerId,
        ...common,
      });
      await prisma.invitationDelivery.update({
        where: { id: delivery.id },
        data: sent ? { status: "SENT", sentAt: new Date() } : { status: "FAILED", error: "WhatsApp delivery failed" },
      });
    })());
  }

  await Promise.allSettled(deliveries);
}
