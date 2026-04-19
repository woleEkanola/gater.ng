import prisma from "../src/lib/prisma";

const b2bPages = [
  {
    slug: "sell-tickets-for-tech-meetups",
    h1Title: "Sell Tickets for Your Tech Meetup",
    subHeadline: "The all-in-one ticketing platform built for technology events. Handle RSVPs, payments, and check-ins seamlessly.",
    targetAudience: "tech-meetups",
    intent: "sell-tickets-for",
    featuresJson: JSON.stringify([
      "Online payment processing with Paystack",
      "QR code check-in at the door",
      "Attendee management dashboard",
      "Email notifications to attendees",
      "Customizable event pages"
    ]),
    metaTitle: "Sell Tickets for Tech Meetups | Hitix",
    metaDescription: "Sell tickets for your tech meetup events. Easy setup, secure payments, and instant QR check-in. Get started for free.",
    ctaText: "Create Tech Event",
    ctaLink: "/dashboard/events/new?type=tech"
  },
  {
    slug: "sell-tickets-for-university-parties",
    h1Title: "Sell Tickets for University Parties",
    subHeadline: "The trusted ticketing platform for student organizations. Promote your events to thousands of students.",
    targetAudience: "university-parties",
    intent: "sell-tickets-for",
    featuresJson: JSON.stringify([
      "Group discount options",
      "Student-friendly pricing",
      "Social media sharing",
      "Real-time attendance tracking",
      "Automated confirmations"
    ]),
    metaTitle: "Sell Tickets for University Parties | Hitix",
    metaDescription: "Sell tickets for university parties and student events. Fast setup, secure payments, and instant check-in.",
    ctaText: "Create Student Event",
    ctaLink: "/dashboard/events/new?type=party"
  },
  {
    slug: "sell-tickets-for-masterclasses",
    h1Title: "Sell Tickets for Masterclasses",
    subHeadline: "Professional ticketing for workshops and masterclasses. Accept payments and manage your attendees with ease.",
    targetAudience: "masterclasses",
    intent: "sell-tickets-for",
    featuresJson: JSON.stringify([
      "Secure payment processing",
      "Limited capacity settings",
      "Waitlist management",
      "Certificate generation",
      "Post-event analytics"
    ]),
    metaTitle: "Sell Tickets for Masterclasses | Hitix",
    metaDescription: "Sell tickets for your masterclasses and workshops. Easy registration, secure payments, and attendee management.",
    ctaText: "Create Workshop",
    ctaLink: "/dashboard/events/new?type=workshop"
  },
  {
    slug: "manage-rsvps-for-tech-meetups",
    h1Title: "Manage RSVPs for Your Tech Meetup",
    subHeadline: "Track attendance and manage RSVPs for your tech meetups. Know exactly who's coming.",
    targetAudience: "tech-meetups",
    intent: "manage-rsvps-for",
    featuresJson: JSON.stringify([
      "RSVP tracking dashboard",
      "Waitlist functionality",
      "Check-in app",
      "Attendance reports",
      "Email reminders"
    ]),
    metaTitle: "Manage RSVPs for Tech Meetups | Hitix",
    metaDescription: "Manage RSVPs for your tech meetup events. Easy check-in, real-time attendance tracking, and automated reminders.",
    ctaText: "Start Managing RSVPs",
    ctaLink: "/dashboard/events/new?type=tech"
  },
  {
    slug: "manage-rsvps-for-university-parties",
    h1Title: "Manage RSVPs for University Parties",
    subHeadline: "Track and manage RSVPs for student parties. Know your numbers and avoid overcrowding.",
    targetAudience: "university-parties",
    intent: "manage-rsvps-for",
    featuresJson: JSON.stringify([
      "Guest list management",
      "Capacity controls",
      "Check-in scanning",
      "Real-time count",
      "Social integrations"
    ]),
    metaTitle: "Manage RSVPs for University Parties | Hitix",
    metaDescription: "Manage RSVPs for university parties. Track attendance, control capacity, and streamline check-ins.",
    ctaText: "Start Managing RSVPs",
    ctaLink: "/dashboard/events/new?type=party"
  },
  {
    slug: "manage-rsvps-for-masterclasses",
    h1Title: "Manage RSVPs for Masterclasses",
    subHeadline: "Keep track of workshop attendees with professional RSVP management. Limited seats? No problem.",
    targetAudience: "masterclasses",
    intent: "manage-rsvps-for",
    featuresJson: JSON.stringify([
      "Seat reservation system",
      "Waitlist automation",
      "Attendance verification",
      "Feedback collection",
      "Follow-up emails"
    ]),
    metaTitle: "Manage RSVPs for Masterclasses | Hitix",
    metaDescription: "Manage RSVPs for masterclasses and workshops. Set capacity limits and automatically manage waitlists.",
    ctaText: "Start Managing RSVPs",
    ctaLink: "/dashboard/events/new?type=workshop"
  },
  {
    slug: "sell-tickets-for-music-concerts",
    h1Title: "Sell Tickets for Music Concerts",
    subHeadline: "Professional ticketing for live music events. From intimate gigs to full concerts.",
    targetAudience: "music-concerts",
    intent: "sell-tickets-for",
    featuresJson: JSON.stringify([
      "Tiered pricing options",
      "Early bird tickets",
      "VIP packages",
      "Secure door check-in",
      "Revenue analytics"
    ]),
    metaTitle: "Sell Tickets for Music Concerts | Hitix",
    metaDescription: "Sell tickets for music concerts and live events. Set pricing tiers, manage VIP packages, and track revenue.",
    ctaText: "Create Concert",
    ctaLink: "/dashboard/events/new?type=concert"
  },
  {
    slug: "sell-tickets-for-corporate-events",
    h1Title: "Sell Tickets for Corporate Events",
    subHeadline: "Modern ticketing for conferences, seminars, and corporate gatherings.",
    targetAudience: "corporate-events",
    intent: "sell-tickets-for",
    featuresJson: JSON.stringify([
      "Invoice generation",
      "Bulk ticket purchases",
      "Professional receipts",
      "Attendee badges",
      "Event check-in"
    ]),
    metaTitle: "Sell Tickets for Corporate Events | Hitix",
    metaDescription: "Sell tickets for corporate events and conferences. Professional invoicing and bulk ticket options.",
    ctaText: "Create Corporate Event",
    ctaLink: "/dashboard/events/new?type=corporate"
  }
];

async function main() {
  console.log("🌱 Seeding B2B Landing Pages...");

  for (const page of b2bPages) {
    await prisma.b2BLandingPage.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
    console.log(`✅ Created: ${page.slug}`);
  }

  console.log("\n✅ B2B Pages seeded successfully!");
  const count = await prisma.b2BLandingPage.count();
  console.log(`Total B2B pages: ${count}`);
}

main()
  .catch((e) => {
    console.error("Error seeding B2B pages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });