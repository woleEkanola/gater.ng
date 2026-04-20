# Session Memory - Hitix

**Last Updated:** April 20, 2026

---

## 📋 INDEX (Quick Navigation)
- [How to Update Memory](#how-to-update-memory) ⚠️ READ FIRST
- [Project Context](#project-context)
- [Quick Commands](#quick-commands)
- [Implementation Log](#implementation-log)
- [Database Schema](#database-schema)
- [Roles & Access](#roles--access)
- [Tests](#tests)

---

## ⚠️ How to Update Memory (READ FIRST - MANDATORY)

**BEFORE implementing anything:**
1. Check this memory.md first to understand existing state
2. If there are IN PROGRESS tasks, ask user before starting new work

**WHILE implementing:**
3. Log user's prompt as a task (use todo list or markdown entry with "IN PROGRESS")
4. Break into specific subtasks

**AFTER implementing:**
5. Run `npm run build` to verify no errors
6. If schema changed, run `npx prisma db push`
7. **Create separate "Update memory" task** - Add to todo list as its own item (NOT combined with other tasks)
8. **Update memory.md with new entry** in Implementation Log:
   - Feature name with timestamp
   - Original prompt
   - Plan/what was done
   - Routes/APIs/changed files
   - Status: ✅ DONE

**Template:**
```markdown
### [Feature Name] (YYYY-MM-DD HH:MM)
- **Prompt:** [Original user request]
- **Plan:** [What was implemented]
- **Route:** [relevant routes]
- **APIs:** [new/modified APIs]
- **Files:** [changed files]
- **Status:** ✅ DONE
```

### Default Dashboard Based on Signup Type (Apr 20)
- **Prompt:** if a user signup first as an organizer then that should be the primary view he sees when he login, there should be a clear prompt to show that he can switch to the attendee dashboard also. same applies if a user first sign up is as an attendee
- **Plan:** Added defaultDashboard field to User model, set based on signup type
- **Schema:** Added `defaultDashboard String @default("organizer")` to User model
- **APIs:**
  - `/api/auth/register` - Sets defaultDashboard = "organizer" for direct signup
  - `/api/auth/create-account` - Sets defaultDashboard = "attendee" for post-purchase signup
  - `/api/auth/send-magic-link` - Sets defaultDashboard = "attendee" for magic link signup
- **Files:**
  - `prisma/schema.prisma` - Added defaultDashboard field
  - `src/app/dashboard/page.tsx` - Uses user.defaultDashboard instead of hardcoded "attendee"
- **Behavior:**
  - Direct signup (organizer) → defaults to organizer dashboard
  - Post-purchase signup (attendee) → defaults to attendee dashboard
  - Logged-in organizer can browse public pages as attendee without redirect
- **Status:** ✅ DONE

### Mobile Responsiveness & Color Fix (Apr 20)
- **Prompt:** the mobile responsiveness of the nav bar appears to be faulty in the public event page... ensure solid mobile responsiveness across board... also color blue ui in some areas
- **Plan:** Fixed primary color from blue to rose, added responsive mobile navbar with hamburger menu
- **Files:**
  - `src/app/globals.css` - Changed primary from blue (221.2) to rose (350 82%)
  - `src/components/responsive-header.tsx` (new) - Mobile responsive navbar with hamburger menu
  - `src/app/events/[slug]/page.tsx` - Added ResponsiveHeader, fixed banner height for mobile, replaced blue with rose
  - `src/app/page.tsx` - Integrated ResponsiveHeader
  - `src/app/events/page.tsx` - Added mobile responsive header
  - `src/app/events/page.tsx` - Replaced blue-600 with primary for online event badge
  - `src/app/checkout/success/page.tsx` - Changed blue-50 to rose-50
  - `src/app/dashboard/page.tsx` - Changed blue to rose for platform fee note
- **Status:** ✅ DONE

### Brand Name Change (Apr 19)
- **Prompt:** change the brandname to hitix
- **Plan:** Updated all references from gater.ng to Hitix in source files
- **Files:**
  - `package.json` - name changed to "hitix"
  - `src/app/page.tsx` - All Gater.ng → Hitix
  - `prisma/seed.ts` - Emails updated
  - `prisma/seed-superadmin.ts` - Email updated
- **Status:** ✅ DONE

### Promo Code in Checkout (Apr 18 19:00)
- **Prompt:** add way to add promocode while buying ticket
- **Plan:** Added promo code input in checkout, validation endpoint, discount calculation and storage
- **Route:** `/checkout/[eventId]`
- **APIs:**
  - `/api/discount-codes/validate` - Validates promo code (new)
  - `/api/orders` - Accepts discountCode and discountAmount
- **Files:**
  - `src/app/checkout/[eventId]/page.tsx` - Added promo input UI
  - `src/app/api/discount-codes/validate/route.ts` (new)
  - `src/app/api/orders/route.ts` - Added discount handling
  - `prisma/schema.prisma` - Added discountCode, discountAmount to Order
- **Status:** ✅ DONE

### Speaker & Gallery Image Upload Fix (Apr 18 18:45)
- **Prompt:** speakers images not showing i am not sure its uploading/saving to db... also for gallery allow multi image upload
- **Plan:** Created separate uploadthing endpoints for each type, used uploadthing React hooks (same as working banner upload)
- **APIs:**
  - `/api/upload/speaker` - Speaker images
  - `/api/upload/gallery` - Gallery images (multi-upload)
- **Files:**
  - `src/app/api/upload/speaker/route.ts` (new)
  - `src/app/api/upload/gallery/route.ts` (new)
  - `src/components/ui/speaker-image-upload.tsx` (new)
  - `src/components/ui/gallery-upload.tsx` (new)
  - `src/lib/uploadthing.ts` - Added speakerImage, galleryImage endpoints
  - `src/app/dashboard/events/[id]/page.tsx` - Updated to use new components
- **Status:** ✅ DONE

### Payment Amount Display Fix (Apr 18 19:15)
- **Prompt:** Payment amount showing wrong amount (₦1,200,000 instead of ₦12,000)
- **Plan:** Fixed currency conversion - stored in kobo but not dividing by 100 when displaying
- **Files:**
  - `src/app/checkout/success/page.tsx` - Fixed amount display: divide by 100
  - `src/app/api/payment/verify/route.ts` - Fixed amount sent in email
- **Status:** ✅ DONE

### Promo Code Fix (Apr 18 19:30)
- **Prompt:** GET /api/discount-codes/validate 404 - promo code not working
- **Plan:** Fixed - was passing event slug instead of event ID to validation API
- **Files:**
  - `src/app/checkout/[eventId]/page.tsx` - Changed to use event?.id instead of eventId (slug)
- **Status:** ✅ DONE

### Promo Code Percentage Fix (Apr 18 19:40)
- **Prompt:** promo did 2000% instead of 20%
- **Plan:** Fixed kobo conversion for percentage - 20% stored as 2000, need to divide by 100 for percentage display and calculation
- **Files:**
  - `src/app/checkout/[eventId]/page.tsx` - Fixed discount calculation and display
- **Status:** ✅ DONE

### Promo Code UI Display Fix (Apr 18 19:50)
- **Prompt:** the promo code is working well however the ui display on the checkout page is still showing 2000% instead of 20%
- **Plan:** Fixed UI display - calculation correct but display wasn't dividing by 100
- **Files:**
  - `src/app/checkout/[eventId]/page.tsx` - Fixed display: `appliedPromo.discount / 100`
- **Status:** ✅ DONE

### Online Event Ticket Page Improvements (Apr 18 20:00)
- **Prompt:** For online event ticket page not ideal - need proper online event display and access instructions
- **Plan:** Added online event detection, "Join Event" button, access instructions, improved UI
- **Schema:** Added accessInstructions field to Event model
- **Organizer Dashboard:** Added Access Instructions input field for online events
- **Ticket Page:** Shows "Online Event" badge, Join button, access instructions, different QR text
- **Files:**
  - `prisma/schema.prisma` - Added accessInstructions to Event
  - `src/app/tickets/[orderId]/page.tsx` - Updated ticket UI for online events
  - `src/app/dashboard/events/[id]/page.tsx` - Added access instructions input
- **Status:** ✅ DONE

### FAQ Accordion & Visibility Toggle (Apr 18 17:00)
- **FAQ Accordion:** Rendered as expandable accordion on public event page
- **Visibility Toggle:** Organizers can show/hide individual FAQs or all at once
- **Schema:** Added `isVisible` field to Faq model (default true)
- **APIs:**
  - `/api/faqs` - Added `includeHidden` param for GET, PUT for visibility toggle
  - Supports `showAll` param to toggle all FAQs at once
- **Organizer Dashboard:** Added Show All/Hide All buttons + individual eye icons
- **Files:**
  - `src/components/faq-accordion.tsx` (new)
  - `prisma/schema.prisma` - Added isVisible to Faq
  - `src/app/api/faqs/route.ts` - Added visibility toggle
  - `src/app/events/[slug]/page.tsx` - Used FaqAccordion
  - `src/app/dashboard/events/[id]/page.tsx` - Added visibility controls
- **Status:** ✅ DONE

### Speaker Enhancements & Ticket Price Edit (Apr 18 17:30)
- **Custom Speaker Label:** Organizers can customize "Speakers" label (e.g., Guests, Panelists)
- **Speaker Modal:** Click speaker card to view full profile with bio
- **Speaker Image:** Can add image URL to speakers
- **Speaker Edit:** Pencil icon to edit speaker details
- **Speaker Visibility:** Added `isVisible` to Speaker model
- **Edit Ticket Price:** Organizers can edit ticket price (only if no tickets sold)
- **APIs:**
  - `/api/speakers` - Added includeHidden param, showAll toggle, PUT for visibility + edit
  - `/api/ticket-types` - Added PUT for price update
- **Schema:**
  - Event - Added speakerLabel field (default "Speakers")
  - Speaker - Added isVisible field (default true), updatedAt
- **Files:**
  - `src/components/speaker-modal.tsx` (new)
  - `prisma/schema.prisma` - Added speakerLabel + isVisible + updatedAt
  - `src/app/api/speakers/route.ts` - Added visibility toggle + edit
  - `src/app/api/ticket-types/route.ts` - Added PUT for price
  - `src/app/events/[slug]/page.tsx` - Used SpeakerGrid, speakerLabel
  - `src/app/dashboard/events/[id]/page.tsx` - Added speaker label, image, edit controls
- **Status:** ✅ DONE

### Gallery & Event Contacts (Apr 18 18:00)
- **Gallery Management:** Organizers can upload/delete images for event gallery
- **Event Contacts:** Contact email, phone fields
- **Social Links:** Website, Twitter, Facebook, Instagram, YouTube, LinkedIn
- **Public Page:** Contact & Links card shows all contacts and social links
- **Schema:** Added contactEmail, contactPhone, websiteUrl, twitterUrl, facebookUrl, instagramUrl, youtubeUrl, linkedinUrl
- **APIs:**
  - `/api/gallery` - Already exists, added visibility
- **Files:**
  - `prisma/schema.prisma` - Added contact/social fields
  - `src/app/events/[slug]/page.tsx` - Added contacts card
  - `src/app/dashboard/events/[id]/page.tsx` - Added gallery section, contacts/social inputs
- **Status:** ✅ DONE

---

## 📦 Project Context
- **Project:** Hitix (Next.js event ticketing platform)
- **Stack:** Next.js 16.2.4, Prisma, PostgreSQL, Tailwind
- **Platform:** Windows
- **IMPORTANT:** Always use Next.js 16.x - never downgrade to 14
- **NOTE:** Don't use parentheses in folder names like `(auth)` - causes build issues. Use `auth-route` instead.

---

## ⚡ Quick Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test:e2e` | Run E2E tests |
| `npx prisma db push` | Push schema to DB |
| `npx tsx prisma/seed-superadmin.ts` | Create superadmin |

---

## 🛠 Implementation Log

### Event Page Enhancements (Apr 18 16:00)
- **Full-width Banner:** Event banner now spans full width
- **Follow Event:** Users can follow events, non-logged users prompted to login
- **Follow Organizer:** Follow button on event page with login prompt
- **FAQ Section:** Displays when organizer adds FAQs
- **Gallery Section:** Shows event images in grid (new EventGallery model)
- **Speaker Profiles:** Shows speaker cards (new Speaker model)
- **APIs:**
  - `/api/events/[slug]/follow` - GET/POST event follow
  - `/api/gallery` - GET/POST/DELETE gallery items
  - `/api/speakers` - GET/POST/PUT/DELETE speakers
- **Components:** `FollowButton` (supports event/organizer follow)
- **Schema:** Added EventGallery, Speaker, EventFollow models
- **Status:** ✅ DONE

### Event Tags & Audience Types (Apr 18)
- **Schema:** Added `Tag` and `AudienceType` models
- **Tags:** Multi-select tags for events (predefined + custom)
- **Audience Types:** Pre-defined "Who is this event for?" options + custom
- **APIs:**
  - `/api/tags` - GET/POST tags
  - `/api/audience-types` - GET/POST audience types
- **Recommendations:** Updated `/api/events/recommendations` to use tags
- **Seed:** Pre-populated 8 tags + 6 default audience types
- **Status:** ✅ DONE

### Security & UX Improvements (Apr 18)
- **Rate Limiting:** Added to auth APIs (`/api/auth/register`, `/api/auth/verify-email`)
- **Session Config:** 30-day maxAge for JWT sessions
- **Email Verification:** Signup sends verification email, `/verify-email` page to confirm
- **SEO:** OpenGraph + Twitter cards on homepage
- **Social Login:** Google OAuth ready (add GOOGLE_CLIENT_ID/SECRET to .env)
- **Status:** ✅ DONE

### Seamless Account Creation (Apr 18) - COMPLETE
- **Flow:** Post-purchase account creation for non-logged-in users
- **APIs:** 
  - `/api/auth/check-email` - Check if email exists (POST, takes {email})
  - `/api/auth/create-account` - Create account post-purchase (POST, takes {email, password})
  - `/api/auth/send-magic-link` - Send magic link for password setup (POST, takes {email})

### POST-PURCHASE ACCOUNT CREATION FLOW (IMPLEMENTED)

#### Step 1: User buys ticket
- User visits event → clicks "Buy" → fills checkout form (name, email, phone)
- **Free tickets:** Order created directly via `/api/orders` → no payment needed
- **Paid tickets:** Redirected to Paystack → payment → success page

#### Step 2: Redirects to /checkout/success
- **FREE tickets URL:** `/checkout/success?orderId=xxx&reference=free&email=user@email.com`
  - Success page extracts `email` from URL params
  - Calls `checkEmailExists(email)` to check if account exists
- **PAID tickets URL:** `/checkout/success?reference=xxx&orderId=xxx`
  - Verifies payment via Paystack
  - Gets buyer's email from order
  - Calls `checkEmailExists(email)`

#### Step 3: Success page shows options (based on email)
| Scenario | UI Shown |
|----------|---------|
| New email (no account) | "Create Account" button + "Send Magic Link" button |
| Existing email | "Login to View Tickets" button |
| No email | "Check your email for ticket" message |

#### Step 4: Account creation options
**Option A: Create Account**
1. Click "Create Account" button → shows password form
2. Enter password (min 6 chars)
3. Click "Create Account" 
4. API: `/api/auth/create-account` creates account
5. Redirects to `/auth-route/login?created=true&email=xxx`
6. User logs in → dashboard

**Option B: Send Magic Link**
1. Click "Send Magic Link" button
2. API: `/api/auth/send-magic-link` sends link to email
3. User clicks link in email
4. Sets password → auto-logged in → dashboard

**Option C: Login (existing user)**
1. Click "Login to View Tickets"
2. Goes to `/auth-route/login`
3. Logs in → dashboard

### CONTEXT SWITCHING (IMPLEMENTED)

#### Dashboard URL params
- `?mode=attendee` - Attendee view
- `?mode=organizer` - Organizer view

#### Attendee Mode (/dashboard?mode=attendee)
- Shows: "My Tickets" (tickets user bought)
- Shows: "Create your own event for free?" prompt (for ORGANIZER role)
- Links: "Switch to Organizer" (if user is ORGANIZER)

#### Organizer Mode (/dashboard?mode=organizer)
- Shows: "My Events" (events user created)
- Shows: "Switch to Attendee" toggle
- Shows: "Organizer Mode" badge

#### Context Rules
- Default role for ATTENDEE: always attendee mode
- ORGANIZER can switch between attendee/organizer
- When ORGANIZER in attendee mode: sees TICKETS THEY BOUGHT (not their created events)

### AUTH ROUTES (Next.js 16)
- `/auth-route/login` - Login page
- `/auth-route/register` - Registration page
- `/auth-route/forgot-password` - Forgot password
- `/auth-route/reset-password` - Reset password
- **IMPORTANT:** All old links (/login, /register, etc.) updated to /auth-route/*

### FILES INVOLVED
| File | Purpose |
|------|---------|
| `/checkout/[eventId]/page.tsx` | Checkout, detects free tickets, passes email to success |
| `/api/orders/route.ts` | Creates order, handles free tickets |
| `/checkout/success/page.tsx` | Shows success + account options |
| `/api/auth/check-email` | Checks if email exists |
| `/api/auth/create-account` | Creates account post-purchase |
| `/api/auth/send-magic-link` | Sends magic link |
| `/dashboard/page.tsx` | Dashboard with context switching |

- **Status:** ✅ DONE

### Checkout Bug Fix (Apr 18)
- **Issue:** "Event not found" when clicking Buy button
- **Root Cause:** Dynamic route folder `[eventId]` but code used `params.slug` → undefined
- **Fix:** Changed to `const { eventId } = use(params)` in checkout page
- **Also fixed:** Orders/Payment APIs need event ID, not slug (changed both from `eventId: slug` to `eventId: event.id`)
- **Status:** ✅ DONE

### Forgot Password (Apr 18)
- **Routes:** `/forgot-password`, `/reset-password`
- **APIs:** `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Features:** Email reset link, password reset form, 1-hour token expiry
- **Fix:** Changed sender domain from hitix to eleto.online (verified on Resend)
- **Status:** ✅ DONE

### Next.js 16 Upgrade (Apr 18)
- **Version:** 16.2.4
- **Changes:** Updated params to async (Promise-based), migrated all dynamic route pages and API routes
- **Status:** ✅ DONE

### Consistent Branding (Apr 18)
- **Components:** Navbar, Footer
- **Features:** Mobile-responsive navbar with hamburger menu, consistent header/footer across all public pages
- **Status:** ✅ DONE

### Organizer Landing Page (Apr 18)
- **Route:** `/organizer`
- **Features:** Public page for potential organizers
- **Status:** ✅ DONE

### Superadmin Dashboard (Apr 18)
- **Route:** `/admin_dash`
- **Features:** Overview, Users, Events, Financials, Reports
- **Admin:** Full access
- **SUPERADMIN:** + Feature events, Delete, Full reports
- **Status:** ✅ DONE

### Homepage Redesign (Apr 17)
- **Route:** `/`
- **Features:** Hero, search, category pills, popular cities
- **Status:** ✅ DONE

### Event Recommendations (Apr 17)
- **Route:** `/` (component)
- **API:** `/api/events/recommendations`
- **Status:** ✅ DONE

### Event Search/Filter (Apr 17)
- **Route:** `/events`
- **API:** `/api/events` (minPrice, maxPrice, dateFrom, dateTo)
- **Status:** ✅ DONE

### User Profile Settings (Apr 17)
- **Route:** `/dashboard/profile`
- **API:** `/api/user/profile`
- **Status:** ✅ DONE

### Wishlist (Apr 17)
- **Route:** `/dashboard/wishlist`
- **API:** `/api/wishlist`
- **Status:** ✅ DONE

### Organizer Profile (Apr 17)
- **Route:** `/organizer/[id]`
- **API:** `/api/organizers/[id]`, `/api/organizers/[id]/follow`
- **Status:** ✅ DONE

### Organizer Dashboard (Apr 17)
- **Route:** `/dashboard`
- **Features:** Revenue, tickets sold, event list
- **Status:** ✅ DONE

---

## 🗄 Database Schema

### User Model
- `role`: ADMIN | SUPERADMIN | ORGANIZER | ATTENDEE
- `isActive`: Boolean
- `bio, website, twitter, instagram, facebook`: String

### Event Model
- `isPublished`: Boolean
- `isFeatured`: Boolean (homepage promotion)

### Order Status
- `PENDING | PAID | FAILED | REFUNDED`

---

## 👥 Roles & Access

| Role | Dashboard | Features |
|------|-----------|----------|
| **ATTENDEE** | `/dashboard/tickets` | View bought tickets |
| **ORGANIZER** | `/dashboard` | Create/manage events |
| **ADMIN** | `/admin_dash` | User management only |
| **SUPERADMIN** | `/admin_dash` | Full platform control |

**Seed:**
- Email: `admin@hitix`
- Password: `Admin@123`

---

## 📋 Embeddable Widget Plan (Option B - Redirect Checkout)

### Overview
Allow organizers to embed Gater ticket widget on their own websites to sell tickets directly from their domain.

### Architecture: Option B (Redirect Checkout) - NOT FULLY EMBEDDED
- Widget displays event + ticket selection on organizer's site
- Checkout redirects to Gater for payment (NOT embedded - simpler, proven model like Eventbrite)
- After payment, optional redirect back to organizer's site

### Widget Flow
1. Organizer adds embed script to their website
2. Widget shows event details + ticket selection on their site
3. User clicks "Checkout" → redirect to Gater payment page
4. After payment → success page → optional redirect back to organizer's site

### Why Option B?
- Easier to implement and maintain
- No PCI compliance complexity on organizer's site
- Uses existing Gater checkout flow
- Proven model (Eventbrite, ticketmaster use similar approach)

### Core Components

**1. Widget Package**
- React component or vanilla JS script
- Configurable via data attributes
- Accepts: `eventId`, `theme`, `primaryColor`, `redirectUrl`

**2. Widget API**
- `/api/widget/embed/[eventId]` - Returns event data for embedding (public data only)
- Handles cart/reservation creation

**3. Theme Config**
- Organizers can set: primary color, font, dark/light mode
- Stored in event settings (dashboard)
- Passed via widget config

**4. Embed Code Generator**
- In organizer dashboard: "Embed Widget" button
- Generates script tag for organizers to copy
- Preview of how it looks on their site

### Embed Example
```html
<script src="https://hitix.com/widget.js" async></script>
<div data-gater-widget="EVENT_ID" data-theme="custom" data-color="#ff0000"></div>
```

### Organizer Flow
1. Go to Gater dashboard → their event
2. Click "Embed Widget" 
3. Copy the provided code
4. Paste into their website
5. Sales appear in their Gater dashboard (existing dashboard)

### Implementation Steps
1. **Widget Component** - Create React component that displays event + tickets
2. **Widget API** - Public endpoint to fetch event for embed
3. **Embed Settings** - Add widget customization options to event dashboard
4. **Embed Code Generator** - Generate copy-paste script for organizers
5. **Redirect Flow** - After payment, optionally redirect back to organizer's site

### Security Considerations
- Domain whitelisting for organizers
- CSP headers for iframe
- Use existing Paystack integration (PCI compliant)
- Script integrity (SRI)

### Status: ⏳ PENDING (Not started)

---

## ✅ Tests
- **E2E:** Added tests for: Promo Code Checkout, FAQ Section, Gallery Section, Online Event, Speaker Section, Event Contacts, Follow Event
- **API:** Added tests for: Discount Codes API, Gallery API, Speakers API, FAQs API, Ticket Types API, Tags & Audience Types, Orders with Discount, Tickets API
- **Run:** `npm run test:e2e`

---

## ⚠️ Important Notes (MANDATORY for new sessions)
1. **READ "How to Update Memory" SECTION FIRST** - This defines the workflow
2. Next.js 16: Dynamic route param name MUST match folder name (e.g., `[eventId]` → use `params.eventId`, NOT `params.slug`)
3. After schema changes, always run `npx prisma db push`

---

## 📝 Quick Template Reference
See [How to Update Memory](#how-to-update-memory) section for full template.