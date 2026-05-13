# Hitix Multi-Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four features: (1) optional ticket type images, (2) fix event update API to persist all fields, (3) allow superadmins to edit all events via the same organizer dashboard UI, (4) replace bank code input with bank name dropdown using Paystack API.

**Architecture:** Minimal changes to existing patterns — add `image` field to TicketType Prisma model and UploadThing router, fix PUT handler to spread all editable fields, expand auth checks from `ADMIN` to include `SUPERADMIN`, and fetch Paystack bank list for a searchable dropdown in the payout form.

**Tech Stack:** Next.js 16.2.4, Prisma, PostgreSQL, Tailwind, UploadThing, Paystack API, shadcn/ui components (Select, Command for combobox)

---

## File Structure Map

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | Add `image` to TicketType model |
| `src/lib/uploadthing.ts` | Add `ticketTypeImage` endpoint |
| `src/app/api/ticket-types/route.ts` | Accept `image` on POST/PUT; allow SUPERADMIN edits |
| `src/app/api/events/[slug]/route.ts` | Fix PUT to persist ALL event fields; allow SUPERADMIN edits |
| `src/app/api/tickets/route.ts` | Include `ticketType.image` in order query |
| `src/app/api/payout/route.ts` | Fetch Paystack banks; add `payoutBankName` field support |
| `src/app/dashboard/events/[id]/page.tsx` | Add ticket image upload UI; fix state updates for all fields |
| `src/app/dashboard/payout/page.tsx` | Replace bank code input with bank name dropdown |
| `src/app/events/[slug]/page.tsx` | Display ticket type images in ticket card |
| `src/app/tickets/[orderId]/page.tsx` | Display ticket type image on purchased ticket |
| `src/app/checkout/[eventId]/page.tsx` | Display ticket type images in checkout cart |

---

## Task 1: Add `image` Field to TicketType Model

**Files:**
- Modify: `prisma/schema.prisma:151-164`

- [ ] **Step 1: Add `image` field to TicketType model**

