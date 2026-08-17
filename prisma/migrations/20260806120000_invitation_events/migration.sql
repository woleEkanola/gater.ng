DO $$ BEGIN
  CREATE TYPE "EventAccessMode" AS ENUM ('TICKETS', 'INVITES', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InviteAccessMode" AS ENUM ('OPEN_RSVP', 'TOKENIZED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InviteStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InviteeType" AS ENUM ('PRIMARY', 'PLUS_ONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GuestAdmissionStatus" AS ENUM ('NOT_ADMITTED', 'ADMITTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationChannel" AS ENUM ('EMAIL', 'WHATSAPP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "accessMode" "EventAccessMode" NOT NULL DEFAULT 'TICKETS';

CREATE TABLE IF NOT EXISTS "EventInvite" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "accessMode" "InviteAccessMode" NOT NULL,
  "maxPlusOnes" INTEGER DEFAULT 1,
  "maxAttendees" INTEGER,
  "rsvpDeadline" TIMESTAMP(3),
  "formConfig" JSONB NOT NULL DEFAULT '{}',
  "customMessage" TEXT,
  "customProperties" JSONB,
  "publicSlug" TEXT NOT NULL,
  "status" "InviteStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventInvitee" (
  "id" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "primaryInviteeId" TEXT,
  "type" "InviteeType" NOT NULL DEFAULT 'PRIMARY',
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "tokenDigest" TEXT,
  "accessCodeDigest" TEXT,
  "accessCodeLast4" TEXT,
  "formResponse" JSONB,
  "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
  "rsvpAt" TIMESTAMP(3),
  "admissionStatus" "GuestAdmissionStatus" NOT NULL DEFAULT 'NOT_ADMITTED',
  "admittedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventInvitee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuestAdmission" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "inviteeId" TEXT NOT NULL,
  "admittedById" TEXT,
  "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "method" TEXT NOT NULL DEFAULT 'MANUAL',
  "notes" TEXT,
  CONSTRAINT "GuestAdmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvitationDelivery" (
  "id" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "inviteeId" TEXT,
  "channel" "InvitationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "InvitationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "providerId" TEXT,
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventInvite_publicSlug_key" ON "EventInvite"("publicSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "EventInvitee_tokenDigest_key" ON "EventInvitee"("tokenDigest");
CREATE INDEX IF NOT EXISTS "EventInvite_eventId_idx" ON "EventInvite"("eventId");
CREATE INDEX IF NOT EXISTS "EventInvite_eventId_status_idx" ON "EventInvite"("eventId", "status");
CREATE INDEX IF NOT EXISTS "EventInvitee_inviteId_idx" ON "EventInvitee"("inviteId");
CREATE INDEX IF NOT EXISTS "EventInvitee_inviteId_rsvpStatus_idx" ON "EventInvitee"("inviteId", "rsvpStatus");
CREATE INDEX IF NOT EXISTS "EventInvitee_inviteId_accessCodeDigest_idx" ON "EventInvitee"("inviteId", "accessCodeDigest");
CREATE INDEX IF NOT EXISTS "EventInvitee_primaryInviteeId_idx" ON "EventInvitee"("primaryInviteeId");
CREATE INDEX IF NOT EXISTS "GuestAdmission_eventId_idx" ON "GuestAdmission"("eventId");
CREATE INDEX IF NOT EXISTS "GuestAdmission_inviteeId_idx" ON "GuestAdmission"("inviteeId");
CREATE INDEX IF NOT EXISTS "InvitationDelivery_inviteId_idx" ON "InvitationDelivery"("inviteId");
CREATE INDEX IF NOT EXISTS "InvitationDelivery_inviteeId_idx" ON "InvitationDelivery"("inviteeId");

DO $$ BEGIN
  ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventInvitee" ADD CONSTRAINT "EventInvitee_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "EventInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventInvitee" ADD CONSTRAINT "EventInvitee_primaryInviteeId_fkey" FOREIGN KEY ("primaryInviteeId") REFERENCES "EventInvitee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GuestAdmission" ADD CONSTRAINT "GuestAdmission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GuestAdmission" ADD CONSTRAINT "GuestAdmission_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "EventInvitee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GuestAdmission" ADD CONSTRAINT "GuestAdmission_admittedById_fkey" FOREIGN KEY ("admittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InvitationDelivery" ADD CONSTRAINT "InvitationDelivery_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "EventInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InvitationDelivery" ADD CONSTRAINT "InvitationDelivery_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "EventInvitee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
