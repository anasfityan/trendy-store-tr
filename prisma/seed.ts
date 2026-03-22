import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      role: "admin",
      name: "Admin",
    },
  });

  const workerPassword = await bcrypt.hash("worker123", 10);
  await prisma.user.upsert({
    where: { username: "worker" },
    update: {},
    create: {
      username: "worker",
      password: workerPassword,
      role: "worker",
      name: "Worker",
    },
  });

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "Trendy Store",
      usdToTry: 38.0,
      usdToIqd: 1460.0,
      tryToIqd: 38.4,
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