```prisma
model TicketType {
  id         String    @id @default(cuid())
  name       String
  price      Int
  quantity   Int
  soldCount  Int       @default(0)
  image      String?   // <-- ADD THIS LINE
  salesStart DateTime?
  salesEnd   DateTime?
  eventId    String
  event      Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tickets    Ticket[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

- [ ] **Step 2: Push schema to database**

Run: `npx prisma db push`
Expected: Schema pushed successfully

- [ ] **Step 3: Regenerate Prisma client**

Run: `npx prisma generate`

---

## Task 2: Add Upload Endpoint for Ticket Images

**Files:**
- Modify: `src/lib/uploadthing.ts:5-21`

- [ ] **Step 1: Add `ticketTypeImage` to upload router**

```typescript
export const uploadRouter = {
  eventBanner: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    return { url: file.url };
  }),
  speakerImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    return { url: file.url };
  }),
  galleryImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  }).onUploadComplete(({ file }) => {
    return { url: file.url };
  }),
  ticketTypeImage: f({   // <-- ADD THIS
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    return { url: file.url };
  }),
} satisfies FileRouter;
```

---

## Task 3: Update Ticket Types API to Accept Image + Allow SUPERADMIN

**Files:**
- Modify: `src/app/api/ticket-types/route.ts`

- [ ] **Step 1: Update POST to accept `image` and allow SUPERADMIN**

In the POST handler, line 15, add `image` to destructuring:
```typescript
const { eventId, name, price, quantity, salesStart, salesEnd, image } = body;
```

In the create call (line 40-48), add image:
```typescript
const ticketType = await prisma.ticketType.create({
  data: {
    eventId,
    name,
    price: Math.round(price * 100),
    quantity,
    ...(image && { image }),  // <-- ADD THIS
    ...(salesStart && { salesStart: new Date(salesStart) }),
    ...(salesEnd && { salesEnd: new Date(salesEnd) }),
  },
});
```

In the auth check (line 36), change to include SUPERADMIN:
```typescript
if (!user || (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
```

- [ ] **Step 2: Update PUT to allow SUPERADMIN**

In the auth check (line 85), change to include SUPERADMIN:
```typescript
if (!user || (ticketType.event.organizerId !== user.id && user.role !== "SUPERADMIN")) {
```

---

## Task 4: Fix Event Update API to Persist ALL Fields

**Files:**
- Modify: `src/app/api/events/[slug]/route.ts:53-105`

- [ ] **Step 1: Expand body destructuring to include all fields**

Replace line 82:
```typescript
const { title, description, banner, location, dateTime, isPublished } = body;
```

With:
```typescript
const {
  title, description, banner, location, dateTime, isPublished,
  isOnline, streamingLink, accessInstructions, category, targetAudience,
  speakerLabel, contactEmail, contactPhone, websiteUrl, twitterUrl,
  facebookUrl, instagramUrl, youtubeUrl, linkedinUrl,
} = body;
```

- [ ] **Step 2: Expand Prisma update data to include all fields**

Replace lines 84-98:
```typescript
const updatedEvent = await prisma.event.update({
  where: { id: slug },
  data: {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(banner !== undefined && { banner }),
    ...(location && { location }),
    ...(dateTime && { dateTime: new Date(dateTime) }),
    ...(isPublished !== undefined && { isPublished }),
    ...(isOnline !== undefined && { isOnline }),
    ...(streamingLink !== undefined && { streamingLink }),
    ...(accessInstructions !== undefined && { accessInstructions }),
    ...(category !== undefined && { category }),
    ...(targetAudience !== undefined && { targetAudience }),
    ...(speakerLabel !== undefined && { speakerLabel }),
    ...(contactEmail !== undefined && { contactEmail }),
    ...(contactPhone !== undefined && { contactPhone }),
    ...(websiteUrl !== undefined && { websiteUrl }),
    ...(twitterUrl !== undefined && { twitterUrl }),
    ...(facebookUrl !== undefined && { facebookUrl }),
    ...(instagramUrl !== undefined && { instagramUrl }),
    ...(youtubeUrl !== undefined && { youtubeUrl }),
    ...(linkedinUrl !== undefined && { linkedinUrl }),
  },
  include: {
    organizer: { select: { id: true, name: true, email: true } },
    ticketTypes: true,
  },
});
```

- [ ] **Step 3: Allow SUPERADMIN to edit events**

Change line 77:
```typescript
if (!user || (event.organizerId !== user.id && user.role !== "ADMIN")) {
```

To:
```typescript
if (!user || (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
```

Also update the DELETE handler auth check (line 131) the same way.

---

## Task 5: Update Tickets API to Return Ticket Image

**Files:**
- Modify: `src/app/api/tickets/route.ts:13-19`

- [ ] **Step 1: Include ticketType.image in the query**

Change the tickets include from:
```typescript
tickets: { include: { ticketType: true } },
```

To explicitly select fields (to ensure image is included):
```typescript
tickets: {
  include: {
    ticketType: {
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
      },
    },
  },
},
```

---

## Task 6: Add Ticket Image Upload UI to Organizer Dashboard

**Files:**
- Modify: `src/app/dashboard/events/[id]/page.tsx`

- [ ] **Step 1: Create reusable TicketImageUpload component**

Create: `src/components/ui/ticket-image-upload.tsx`

```typescript
"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface TicketImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  loading?: boolean;
}

export function TicketImageUpload({ value, onChange, loading }: TicketImageUploadProps) {
  const { startUpload, isUploading } = useUploadThing("ticketTypeImage", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
    },
  });

  const isLoading = loading || isUploading;

  return (
    <div className="flex items-center gap-4">
      {value && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
          <img src={value} alt="Ticket" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <label className={cn(
        "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm",
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
      )}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isLoading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await startUpload([file]);
          }}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Add state for ticket image in dashboard page**

In `src/app/dashboard/events/[id]/page.tsx`, near the other ticket form state (around line 30-35), add:
```typescript
const [ticketImage, setTicketImage] = useState("");
```

- [ ] **Step 3: Add TicketImageUpload to the ticket type creation form**

In the "Add Ticket Type" form (around line 1284-1321), after the "Quantity Available" field and before the submit button, add:

```tsx
<div className="space-y-2">
  <Label>Ticket Image (Optional)</Label>
  <TicketImageUpload value={ticketImage} onChange={setTicketImage} />
  <p className="text-xs text-muted-foreground">Optional image to represent this ticket type</p>
</div>
```

Also add the import at the top:
```typescript
import { TicketImageUpload } from "@/components/ui/ticket-image-upload";
```

- [ ] **Step 4: Include image in ticket type creation API call**

In the `onSubmitTicketType` function (around line 537-561), change the body to include image:
```typescript
body: JSON.stringify({ ...data, eventId: eventId, image: ticketImage || undefined }),
```

And reset the image after successful creation:
```typescript
setTicketTypes([...ticketTypes, result]);
reset();
setTicketImage("");  // <-- ADD THIS
```

- [ ] **Step 5: Display ticket images in the ticket types list**

In the "Ticket Types" list (around line 1334-1357), update the ticket display to show the image:

```tsx
<div key={tt.id} className="flex justify-between items-center p-4 border rounded-lg">
  <div className="flex items-center gap-3">
    {tt.image && (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img src={tt.image} alt={tt.name} className="w-full h-full object-cover" />
      </div>
    )}
    <div>
      <p className="font-medium">{tt.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatCurrency(tt.price)} • {tt.quantity} available • {tt.soldCount} sold
      </p>
    </div>
  </div>
  {tt.soldCount === 0 && (
    ...existing edit button...
  )}
</div>
```

---

## Task 7: Display Ticket Images on Public Event Page

**Files:**
- Modify: `src/app/events/[slug]/page.tsx:292-313`

- [ ] **Step 1: Add ticket image to the ticket type display**

In the available tickets map (around line 292-313), update each ticket card to show the image:

```tsx
<div
  key={ticketType.id}
  className="flex justify-between items-center p-4 border rounded-lg"
>
  <div className="flex items-center gap-3">
    {ticketType.image && (
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img src={ticketType.image} alt={ticketType.name} className="w-full h-full object-cover" />
      </div>
    )}
    <div>
      <p className="font-medium">{ticketType.name}</p>
      <p className="text-sm text-muted-foreground">
        {ticketType.quantity - ticketType.soldCount} remaining
      </p>
    </div>
  </div>
  <div className="text-right">
    <p className="font-bold">
      {ticketType.price === 0 ? "Free" : formatCurrency(ticketType.price)}
    </p>
    <Button asChild size="sm" className="mt-2">
      <Link href={`/checkout/${event.slug}?ticketType=${ticketType.id}`}>
        Buy
      </Link>
    </Button>
  </div>
</div>
```

---

## Task 8: Display Ticket Images on Purchased Ticket Page

**Files:**
- Modify: `src/app/tickets/[orderId]/page.tsx`

- [ ] **Step 1: Update Ticket interface to include image**

Around line 10-15, update the Ticket interface:
```typescript
interface Ticket {
  id: string;
  ticketId: string;
  qrCode: string;
  ticketType: { name: string; image?: string | null };
}
```

- [ ] **Step 2: Display ticket image on the ticket card**

In the ticket display area (look for where ticket information is rendered, around line 100+), add the image display near the ticket type name:

```tsx
<div className="flex items-center gap-3 mb-4">
  {ticket.ticketType.image && (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
      <img src={ticket.ticketType.image} alt={ticket.ticketType.name} className="w-full h-full object-cover" />
    </div>
  )}
  <div>
    <p className="font-medium text-lg">{ticket.ticketType.name}</p>
    <p className="text-sm text-muted-foreground">Ticket ID: {ticket.ticketId}</p>
  </div>
</div>
```

---

## Task 9: Display Ticket Images on Checkout Page

**Files:**
- Modify: `src/app/checkout/[eventId]/page.tsx`

- [ ] **Step 1: Update TicketType interface to include image**

Around line 16-22, update:
```typescript
interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  soldCount: number;
  image?: string | null;
}
```

- [ ] **Step 2: Display ticket image in cart items**

Find where ticket types are rendered in the cart (look for the cart items list), and add:

```tsx
<div className="flex items-center gap-3">
  {ticketType.image && (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
      <img src={ticketType.image} alt={ticketType.name} className="w-full h-full object-cover" />
    </div>
  )}
  <div>
    <p className="font-medium">{ticketType.name}</p>
    <p className="text-sm text-muted-foreground">{formatCurrency(ticketType.price)} each</p>
  </div>
</div>
```

---

## Task 10: Fix Dashboard State Updates for All Editable Fields

**Files:**
- Modify: `src/app/dashboard/events/[id]/page.tsx:465-477`

- [ ] **Step 1: Update `setEvent` call in `saveEventDetails` to include ALL fields**

The current code only updates a subset of fields in local state after a successful save. Update it to include ALL fields that were sent:

```typescript
setEvent({
  ...event,
  title: editedTitle,
  description: editedDescription,
  location: editedIsOnline ? "Online" : editedLocation,
  dateTime: result.dateTime,
  isOnline: editedIsOnline,
  streamingLink: editedStreamingLink,
  accessInstructions: editedAccessInstructions,
  category: editedCategory,
  targetAudience: editedTargetAudience,
  speakerLabel: editedSpeakerLabel,
  contactEmail: editedContactEmail,
  contactPhone: editedContactPhone,
  websiteUrl: editedWebsiteUrl,
  twitterUrl: editedTwitterUrl,
  facebookUrl: editedFacebookUrl,
  instagramUrl: editedInstagramUrl,
  youtubeUrl: editedYoutubeUrl,
  linkedinUrl: editedLinkedinUrl,  // Note: verify the state variable name
});
```

---

## Task 11: Implement Bank Name Dropdown in Payout Settings

**Files:**
- Create: `src/lib/paystack-banks.ts`
- Modify: `src/app/api/payout/route.ts`
- Modify: `src/app/dashboard/payout/page.tsx`
- Modify: `prisma/schema.prisma` (add `payoutBankName` to User model)

- [ ] **Step 1: Add `payoutBankName` to User model**

In `prisma/schema.prisma`, in the User model (near the other payout fields), add:
```prisma
  payoutBankName         String?
```

Then run:
```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 2: Create Paystack bank list utility**

Create: `src/lib/paystack-banks.ts`

```typescript
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface PaystackBank {
  name: string;
  code: string;
}

export async function fetchPaystackBanks(): Promise<PaystackBank[]> {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Failed to fetch banks:", data.message);
      return [];
    }

    return data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
    }));
  } catch (error) {
    console.error("Error fetching Paystack banks:", error);
    return [];
  }
}
```

- [ ] **Step 3: Update payout API to return bank list and accept bank name**

In `src/app/api/payout/route.ts`:

Add import:
```typescript
import { fetchPaystackBanks } from "@/lib/paystack-banks";
```

Update GET handler to also return bank list:
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, banks] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          payoutBankCode: true,
          payoutBankName: true,
          payoutAccountNumber: true,
          payoutAccountName: true,
          paystackSubaccountCode: true,
          paystackSettlementBank: true,
          transactionFeePercent: true,
        },
      }),
      fetchPaystackBanks(),
    ]);

    return NextResponse.json({ ...user, banks });
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
```

