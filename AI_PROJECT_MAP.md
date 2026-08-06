# Hitix (Gater.NG) — Complete Project Map

> **Brand:** Hitix (consumer-facing) | **Internal prefix:** `GAT-` (ticket IDs) | **Domain:** `hitix.online`
> **Stack:** Next.js 16 (App Router) + Prisma (PostgreSQL) + NextAuth.js + Tailwind CSS + TypeScript
> **Payments:** Paystack (NGN, Nigerian market) | **Emails:** Resend | **Uploads:** UploadThing
> **Maps:** Leaflet + OpenStreetMap | **Testing:** Jest (unit) + Playwright (E2E)

---

## 1. HIGH-LEVEL ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Hitix Platform                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Public Pages (Server Components)           │    │
│  │  /organizer → Marketing landing                              │    │
│  │  /browse    → Event discovery & search                       │    │
│  │  /events/[slug] → Single event detail                        │    │
│  │  /organizer/[id] → Public organizer profile                  │    │
│  │  /host/[slug] → SEO B2B landing pages                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               Auth Pages (Client Components)                  │    │
│  │  /auth-route/login                                           │    │
│  │  /auth-route/register                                        │    │
│  │  /auth-route/forgot-password                                 │    │
│  │  /auth-route/reset-password                                  │    │
│  │  /verify-email                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │            Protected Pages (Session-gated)                   │    │
│  │  /dashboard → Organizer & Attendee dashboard               │    │
│  │  /dashboard/tickets → My tickets list                      │    │
│  │  /dashboard/wishlist → Saved events                        │    │
│  │  /dashboard/profile → Profile editing                      │    │
│  │  /dashboard/mfa → 2FA settings                            │    │
│  │  /dashboard/payout → Bank/payout settings                 │    │
│  │  /dashboard/events/new → Create event                     │    │
│  │  /dashboard/events/[id] → Manage event                    │    │
│  │  /dashboard/checkin/[eventId] → QR scanner                │    │
│  │  /dashboard/admin → Super admin panel                     │    │
│  │  /admin_dash → Full admin dashboard                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               Checkout / Purchase Flow                       │    │
│  │  /checkout/[eventId] → Select tickets & pay                │    │
│  │  /checkout/success → Post-payment verification             │    │
│  │  /tickets/[orderId] → View/print tickets                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              API Layer (Route Handlers — 48 routes)          │    │
│  │  Auth (11) | Events (4) | Admin (5) | Payment (3)           │    │
│  │  Organizer (2) | Upload (4) | Features (19)                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Shared Libraries & Components                   │    │
│  │  lib/ (10 files) | components/ (28 files) | types/ (2)      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              External Integrations                           │    │
│  │  Paystack (payments) | Resend (emails) | UploadThing (files) │    │
│  │  Google OAuth | OpenStreetMap (maps) | Google Analytics      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. PRISMA DATABASE SCHEMA (17 Models)

### 2.1 User
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String @unique | |
| password | String | bcrypt hashed |
| name | String? | |
| image | String? | Profile pic URL |
| bio, website, twitter, instagram, facebook | String? | |
| role | Role enum | ATTENDEE (default) \| ORGANIZER \| ADMIN \| SUPERADMIN |
| defaultDashboard | String | "organizer" or "attendee" |
| isActive | Boolean | default true |
| emailVerified | DateTime? | |
| verificationToken / verificationTokenExpiry | String? / DateTime? | |
| mfaEnabled / mfaSecret | Boolean / String? | TOTP 2FA |
| resetToken / resetTokenExpiry | String? / DateTime? | Password reset |
| payoutBankCode / payoutBankName / payoutAccountNumber / payoutAccountName | String? | Payout details |
| paystackSubaccountCode / paystackSettlementBank | String? | Paystack subaccount |
| transactionFeePercent | Float? | default 5.0 |
| relations | Account[], Session[], Event[], Order[], Ticket[], CheckIn[], Follow[], Wishlist[], EventFollow[] | |

