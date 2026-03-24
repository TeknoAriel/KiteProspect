/**
 * Datos de ejemplo para desarrollo local.
 * Idempotente: si ya existe la cuenta `demo`, no hace cambios.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const already = await prisma.account.findUnique({ where: { slug: "demo" } });
  if (already) {
    console.log('Seed omitido: ya existe Account con slug "demo".');
    return;
  }

  const account = await prisma.account.create({
    data: {
      name: "Inmobiliaria Demo",
      slug: "demo",
      status: "active",
      config: { timezone: "America/Argentina/Buenos_Aires" },
    },
  });

  const hashedPassword = await bcrypt.hash("demo123", 10);

  const adminUser = await prisma.user.create({
    data: {
      accountId: account.id,
      email: "admin@demo.local",
      password: hashedPassword,
      name: "Admin Demo",
      role: "admin",
      status: "active",
    },
  });

  const advisor = await prisma.advisor.create({
    data: {
      accountId: account.id,
      userId: adminUser.id,
      name: "Asesor Demo",
      email: "asesor@demo.local",
      status: "active",
    },
  });

  const property = await prisma.property.create({
    data: {
      accountId: account.id,
      title: "Departamento 2 ambientes — Palermo",
      description: "Ejemplo de inventario para desarrollo.",
      type: "departamento",
      intent: "venta",
      zone: "Palermo",
      price: 185000,
      bedrooms: 2,
      bathrooms: 1,
      status: "available",
    },
  });

  const contact = await prisma.contact.create({
    data: {
      accountId: account.id,
      name: "María Contacto",
      email: "maria.contacto@example.com",
      phone: "+5491112345678",
      conversationalStage: "answered",
      commercialStage: "prospect",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      accountId: account.id,
      contactId: contact.id,
      channel: "form",
      status: "active",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      content: "Hola, busco un 2 ambientes en Palermo.",
      channel: "form",
    },
  });

  await prisma.searchProfile.create({
    data: {
      contactId: contact.id,
      intent: "compra",
      propertyType: "departamento",
      zone: "Palermo",
      maxPrice: 200000,
      bedrooms: 2,
      source: "declared",
    },
  });

  await prisma.leadScore.create({
    data: {
      contactId: contact.id,
      intentScore: 40,
      readinessScore: 30,
      fitScore: 50,
      engagementScore: 35,
      totalScore: 39,
      version: 1,
    },
  });

  const followUpPlan = await prisma.followUpPlan.create({
    data: {
      accountId: account.id,
      name: "Seguimiento estándar (demo)",
      description: "Secuencia mínima para pruebas locales.",
      intensity: "low",
      maxAttempts: 3,
      sequence: [
        { step: 0, delayHours: 0, channel: "email", objective: "confirmar interés" },
        { step: 1, delayHours: 72, channel: "whatsapp", objective: "agendar llamada" },
      ],
      status: "active",
    },
  });

  await prisma.followUpSequence.create({
    data: {
      contactId: contact.id,
      followUpPlanId: followUpPlan.id,
      status: "active",
      currentStep: 0,
      attempts: 0,
      nextAttemptAt: new Date(),
    },
  });

  await prisma.assignment.create({
    data: {
      contactId: contact.id,
      advisorId: advisor.id,
      status: "active",
      reason: "seed",
    },
  });

  await prisma.propertyMatch.create({
    data: {
      contactId: contact.id,
      propertyId: property.id,
      score: 72,
      reason: "Zona y ambientes alineados con perfil declarado (demo).",
    },
  });

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

  console.log("Seed OK:", {
    accountId: account.id,
    adminEmail: adminUser.email,
    contactId: contact.id,
    propertyId: property.id,
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
