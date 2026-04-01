/**
 * Datos de ejemplo para desarrollo local y seed en deploy.
 * Idempotente: cuenta `demo` + usuario admin; datos enriquecidos vía `ensureDemoShowcase`.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDemoShowcase } from "./seed-demo-showcase.js";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  let account = await prisma.account.findUnique({ where: { slug: "demo" } });
  const createdNewAccount = !account;

  if (!account) {
    account = await prisma.account.create({
      data: {
        name: "Inmobiliaria Demo",
        slug: "demo",
        status: "active",
        config: { timezone: "America/Argentina/Buenos_Aires" },
      },
    });
  }

  let adminUser = await prisma.user.findFirst({
    where: {
      accountId: account.id,
      email: { equals: "admin@demo.local", mode: "insensitive" },
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        accountId: account.id,
        email: "admin@demo.local",
        password: hashedPassword,
        name: "Admin Demo",
        role: "admin",
        status: "active",
      },
    });
    console.log('Seed: se creó admin@demo.local en cuenta "demo".');
  } else if (adminUser.status !== "active") {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { status: "active", password: hashedPassword },
    });
    console.log('Seed: se reactivó admin@demo.local en cuenta "demo".');
  }

  let advisor = await prisma.advisor.findFirst({
    where: { accountId: account.id },
  });

  if (!advisor) {
    advisor = await prisma.advisor.create({
      data: {
        accountId: account.id,
        userId: adminUser.id,
        name: "Asesor Demo",
        email: "asesor@demo.local",
        status: "active",
      },
    });
  }

  await ensureDemoShowcase(prisma, account.id, advisor.id);

  if (createdNewAccount) {
    await prisma.auditEvent.create({
      data: {
        accountId: account.id,
        entityType: "account",
        entityId: account.id,
        action: "seed_demo_applied",
        actorType: "system",
        metadata: { source: "prisma/seed.ts" },
      },
    });
  }

  console.log("Seed OK:", {
    accountId: account.id,
    adminEmail: adminUser.email,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