### 2.2 Event
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| slug | String @unique | SEO-friendly URL |
| title, description | String, String? | |
| banner | String? | Image URL |
| location, latitude, longitude | String?, Float?, Float? | Physical location |
| showMap | Boolean | default false |
| dateTime | DateTime | |
| isPublished / isFeatured / isOnline | Boolean | |
| streamingLink, accessInstructions | String? | For online events |
| hideAddress / hideStreamingLink | Boolean | |
| category, targetAudience, highlights | String? | |
| speakerLabel | String? | default "Speakers" |
| contactEmail, contactPhone, websiteUrl, social URLs | String? | Contact info |
| organizerId | String | FK → User |
| relations | TicketType[], Order[], Faq[], DiscountCode[], Wishlist[], Tag[], EventGallery[], Speaker[], EventFollow[] | |

### 2.3 TicketType
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | e.g. "VIP", "Regular" |
| price | Int | Stored in **kobo** (subunits of NGN) |
| quantity / soldCount | Int | |
| groupSize | Int | default 1 |
| image | String? | |
| salesStart / salesEnd | DateTime? | |
| eventId | String | FK → Event |
| relations | Ticket[] | |

### 2.4 Ticket
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| ticketId | String @unique | Format: `GAT-XXXXXX` |
| ticketTypeId | String | FK → TicketType |
| ownerId | String? | FK → User |
| orderId | String? | FK → Order |
| groupSize | Int | default 1 |
| checkedInCount | Int | default 0 (supports partial check-in) |
| isUsed / usedAt / usedBy | Boolean / DateTime? / String? | |
| qrCode | String? | Data URL of QR image |
| relations | CheckIn[] | |

### 2.5 Order
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| buyerId / buyerEmail / buyerName / buyerPhone | String?, String?, String?, String? | |
| eventId | String | FK → Event |
| status | OrderStatus enum | PENDING \| PAID \| FAILED \| REFUNDED |
| amount | Int | In kobo |
| discountCode / discountAmount | String?, Int | |
| paymentRef | String? | Paystack reference |
| paidAt | DateTime? | |
| relations | Ticket[] | |

### 2.6 Other Models
| Model | Purpose |
|---|---|
| **Account** | NextAuth OAuth account storage |
| **Session** | NextAuth session storage |
| **VerificationToken** | NextAuth verification tokens |
| **CheckIn** | Tracks each admission check-in (ticketId, checkedBy, checkedAt) |
| **DiscountCode** | Promo codes per event (percentage or fixed, uses count, expiry) |
| **Follow** | User-to-user follow (organizer following) |
| **EventFollow** | User-to-event follow |
| **Wishlist** | Saved/bookmarked events per user |
| **Tag** | Event tags/categories (name + color) |
| **EventGallery** | Event photo gallery |
| **Speaker** | Event speakers (name, bio, image, title, company) |
| **Faq** | Event FAQs (question, answer, visibility) |
| **AudienceType** | Predefined target audiences (Everyone, Beginners, etc.) |
| **B2BLandingPage** | Dynamic SEO landing pages (slug, h1, features JSON, meta) |

### Key Indexes
- Event: slug, category, isPublished, organizerId
- Follow: followerId, followingId (composite unique)
- Wishlist: userId, eventId (composite unique)
- EventFollow: userId, eventId (composite unique)
- DiscountCode: code + eventId (composite unique)
- Ticket: ticketId (unique), orderId
- Tag: name (unique)

---

## 3. API ROUTE LAYER (48 Route Handlers)

All routes are Next.js App Router Route Handlers at `src/app/api/`.

### 3.1 Auth Routes (11)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `auth/[...nextauth]` | GET, POST | — | NextAuth catch-all handler |
| `auth/register` | POST | Open (rate-limited) | Create organizer account (sends verification) |
| `auth/create-account` | POST | Open | Create attendee account (no verification) |
| `auth/check-email` | POST | Open | Check if email already registered |
| `auth/logout` | POST | None | Stub (returns success) |
| `auth/send-magic-link` | POST | Open | Creates temp user, sends set-password email |
| `auth/forgot-password` | POST | Open | Sends password reset email (1hr expiry) |
| `auth/reset-password` | POST | Token-based | Validates token, updates password |
| `auth/mfa-setup` | GET, POST | Session | GET: generate TOTP secret + QR; POST: enable/disable |
| `auth/mfa-verify` | POST | Open | Verify TOTP code during login |
| `auth/verify-email` | POST | Open (rate-limited) | Resend verification email |

