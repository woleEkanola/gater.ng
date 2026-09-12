-- Reconcile schema drift introduced via `prisma db push` after the base
-- migration. Every statement is idempotent (IF NOT EXISTS / duplicate_object
-- guards) so this migration can be applied to databases at any prior state
-- without data loss.

-- 1. Role enum gained SUPERADMIN after base
DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Event.organizerId FK changed from ON DELETE RESTRICT (base) to CASCADE (schema)
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_organizerId_fkey";

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. CheckIn.ticketId is no longer unique in the schema
DROP INDEX IF EXISTS "CheckIn_ticketId_key";

-- 4. Event columns added after base
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "accessInstructions" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "hideAddress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "hideStreamingLink" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "highlights" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requireEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requirePhone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "showMap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "speakerLabel" TEXT DEFAULT 'Speakers';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "streamingLink" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'location' AND is_nullable = 'NO') THEN
    ALTER TABLE "Event" ALTER COLUMN "location" DROP NOT NULL;
  END IF;
END $$;

-- 5. Order columns added after base
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountCode" TEXT;

-- 6. Ticket columns added after base
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "checkedInCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "groupSize" INTEGER NOT NULL DEFAULT 1;

-- 7. TicketType columns added after base
ALTER TABLE "TicketType" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "TicketType" ADD COLUMN IF NOT EXISTS "groupSize" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "TicketType" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- 8. User columns added after base
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "checkinOtp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "checkinOtpExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultDashboard" TEXT NOT NULL DEFAULT 'organizer';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoutBankName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paystackSettlementBank" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paystackSubaccountCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappInstanceName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT;

-- 9. Tables added after base
CREATE TABLE IF NOT EXISTS "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "question" TEXT;
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "answer" TEXT;
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "Faq" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "ticketTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created (e.g. ticketTypeId)
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "discountType" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "discountValue" INTEGER;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "usesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "ticketTypeId" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "Follow" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Follow" ADD COLUMN IF NOT EXISTS "followerId" TEXT;
ALTER TABLE "Follow" ADD COLUMN IF NOT EXISTS "followingId" TEXT;
ALTER TABLE "Follow" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "Wishlist" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Wishlist" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Wishlist" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "Wishlist" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#6366f1';
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EventGallery" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGallery_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "EventGallery" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "EventGallery" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "EventGallery" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "EventGallery" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "EventGallery" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Speaker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "title" TEXT,
    "company" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "Speaker" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EventFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFollow_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "EventFollow" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "EventFollow" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "EventFollow" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "EventFollow" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EventStaff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CHECKER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventStaff_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'CHECKER';
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "tokenExpiry" TIMESTAMP(3);
ALTER TABLE "EventStaff" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AudienceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceType_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "AudienceType" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "AudienceType" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "AudienceType" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AudienceType" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AudienceType" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "B2BLandingPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "h1Title" TEXT NOT NULL,
    "subHeadline" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "featuresJson" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL DEFAULT 'Create Your Event',
    "ctaLink" TEXT NOT NULL DEFAULT '/dashboard/events/new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2BLandingPage_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "h1Title" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "subHeadline" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "intent" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "featuresJson" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "ctaText" TEXT NOT NULL DEFAULT 'Create Your Event';
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "ctaLink" TEXT NOT NULL DEFAULT '/dashboard/events/new';
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "B2BLandingPage" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PayoutRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutRecord_pkey" PRIMARY KEY ("id")
);

-- Columns that may have been added after the table was first created
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "amount" INTEGER;
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'success';
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "PayoutRecord" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "_EventToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Columns that may have been added after the table was first created
ALTER TABLE "_EventToTag" ADD COLUMN IF NOT EXISTS "A" TEXT;
ALTER TABLE "_EventToTag" ADD COLUMN IF NOT EXISTS "B" TEXT;

-- 10. Indexes added after base
CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCode_code_eventId_key" ON "DiscountCode"("code", "eventId");
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");
CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_userId_eventId_key" ON "Wishlist"("userId", "eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE INDEX IF NOT EXISTS "EventGallery_eventId_idx" ON "EventGallery"("eventId");
CREATE INDEX IF NOT EXISTS "Speaker_eventId_idx" ON "Speaker"("eventId");
CREATE INDEX IF NOT EXISTS "EventFollow_userId_idx" ON "EventFollow"("userId");
CREATE INDEX IF NOT EXISTS "EventFollow_eventId_idx" ON "EventFollow"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventFollow_userId_eventId_key" ON "EventFollow"("userId", "eventId");
CREATE INDEX IF NOT EXISTS "EventStaff_eventId_idx" ON "EventStaff"("eventId");
CREATE INDEX IF NOT EXISTS "EventStaff_userId_idx" ON "EventStaff"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventStaff_eventId_userId_key" ON "EventStaff"("eventId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AudienceType_name_key" ON "AudienceType"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "B2BLandingPage_slug_key" ON "B2BLandingPage"("slug");
CREATE INDEX IF NOT EXISTS "B2BLandingPage_slug_idx" ON "B2BLandingPage"("slug");
CREATE INDEX IF NOT EXISTS "B2BLandingPage_targetAudience_idx" ON "B2BLandingPage"("targetAudience");
CREATE INDEX IF NOT EXISTS "B2BLandingPage_intent_idx" ON "B2BLandingPage"("intent");
CREATE UNIQUE INDEX IF NOT EXISTS "PayoutRecord_reference_key" ON "PayoutRecord"("reference");
CREATE INDEX IF NOT EXISTS "PayoutRecord_userId_idx" ON "PayoutRecord"("userId");
CREATE INDEX IF NOT EXISTS "PayoutRecord_paidAt_idx" ON "PayoutRecord"("paidAt");
CREATE UNIQUE INDEX IF NOT EXISTS "_EventToTag_AB_unique" ON "_EventToTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_EventToTag_B_index" ON "_EventToTag"("B");
CREATE INDEX IF NOT EXISTS "Event_category_idx" ON "Event"("category");
CREATE INDEX IF NOT EXISTS "Event_isPublished_idx" ON "Event"("isPublished");
CREATE INDEX IF NOT EXISTS "Event_organizerId_idx" ON "Event"("organizerId");

-- 11. Foreign keys added after base
DO $$ BEGIN
  ALTER TABLE "Faq" ADD CONSTRAINT "Faq_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventGallery" ADD CONSTRAINT "EventGallery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventFollow" ADD CONSTRAINT "EventFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventFollow" ADD CONSTRAINT "EventFollow_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PayoutRecord" ADD CONSTRAINT "PayoutRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_EventToTag" ADD CONSTRAINT "_EventToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_EventToTag" ADD CONSTRAINT "_EventToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
