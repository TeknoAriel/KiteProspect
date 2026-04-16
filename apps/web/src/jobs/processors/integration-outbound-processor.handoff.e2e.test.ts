import { UnrecoverableError } from "bullmq";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@kite-prospect/db";
import { processIntegrationOutboundJob } from "./integration-outbound-processor";

const RUN = process.env.HANDOFF_INTEGRATION_E2E === "1";

/**
 * Postgres real + fetch simulado. Ejecutar:
 * `HANDOFF_INTEGRATION_E2E=1 dotenv -e .env -- npm run test -w @kite-prospect/web -- integration-outbound-processor.handoff.e2e`
 * Requiere migraciones y cuenta `demo` (npm run db:seed).
 */
(RUN ? describe : describe.skip)("integration-outbound handoff (E2E)", () => {
  async function seedQualifiedLead(): Promise<{
    accountId: string;
    contactId: string;
    leadId: string;
  }> {
    const acc = await prisma.account.findUnique({
      where: { slug: "demo" },
      select: { id: true },
    });
    if (!acc) {
      throw new Error('Cuenta "demo" no encontrada; ejecutá npm run db:seed');
    }
    const stamp = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const contact = await prisma.contact.create({
      data: {
        accountId: acc.id,
        email: `${stamp}@handoff-e2e.test`,
        name: "E2E Handoff",
      },
    });
    const lead = await prisma.lead.create({
      data: {
        accountId: acc.id,
        contactId: contact.id,
        status: "qualified",
        source: "form",
      },
    });
    await prisma.leadScore.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        intentScore: 10,
        readinessScore: 10,
        fitScore: 10,
        engagementScore: 10,
        totalScore: 40,
      },
    });
    await prisma.leadQualification.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        qualified: true,
        source: "rule",
      },
    });
    return { accountId: acc.id, contactId: contact.id, leadId: lead.id };
  }

  async function cleanup(ids: { leadId: string; contactId: string }) {
    await prisma.handoffOutboundAttempt.deleteMany({ where: { leadId: ids.leadId } });
    await prisma.auditEvent.deleteMany({
      where: { entityType: "lead", entityId: ids.leadId },
    });
    await prisma.leadScore.deleteMany({ where: { leadId: ids.leadId } });
    await prisma.leadQualification.deleteMany({ where: { leadId: ids.leadId } });
    await prisma.lead.deleteMany({ where: { id: ids.leadId } });
    await prisma.contact.deleteMany({ where: { id: ids.contactId } });
  }

  beforeAll(() => {
    process.env.KITEPROP_HANDOFF_URL = "http://test.kite/handoff";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 → handed_off, snapshot de payload", async () => {
    const ids = await seedQualifiedLead();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ accepted: true }), { status: 200 })),
    );

    await processIntegrationOutboundJob(ids);

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: ids.leadId } });
    expect(lead.status).toBe("handed_off");

    const attempt = await prisma.handoffOutboundAttempt.findFirst({
      where: { leadId: ids.leadId },
      orderBy: { createdAt: "desc" },
    });
    expect(attempt?.ok).toBe(true);
    expect(attempt?.httpStatus).toBe(200);
    expect(attempt?.requestPayloadSnapshot).toBeTruthy();

    await cleanup(ids);
  });

  it("409 duplicado cuenta como ACK y handed_off", async () => {
    const ids = await seedQualifiedLead();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("duplicate", { status: 409 })),
    );

    await processIntegrationOutboundJob(ids);

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: ids.leadId } });
    expect(lead.status).toBe("handed_off");
    const attempt = await prisma.handoffOutboundAttempt.findFirst({
      where: { leadId: ids.leadId },
    });
    expect(attempt?.ok).toBe(true);
    expect(attempt?.httpStatus).toBe(409);
    await cleanup(ids);
  });

  it("422 → UnrecoverableError, lead sigue qualified", async () => {
    const ids = await seedQualifiedLead();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "validation" }), { status: 422 })),
    );

    await expect(processIntegrationOutboundJob(ids)).rejects.toBeInstanceOf(UnrecoverableError);

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: ids.leadId } });
    expect(lead.status).toBe("qualified");
    const attempt = await prisma.handoffOutboundAttempt.findFirst({
      where: { leadId: ids.leadId },
    });
    expect(attempt?.ok).toBe(false);
    expect(attempt?.httpStatus).toBe(422);
    await cleanup(ids);
  });

  it("503 luego 200: primer intento falla, segundo handed_off", async () => {
    const ids = await seedQualifiedLead();
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        n += 1;
        if (n === 1) return new Response("unavailable", { status: 503 });
        return new Response("ok", { status: 200 });
      }),
    );

    await expect(processIntegrationOutboundJob(ids)).rejects.toThrow();

    let lead = await prisma.lead.findUniqueOrThrow({ where: { id: ids.leadId } });
    expect(lead.status).toBe("qualified");

    await processIntegrationOutboundJob(ids);
    lead = await prisma.lead.findUniqueOrThrow({ where: { id: ids.leadId } });
    expect(lead.status).toBe("handed_off");

    await cleanup(ids);
  });
});