**Pattern:** Most auth routes use `getServerSession()` or token-based auth. `register` and `verify-email` use in-memory rate limiting. Auth is **not** in middleware — checked per-route.

### 3.2 Event Routes (4)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `events` | GET, POST | GET: public, POST: session | List/filter events or create new event |
| `events/[slug]` | GET, PUT, DELETE | GET: public, PUT/DELETE: owner+ | Get/update/delete event by slug |
| `events/[slug]/follow` | GET, POST | GET: public, POST: session | Toggle event follow |
| `events/recommendations` | GET | Optional session | Personalized event recommendations |

**GET /events** supports extensive filtering: `organizerId`, `published`, `search`, `filter` (upcoming/past), `category`, `minPrice`, `maxPrice`, `dateFrom`, `dateTo`, `includePrivate`. Processes ticket visibility based on organizer payout settings.

### 3.3 Admin Routes (5)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `admin/stats` | GET | ADMIN/SUPERADMIN | Dashboard stats (users, events, revenue) |
| `admin/users` | GET, PATCH | ADMIN/SUPERADMIN | List/manage users (fee, role, active) |
| `admin/events` | GET | ADMIN/SUPERADMIN | List all events (search + status filter) |
| `admin/events/[eventId]` | POST, DELETE, PATCH | ADMIN/SUPERADMIN | Toggle featured, delete event |
| `admin/transactions` | GET | ADMIN/SUPERADMIN | List paid orders (last 100) |

Revenue calculation: `sum(order.amount * 5 / 100)` (5% platform fee).

### 3.4 Payment Routes (3)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `payment/initialize` | POST | Open | Initiate Paystack payment (split payment support) |
| `payment/verify` | POST | Open | Verify Paystack reference, create tickets, send emails |
| `paystack/webhook` | POST | HMAC signature | Paystack async webhook handler (mirrors verify) |

**Split Payment Logic:**
- If organizer has `paystackSubaccountCode` → percentage split (platform fee to main account, rest to subaccount)
- Fallback: handles raw bank details
- Free orders skip Paystack entirely (created as PAID immediately)

### 3.5 Organizer Routes (2)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `organizers/[id]` | GET | Public | Organizer profile + events (upcoming/past) |
| `organizers/[id]/follow` | GET, POST | GET: public, POST: session | Toggle organizer follow |

### 3.6 Upload Routes (4)

| Route | Methods | Purpose |
|---|---|---|
| `upload/banner` | GET, POST | UploadThing handler for event banners |
| `upload/speaker` | GET, POST | UploadThing handler for speaker images |
| `upload/gallery` | GET, POST | UploadThing handler for gallery images |
| `uploadthing` | GET, POST | Generic UploadThing handler |

All four delegate to `createRouteHandler({ router: uploadRouter })`. File type/size validation is in `uploadRouter` (all images, max 4MB).

### 3.7 Feature Routes (19)

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `tickets` | GET | Open (orderId-based) | Fetch order + tickets |
| `orders` | GET, POST | Mixed | Create order (public) / list user orders (session) |
| `discount-codes` | GET, POST, DELETE | GET: open, others: owner | Promo code CRUD |
| `discount-codes/validate` | GET | Open | Validate promo code for event |
| `checkin` | GET, POST | Session | Check-in ticket / get check-in stats |
| `attendees` | GET | Session + ownership | Export attendees (JSON or CSV) |
| `speakers` | GET, POST, PUT, DELETE | GET: open, others: owner | Speaker CRUD + bulk visibility toggle |
| `faqs` | GET, POST, PUT, DELETE | GET: open, others: owner | FAQ CRUD + bulk visibility toggle |
| `gallery` | GET, POST, DELETE | GET: open, others: owner | Gallery image CRUD |
| `tags` | GET, POST | Open | List/create tags (find-or-create) |
| `ticket-types` | GET, POST, PUT | GET: open, others: owner | Ticket type CRUD (price in kobo) |
| `audience-types` | GET, POST | Open | List/create audience types |
| `wishlist` | GET, POST | Session | Get/toggle wishlist |
| `user/profile` | GET, PUT | Session | Get/update profile |
| `sales` | POST | Session + ownership | Record manual offline sale |
| `payout` | GET, POST | Session | Get/set payout settings (bank validation via Paystack) |
| `qr` | GET | Open | Generate QR code PNG |
| `verify-email` | POST | Token-based | Verify email via token |
| `location/search` | GET | Open | Proxy to OpenStreetMap Nominatim |

