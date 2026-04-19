import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_EMAIL = "admin@hitix";
  const ADMIN_PASSWORD = "Admin@123"; // Change this!
  
  // Check if superadmin exists
  const existingSuperadmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingSuperadmin) {
    console.log("Superadmin already exists:", ADMIN_EMAIL);
    console.log("To reset password, manually update in DB or use --force flag");
    return;
  }

  // Hash the password
  const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10);
  
  // Create superadmin
  const superadmin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: "Platform Superadmin",
      role: "SUPERADMIN",
      isActive: true,
    },
  });

  console.log("=".repeat(40));
  console.log("✅ Superadmin created successfully!");
  console.log("=".repeat(40));
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`Role:     SUPERADMIN`);
  console.log("=".repeat(40));
  console.log("\n📝 Login at: /login");
  console.log("📊 Admin panel: /admin_dash");
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });