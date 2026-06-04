import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
  select: { email: true, name: true, role: true },
}).then(r => { console.log(JSON.stringify(r, null, 2)); prisma.$disconnect(); });