---

## 4. PAGES & COMPONENTS

### 4.1 Page Structure

```
src/app/
├── page.tsx                    → redirects to /organizer
├── layout.tsx                  → Root layout: Inter font, Google Analytics, Toaster
├── globals.css                 → Tailwind + CSS variables (primary: rose-600)
│
├── browse/page.tsx             → Event discovery (hero, search, categories, recommendations, trending)
├── events/[slug]/page.tsx      → Event detail (banner, info, tickets, FAQ, speakers, gallery, map)
│
├── organizer/page.tsx          → Marketing landing for event organizers
├── organizer/[id]/page.tsx     → Public organizer profile page
│
├── host/[slug]/page.tsx        → SEO B2B landing pages (DB-driven)
│
├── auth-route/
│   ├── login/page.tsx          → Login with MFA support
│   ├── register/page.tsx       → Registration
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
│
├── verify-email/page.tsx       → Email verification handler
│
├── dashboard/
│   ├── page.tsx                → Dual-mode dashboard (attendee/organizer)
│   ├── dashboard-client.tsx    → Client component for organizer stats
│   ├── tickets/page.tsx        → User's tickets list
│   ├── wishlist/page.tsx       → Saved events (client) + page.server.tsx
│   ├── profile/page.tsx        → Edit profile
│   ├── mfa/page.tsx            → 2FA setup
│   ├── payout/page.tsx         → Bank account settings
│   ├── admin/page.tsx          → User management
│   ├── events/
│   │   ├── new/page.tsx        → Create event form
│   │   └── [id]/page.tsx       → Manage event (1724 lines — largest file)
│   └── checkin/[eventId]/page.tsx → QR check-in scanner
│
├── admin_dash/page.tsx         → Admin dashboard (stats, users, events, financials, reports)
│
├── checkout/
│   ├── [eventId]/page.tsx      → Checkout flow (ticket selection, promo, payment)
│   └── success/page.tsx        → Post-payment (verify, create account, show tickets)
│
└── tickets/[orderId]/page.tsx  → View/print ticket with QR code
```

### 4.2 Shared Components (28 files)

