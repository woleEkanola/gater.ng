import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const organizerPassword = await bcrypt.hash("organizer123", 10);
  const attendeePassword = await bcrypt.hash("attendee123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hitix" },
    update: {},
    create: {
      email: "admin@hitix",
      password: adminPassword,
      name: "Super Admin",
      role: Role.ADMIN,
      transactionFeePercent: 5,
    },
  });
  console.log("✓ Created admin:", admin.email);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@hitix" },
    update: {},
    create: {
      email: "organizer@hitix",
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
    where: { email: "attendee@hitix" },
    update: {},
    create: {
      email: "attendee@hitix",
      password: attendeePassword,
      name: "Test Attendee",
      role: Role.ATTENDEE,
    },
  });
  console.log("✓ Created attendee:", attendee.email);

  const defaultAudiences = [
    { name: "Everyone", isDefault: true, isCustom: false },
    { name: "Beginners", isDefault: true, isCustom: false },
    { name: "Professionals", isDefault: true, isCustom: false },
    { name: "Students", isDefault: true, isCustom: false },
    { name: "Entrepreneurs", isDefault: true, isCustom: false },
    { name: "Women Only", isDefault: true, isCustom: false },
  ];

  for (const audience of defaultAudiences) {
    await prisma.audienceType.upsert({
      where: { name: audience.name },
      update: {},
      create: audience,
    });
  }
  console.log("✓ Created default audience types");

  const defaultTags = [
    { name: "Workshop", color: "#10b981" },
    { name: "Conference", color: "#3b82f6" },
    { name: "Networking", color: "#8b5cf6" },
    { name: "Music", color: "#f59e0b" },
    { name: "Sports", color: "#ef4444" },
    { name: "Food", color: "#ec4899" },
    { name: "Art", color: "#06b6d4" },
    { name: "Tech", color: "#6366f1" },
  ];

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log("✓ Created default tags");

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
  console.log("  Admin: admin@hitix / admin123");
  console.log("  Organizer: organizer@hitix / organizer123");
  console.log("  Attendee: attendee@hitix / attendee123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());