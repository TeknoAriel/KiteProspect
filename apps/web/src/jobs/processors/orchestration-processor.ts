import { prisma } from "@kite-prospect/db";
import { evaluateOrchestration } from "@/domains/activation/orchestration-engine";
import type { OrchestrationJobPayload } from "../job-payloads";

export async function processOrchestrationJob(
  payload: OrchestrationJobPayload,
): Promise<void> {
  const contact = await prisma.contact.findFirst({
    where: { id: payload.contactId, accountId: payload.accountId },
  });
  if (!contact) return;

  const lead = await prisma.lead.findFirst({
    where: { id: payload.leadId, contactId: payload.contactId },
  });

  const lastInbound = await prisma.message.findFirst({
    where: {
      direction: "inbound",
      conversation: { contactId: payload.contactId },
    },
    orderBy: { createdAt: "desc" },
  });

  const lastOutbound = await prisma.message.findFirst({
    where: {
      direction: "outbound",
      conversation: { contactId: payload.contactId },
    },
    orderBy: { createdAt: "desc" },
  });

  const hoursSinceInbound =
    lastInbound != null
      ? (Date.now() - lastInbound.createdAt.getTime()) / (60 * 60 * 1000)
      : null;

  const decision = evaluateOrchestration({
    commercialStage: contact.commercialStage,
    optOutAny: contact.commercialStage === "blocked",
    lastInboundAt: lastInbound?.createdAt ?? null,
    lastOutboundAt: lastOutbound?.createdAt ?? null,
    hoursSinceLastInbound: hoursSinceInbound,
    qualifiedLeadPendingHandoff: lead?.status === "qualified",
  });

  await prisma.auditEvent.create({
    data: {
      accountId: payload.accountId,
      entityType: "lead",
      entityId: payload.leadId,
      action: "orchestration_evaluated",
      actorType: "system",
      metadata: {
        decision,
        contactId: payload.contactId,
      },
    },
  });
}