**UI Primitives (`components/ui/`):**
- `button.tsx` — shadcn Button with variants (default, destructive, outline, secondary, ghost, link)
- `card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `input.tsx`, `textarea.tsx`, `label.tsx` — Form inputs
- `toast.tsx`, `toaster.tsx`, `use-toast.tsx` — Toast notification system (Radix + reducer)
- `upload-button.tsx` — Single image upload with UploadThing
- `banner-crop-upload.tsx` — Banner upload with react-easy-crop (5:2 aspect)
- `gallery-upload.tsx` — Multi-image gallery upload
- `ticket-image-upload.tsx` — Ticket type image (80×80)
- `speaker-image-upload.tsx` — Speaker photo (64×64 circle)
- `profile-image-upload.tsx` — Avatar upload (96×96 circle)
- `bank-select.tsx` — Searchable bank dropdown

**Providers:**
- `providers/auth-provider.tsx` — SessionProvider + QueryClientProvider (TanStack React Query)

**Feature Components:**
| Component | Purpose |
|---|---|
| `responsive-header.tsx` | Sticky nav with mobile hamburger |
| `footer.tsx` | 4-column site footer |
| `home-recommendations.tsx` | Personalized event recommendations |
| `wishlist-button.tsx` | Heart toggle |
| `follow-button.tsx` | Follow/unfollow button (event or organizer) |
| `copy-link-button.tsx` | Share/copy event link |
| `speaker-modal.tsx` | Speaker card grid + detail modal |
| `faq-accordion.tsx` | FAQ accordion (single open) |
| `logout-button.tsx` | Sign out button |
| `map-display.tsx` | Leaflet read-only map |
| `event-map-display.tsx` | SSR-safe map wrapper (dynamic import) |
| `map-location-picker.tsx` | Location picker with search + map |

---

## 5. SHARED LIBRARIES

| File | Exports | Purpose |
|---|---|---|
| `lib/auth.ts` | `authOptions` | NextAuth config (Google OAuth + credentials, JWT, MFA-aware) |
| `lib/prisma.ts` | `prisma` | PrismaClient singleton |
| `lib/email.ts` | `sendTicketEmail`, `sendBulkTicketEmails`, `sendPasswordResetEmail`, `sendVerificationEmail` | Transactional emails via Resend |
| `lib/qr.ts` | `generateQRCode`, `generateTicketId` | QR generation + ticket ID (`GAT-XXXXXX`) |
| `lib/utils.ts` | `cn`, `formatCurrency`, `formatDate`, `formatShortDate` | Tailwind merge + formatting |
| `lib/payout.ts` | `hasPayoutSettings`, `getOrganizerPayoutSettings`, `hasValidPayoutSettings` | Payout validation |
| `lib/paystack-banks.ts` | `PaystackBank`, `fetchPaystackBanks` | Nigerian banks list from Paystack API |
| `lib/rate-limit-config.ts` | `rateLimit` | In-memory rate limiting (auth: 5/min, default: 100/min) |
| `lib/rate-limit.ts` | `withRateLimit`, `getClientIp` | Rate limit middleware wrapper |
| `lib/uploadthing.ts` | `uploadRouter`, `AppFileRouter` | UploadThing config (5 endpoints, images only, 4MB max) |

### Key Auth Flow (`lib/auth.ts`)
```
Credentials login:
  1. Find user by email
  2. bcrypt.compare password
  3. If mfaEnabled → throw "MFA_REQUIRED" (handled client-side)
  4. Return user object with id, role, image

JWT Callback:
  token.id = user.id
  token.role = user.role

Session Callback:
  session.user.id = token.id
  session.user.role = token.role
  session.user.image = token.picture

Providers:
  - Google OAuth (conditional on GOOGLE_CLIENT_ID)
  - Credentials (email + password)
  - 30-day JWT maxAge
```

---

## 6. EXTERNAL INTEGRATIONS

| Integration | Usage | Credentials in .env |
|---|---|---|
| **Paystack** | Payment init, verify, webhook, bank list, account resolution, subaccount creation | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` |
| **Resend** | Transactional emails (tickets, verification, password reset) | `RESEND_API_KEY` |
| **UploadThing** | File uploads (banner, speaker, gallery, ticket image, profile) | (managed via UploadThing dashboard) |
| **Google OAuth** | Social login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **OpenStreetMap** | Location search (Nominatim) + map tiles (Leaflet) | Public API (no key) |
| **Google Analytics** | Tracking (G-6GYCKF39QF) | Inline in layout.tsx |

### Paystack Payment Flow
```
1. User selects tickets → POST /api/orders creates PENDING order
2. Frontend calls POST /api/payment/initialize with orderId
3. Backend creates Paystack transaction (with split if organizer has subaccount)
4. User completes payment on Paystack modal
5. User redirected to /checkout/success?orderId=XXX&reference=REF
6. Frontend calls POST /api/payment/verify
7. Backend verifies with Paystack, creates tickets with QR codes, sends ticket emails
8. (Backup) Paystack webhook POST /api/paystack/webhook — HMAC verified
```

---

## 7. AUTHENTICATION & AUTHORIZATION MODEL