Update POST handler to accept and store `payoutBankName`:
Change line 103:
```typescript
const { payoutBankCode, payoutAccountNumber, payoutAccountName } = body;
```

To:
```typescript
const { payoutBankCode, payoutBankName, payoutAccountNumber, payoutAccountName } = body;
```

And in both update calls (lines 128-137 and 152-160), add `payoutBankName`:
```typescript
data: {
  payoutBankCode,
  payoutBankName: payoutBankName || undefined,
  payoutAccountNumber,
  payoutAccountName: accountNameFromBank,
  paystackSettlementBank: payoutBankCode,
},
```

- [ ] **Step 4: Create bank dropdown component**

Create: `src/components/ui/bank-select.tsx`

```typescript
"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Bank {
  name: string;
  code: string;
}

interface BankSelectProps {
  banks: Bank[];
  value?: string;
  onChange: (bankCode: string, bankName: string) => void;
  disabled?: boolean;
}

export function BankSelect({ banks, value, onChange, disabled }: BankSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedBank = banks.find((b) => b.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedBank ? selectedBank.name : "Select bank..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search bank..." />
          <CommandList>
            <CommandEmpty>No bank found.</CommandEmpty>
            <CommandGroup>
              {banks.map((bank) => (
                <CommandItem
                  key={bank.code}
                  value={bank.name}
                  onSelect={() => {
                    onChange(bank.code, bank.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === bank.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {bank.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 5: Update payout page to use bank dropdown**

In `src/app/dashboard/payout/page.tsx`:

Add imports:
```typescript
import { BankSelect } from "@/components/ui/bank-select";
```

Update the payout schema to remove bank code validation (or keep it as optional since bank name is the UX):
```typescript
const payoutSchema = z.object({
  payoutBankCode: z.string().min(1, "Bank is required"),
  payoutAccountNumber: z.string().min(10, "Account number required (10 digits)"),
  payoutAccountName: z.string().min(1, "Account name required"),
});
```

Add state for banks:
```typescript
const [banks, setBanks] = useState<any[]>([]);
const [selectedBankName, setSelectedBankName] = useState("");
```

Update the fetchSettings effect:
```typescript
useEffect(() => {
  async function fetchSettings() {
    try {
      const res = await fetch("/api/payout");
      if (res.ok) {
        const data = await res.json();
        if (data.payoutBankCode) setValue("payoutBankCode", data.payoutBankCode);
        if (data.payoutAccountNumber) setValue("payoutAccountNumber", data.payoutAccountNumber);
        if (data.payoutAccountName) setValue("payoutAccountName", data.payoutAccountName);
        if (data.banks) setBanks(data.banks);
        if (data.payoutBankName) setSelectedBankName(data.payoutBankName);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }
  fetchSettings();
}, [setValue]);
```

Replace the bank code input with the BankSelect component:
```tsx
<div className="space-y-2">
  <Label>Bank</Label>
  <BankSelect
    banks={banks}
    value={watch("payoutBankCode")}
    onChange={(code, name) => {
      setValue("payoutBankCode", code);
      setSelectedBankName(name);
    }}
  />
  {errors.payoutBankCode && (
    <p className="text-sm text-destructive">{errors.payoutBankCode.message}</p>
  )}
</div>
```

Update the submit handler to include bank name:
```typescript
const onSubmit = async (data: PayoutFormData) => {
  setSaving(true);
  try {
    const res = await fetch("/api/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, payoutBankName: selectedBankName }),
    });
    // ... rest of handler
  } catch {
    // ...
  } finally {
    setSaving(false);
  }
};
```

Also add `watch` to the useForm destructuring:
```typescript
const {
  register,
  handleSubmit,
  setValue,
  watch,
  formState: { errors },
} = useForm<PayoutFormData>({
  resolver: zodResolver(payoutSchema),
});
```

---

## Task 12: Verify and Test

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: No build errors

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All existing tests pass (or investigate failures)

- [ ] **Step 3: Manual verification checklist**

1. Create a new ticket type with an image — image should appear in dashboard list
2. View the event public page — ticket image should appear in the ticket card
3. Purchase a ticket — ticket image should appear on the purchased ticket page
4. Go through checkout — ticket image should appear in the cart
5. Edit an event's target audience, category, speaker label, online status, streaming link, access instructions, contact info, social links — all should persist after save
6. As SUPERADMIN, navigate to `/dashboard/events/[id]` for an event you don't own — should be able to view and edit
7. In payout settings, select a bank from the dropdown — should show bank name, and the bank code should be stored correctly
8. Verify account validation still works with the bank dropdown

---

## Self-Review Checklist

- [ ] **Spec coverage:** All four features are covered: ticket images, event update bug fix, superadmin edit access, bank name dropdown.
- [ ] **Placeholder scan:** No "TBD", "TODO", or vague instructions. All code blocks contain actual code.
- [ ] **Type consistency:** `image` field added to TicketType model, referenced consistently across API, dashboard, public pages, and checkout.
- [ ] **Auth consistency:** `SUPERADMIN` added alongside `ADMIN` in all relevant auth checks (`/api/events/[slug]`, `/api/ticket-types`).
- [ ] **Prisma consistency:** `payoutBankName` added to User model and referenced in API and UI.
