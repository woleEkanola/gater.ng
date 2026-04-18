import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const organizerPassword = await bcrypt.hash("organizer123", 10);
  const attendeePassword = await bcrypt.hash("attendee123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gater.ng" },
    update: {},
    create: {
      email: "admin@gater.ng",
      password: adminPassword,
      name: "Super Admin",
      role: Role.ADMIN,
      transactionFeePercent: 5,
    },
  });
  console.log("✓ Created admin:", admin.email);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@gater.ng" },
    update: {},
    create: {
      email: "organizer@gater.ng",
      password: organizerPassword,
      name: "Test Organizer",
      role: Role.ORGANIZER,
      transactionFeePercent: 5,
      payoutBankCode: "044",
      payoutAccountNumber: "0123456789",
      payoutAccountName: "Test Organizer",
    },
  });
  console.log("✓ Created organizer:", organizer.email);

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@gater.ng" },
    update: {},
    create: {
      email: "attendee@gater.ng",
      password: attendeePassword,
      name: "Test Attendee",
      role: Role.ATTENDEE,
    },
  });
  console.log("✓ Created attendee:", attendee.email);

  const event = await prisma.event.upsert({
    where: { slug: "test-conference-2024" },
    update: {},
    create: {
      title: "Tech Conference 2024",
      slug: "test-conference-2024",
      description: "A major tech conference featuring industry leaders",
      location: "Lagos, Nigeria",
      dateTime: new Date("2024-12-15T09:00:00Z"),
      isPublished: true,
      organizerId: organizer.id,
    },
  });
  console.log("✓ Created event:", event.title);

  await prisma.ticketType.upsert({
    where: { id: "vip-ticket" },
    update: {},
    create: {
      id: "vip-ticket",
      name: "VIP Ticket",
      price: 25000,
      quantity: 50,
      eventId: event.id,
    },
  });

  await prisma.ticketType.upsert({
    where: { id: "regular-ticket" },
    update: {},
    create: {
      id: "regular-ticket",
      name: "Regular Ticket",
      price: 10000,
      quantity: 200,
      eventId: event.id,
    },
  });

  await prisma.ticketType.upsert({
    where: { id: "free-ticket" },
    update: {},
    create: {
      id: "free-ticket",
      name: "Free Entry",
      price: 0,
      quantity: 100,
      eventId: event.id,
    },
  });
  console.log("✓ Created ticket types for event");

  await prisma.event.upsert({
    where: { slug: "free-workshop" },
    update: {},
    create: {
      title: "Free Workshop",
      slug: "free-workshop",
      description: "A free workshop for beginners",
      location: "Abuja, Nigeria",
      dateTime: new Date("2024-11-20T10:00:00Z"),
      isPublished: true,
      organizerId: organizer.id,
    },
  });
  console.log("✓ Created free event");

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Test Accounts:");
  console.log("  Admin: admin@gater.ng / admin123");
  console.log("  Organizer: organizer@gater.ng / organizer123");
  console.log("  Attendee: attendee@gater.ng / attendee123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());