| Method | Mechanism | Used By |
|---|---|---|
| **Session (cookie)** | `getServerSession(authOptions)` | Server components, API routes |
| **Session (client)** | `useSession()` / `signIn()` from next-auth/react | Client components |
| **Role check** | Manual `session.user.role` comparison | API routes (ADMIN/SUPERADMIN/ORGANIZER) |
| **Ownership check** | Compare `event.organizerId === session.user.id` | Event management APIs |
| **Token-based** | Reset/verification tokens with expiry | Password reset, email verification |
| **HMAC** | Paystack webhook signature verification | `paystack/webhook` |
| **Rate limiting** | In-memory IP-based | Register, verify-email |
| **MFA** | TOTP via speakeasy library | Login flow (MFA_REQUIRED error) |

### Auth Patterns
- **No middleware.ts** — auth is checked per-page/route
- **Protected pages** redirect to `/login` if no session
- **API routes** return 401 if session missing, 403 if wrong role
- **Anonymous checkout** allowed (buyerEmail tracked on Order)
- **Session linking** — if logged-in user places order, `order.buyerId` links to user

---

## 8. DATA FLOW PATTERNS

### 8.1 Event Creation
```
Client (dashboard/events/new) → POST /api/events → Prisma create → Return event
  ├── Upload banner via UploadThing → POST /api/upload/banner
  ├── Add ticket types → POST /api/ticket-types
  ├── Add speakers → POST /api/speakers
  ├── Add FAQs → POST /api/faqs
  └── Add gallery images → POST /api/gallery
```

### 8.2 Ticket Purchase
```
/checkout/[eventId]
  ├── GET /api/events/{id} (or slug) → event + ticket types
  ├── POST /api/discount-codes/validate → check promo
  ├── POST /api/orders → create PENDING order
  ├── POST /api/payment/initialize → Paystack transaction URL
  └── Paystack modal → redirect → /checkout/success

/checkout/success
  ├── POST /api/payment/verify → verify reference, create tickets, send emails
  ├── POST /api/auth/check-email → check if buyer exists
  ├── POST /api/auth/create-account → optional account creation
  └── Show tickets with QR codes
```

### 8.3 Check-in Flow
```
/dashboard/checkin/[eventId]
  ├── Enter ticket ID manually
  ├── POST /api/checkin → validates ticket, creates CheckIn record
  ├── Supports partial check-in (group tickets)
  └── GET /api/checkin?eventId=... → check-in stats
```

### 8.4 Recommendations Engine
```
GET /api/events/recommendations
  1. Analyze user's wishlist → find preferred tags (top 5) & categories (top 3)
  2. Query upcoming published events matching preferences
  3. Exclude already-wishlisted events
  4. Fallback tiers: preferred → same preferences broader → all upcoming
  5. Return max 8 events with computed minPrice
```

---

## 9. TESTING

| Type | Framework | Location | Command |
|---|---|---|---|
| Unit/Integration | Jest (ts-jest) | `tests/api/*.test.ts` | `npm test` |
| E2E | Playwright | `tests/e2e/*.spec.ts` | `npm run test:e2e` |

### Test Fixtures
- Auth & account tests: `tests/api/auth-account.test.ts`
- Events tests: `tests/api/events.test.ts`
- Schema tests: `tests/api/schema.test.ts`
- Comprehensive tests: `tests/api/comprehensive.test.ts`
- Utils tests: `tests/api/utils.test.ts`
- New features tests: `tests/api/new-features.test.ts`
- E2E tests: `registration.spec.ts`, `account-creation.spec.ts`, `events.spec.ts`, `basic.spec.ts`, `new-features.spec.ts`

---

## 10. CONFIGURATION FILES

| File | Purpose |
|---|---|
| `next.config.mjs` | Images: allow all remote patterns |
| `tsconfig.json` | Strict, `@/*` → `./src/*`, ESNext module, ES2017 target |
| `tailwind.config.js` | shadcn/ui theme (rose primary, CSS variables), container centered |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `.eslintrc.json` | next/core-web-vitals, relaxed rules (unescaped entities off) |
| `jest.config.ts` | Node env, `tests/` root, ts-jest transform |
| `playwright.config.ts` | `tests/e2e/`, 1 worker, retries on CI, chromium only |

### Environment Variables (`.env.example`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth encryption secret |
| `NEXTAUTH_URL` | App base URL (http://localhost:3000) |
| `PAYSTACK_SECRET_KEY` | Paystack API secret |
| `PAYSTACK_PUBLIC_KEY` | Paystack API public key |
| `RESEND_API_KEY` | Resend email API key |

---

## 11. SEEDING & SETUP

### `prisma/seed.ts` — Main Seed
Creates:
- **Admin:** `admin@hitix` / `admin123` (role: ADMIN)
- **Organizer:** `organizer@hitix` / `organizer123` (role: ORGANIZER, with payout settings)
- **Attendee:** `attendee@hitix` / `attendee123` (role: ATTENDEE)
- **Audience Types:** Everyone, Beginners, Professionals, Students, Entrepreneurs, Women Only
- **Tags:** Workshop, Conference, Networking, Music, Sports, Food, Art, Tech (each with color)
- **Events:** "Tech Conference 2024" (with VIP/Regular/Free ticket types), "Free Workshop"

### `scripts/seed-b2b-pages.ts` — B2B Landing Pages
Creates 8 dynamic SEO landing pages:
- `/host/sell-tickets-for-tech-meetups`
- `/host/sell-tickets-for-university-parties`
- `/host/sell-tickets-for-masterclasses`
- `/host/sell-tickets-for-music-concerts`
- `/host/sell-tickets-for-corporate-events`
- `/host/manage-rsvps-for-tech-meetups`
- `/host/manage-rsvps-for-university-parties`
- `/host/manage-rsvps-for-masterclasses`

### Setup Commands
```bash
npm install                    # Install dependencies
cp .env.example .env           # Configure environment
npx prisma generate            # Generate Prisma client
npm run db:push                # Push schema to DB
npm run db:seed                # Seed test data
npm run dev                    # Start development server
```

---

## 12. NOTABLE ARCHITECTURAL DECISIONS

1. **No middleware** — Auth guards are per-page/route rather than globally in middleware.ts
2. **Dual Server/Client pattern** — Server components fetch data (direct Prisma), client components handle interactivity
3. **No root SessionProvider** — Each page handles session independently via `getServerSession` or `signIn`
4. **Price in kobo** — All amounts stored as integers (kobo, the subunit of NGN) to avoid floating point issues
5. **Anonymous checkout** — Users can buy tickets without an account; post-purchase account creation is optional
6. **Split payments** — Platform takes configurable fee percentage, rest goes to organizer's Paystack subaccount
7. **In-memory rate limiting** — Restarts on server restart (acceptable for MVP, should use Redis for production)
8. **No external state management** — React Query for server state, local state + zustand for client state
9. **Dynamic B2B pages** — SEO landing pages are database-driven, not hardcoded
10. **No dark mode toggle** — Dark mode CSS variables exist in `globals.css` but no toggle UI

---

## 13. FILE TREE (Complete Structure)

```
gater.ng/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .opencode/
│   ├── .gitignore
│   └── plans/
├── jest.config.ts
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── prisma/
│   ├── schema.prisma              ← 17 models
│   ├── seed.ts                    ← Main seed data
│   ├── seed-superadmin.ts
│   └── migrations/
│
├── scripts/
│   └── seed-b2b-pages.ts          ← SEO landing page data
│
├── src/
│   ├── app/                       ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               → / → /organizer
│   │   ├── globals.css
│   │   │
│   │   ├── api/                   ← 48 route handlers
│   │   │   ├── auth/              ← 11 routes
│   │   │   ├── admin/             ← 5 routes
│   │   │   ├── events/            ← 4 routes
│   │   │   ├── payment/           ← 2 routes
│   │   │   ├── paystack/          ← 1 route
│   │   │   ├── organizers/        ← 2 routes
│   │   │   ├── upload/            ← 3 routes
│   │   │   └── ...                ← 19 feature routes
│   │   │
│   │   ├── browse/                ← Event discovery
│   │   ├── events/[slug]/         ← Event detail
│   │   ├── organizer/             ← Marketing + profiles
│   │   ├── host/[slug]/           ← B2B landing pages
│   │   ├── auth-route/            ← Login, register, reset
│   │   ├── verify-email/
│   │   ├── dashboard/             ← User dashboard
│   │   ├── admin_dash/            ← Super admin panel
│   │   ├── checkout/              ← Purchase flow
│   │   └── tickets/               ← Ticket display
│   │
│   ├── components/
│   │   ├── ui/                    ← 13 shadcn-style components
│   │   ├── providers/             ← 1 provider (auth + query)
│   │   └── ...                    ← 14 feature components
│   │
│   ├── lib/                       ← 10 utility files
│   └── types/                     ← 2 type files
│
├── tests/
│   ├── api/                       ← 7 Jest test files
│   └── e2e/                       ← 5 Playwright test files
│
├── node_modules/
├── .next/
├── playwright-report/
└── test-results/
```

---

## 14. KEY DEPENDENCIES & VERSIONS

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.4 | Framework |
| `react` / `react-dom` | ^18 | UI library |
| `next-auth` | ^4.24.14 | Authentication |
| `@prisma/client` | 5.22.0 | ORM |
| `prisma` | 5.22.0 | Schema management (dev) |
| `@tanstack/react-query` | ^5.24.0 | Server state management |
| `zod` | ^3.22.4 | Schema validation |
| `react-hook-form` | ^7.50.1 | Form management |
| `@hookform/resolvers` | ^3.3.4 | Form validation resolver |
| `zustand` | ^4.5.0 | Client state management |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `speakeasy` | ^1.0.5 | TOTP/MFA generation |
| `qrcode` | ^1.5.4 | QR code generation |
| `resend` | ^4.0.0 | Transactional emails |
| `uploadthing` | ^7.7.4 | File uploads |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^4.2.1 | Maps |
| `react-easy-crop` | ^5.5.7 | Image cropping |
| `lucide-react` | ^0.344.0 | Icons |
| `clsx` / `tailwind-merge` | ^2.1.0 / ^2.2.1 | CSS utilities |
| `class-variance-authority` | ^0.7.0 | Component variants |
| `@radix-ui/*` | various | Accessible UI primitives |
| `tailwindcss` / `postcss` | ^3.3.0 / ^8 | Styling |
| `jest` / `ts-jest` | ^30.3.0 | Unit testing |
| `@playwright/test` | ^1.59.1 | E2E testing |
| `typescript` | ^5 | Type safety |

---

## 15. AI AGENT QUICK-START TIPS

When working on this codebase:

1. **Find the right file first** — Use the file tree in section 13 to locate files quickly
2. **Schema is in `prisma/schema.prisma`** — Always check the Prisma schema before writing DB queries
3. **Types are in `src/types/index.ts`** — For frontend domain model types
4. **API routes follow the pattern** — `getServerSession(authOptions)` at the top, role checks, then Prisma operations
5. **Pages follow the pattern** — Server components fetch data with direct Prisma calls, client components use `fetch` to `/api/` endpoints
6. **Price is always in kobo** — Divide by 100 for display, multiply by 100 for storage
7. **Auth is configured in `src/lib/auth.ts`** — Not in middleware
8. **Rate limiting** — Only on `register` and `verify-email` routes; uses in-memory storage
9. **UploadThing** — File uploads go through UploadThing (not direct to server); 5 endpoints defined in `src/lib/uploadthing.ts`
10. **Paystack** — Payment flow: `/api/payment/initialize` → Paystack → `/api/payment/verify`; webhook at `/api/paystack/webhook`
11. **Test accounts** from seed: `admin@hitix` / `admin123`, `organizer@hitix` / `organizer123`, `attendee@hitix` / `attendee123`
12. **Project names**: The package.json says "hitix", the ticket IDs start with "GAT-" (from "Gater"), and the folder is named "gater.ng"
