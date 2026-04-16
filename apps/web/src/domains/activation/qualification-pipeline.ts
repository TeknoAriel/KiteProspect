import { prisma } from "@kite-prospect/db";
import { calculateLeadScore } from "@/domains/scoring/services/calculate-score";
import { loadEngagementSignals } from "./engagement-metrics";
import { evaluateAutomaticQualification } from "./lead-qualification";

/**
 * Tras scoring: evalúa Q1–Q8 / E1–E3; si pasa, marca lead qualified (una sola transición open→qualified) y encola handoff.
 * Q8: lead debe estar `open`. Concurrencia: `updateMany` con status `open`.
 */
export async function runScoringAndQualificationPipeline(input: {
  accountId: string;
  contactId: string;
  leadId: string;
}): Promise<{ scoreId: string; qualified: boolean; needsHandoffDispatch: boolean }> {
  const { accountId, contactId, leadId } = input;

  const leadRow = await prisma.lead.findFirst({
    where: { id: leadId, accountId, contactId },
  });
  if (!leadRow || leadRow.status !== "open") {
    return { scoreId: "", qualified: false, needsHandoffDispatch: false };
  }

  const score = await calculateLeadScore(contactId, accountId, { leadId });

  const [contact, engagement, consents] = await Promise.all([
    prisma.contact.findUniqueOrThrow({ where: { id: contactId } }),
    loadEngagementSignals(contactId),
    prisma.consent.findMany({ where: { contactId } }),
  ]);

  const q = evaluateAutomaticQualification(
    {
      totalScore: score.totalScore,
      intentScore: score.intentScore,
      readinessScore: score.readinessScore,
      fitScore: score.fitScore,
      engagementScore: score.engagementScore,
    },
    engagement,
    {
      commercialStage: contact.commercialStage,
      consents,
    },
  );

  if (!q.qualified) {
    return { scoreId: score.id, qualified: false, needsHandoffDispatch: false };
  }

  const applied = await prisma.$transaction(async (tx) => {
    const upd = await tx.lead.updateMany({
      where: {
        id: leadId,
        accountId,
        contactId,
        status: "open",
      },
      data: { status: "qualified" },
    });

    if (upd.count !== 1) {
      return false;
    }

    await tx.leadQualification.create({
      data: {
        contactId,
        leadId,
        qualified: true,
        reason: q.reasons.join("; "),
        criteria: {
          rules: "Q1-Q8,E1-E3",
          scoreSnapshot: {
            total: score.totalScore,
            intent: score.intentScore,
            readiness: score.readinessScore,
            fit: score.fitScore,
            engagement: score.engagementScore,
          },
        },
        source: "rule",
      },
    });

    await tx.auditEvent.create({
      data: {
        accountId,
        entityType: "lead",
        entityId: leadId,
        action: "lead_qualified",
        actorType: "system",
        metadata: { contactId, scoreId: score.id },
      },
    });

    return true;
  });

  if (!applied) {
    return { scoreId: score.id, qualified: false, needsHandoffDispatch: false };
  }

  return {
    scoreId: score.id,
    qualified: true,
    needsHandoffDispatch: true,
  };
}

export async function applyManualQualificationOverride(input: {
  accountId: string;
  contactId: string;
  leadId: string;
  criteriaNote: string;
  actorUserId: string;
}): Promise<void> {
  const applied = await prisma.$transaction(async (tx) => {
    const upd = await tx.lead.updateMany({
      where: {
        id: input.leadId,
        accountId: input.accountId,
        contactId: input.contactId,
        status: "open",
      },
      data: { status: "qualified" },
    });

    if (upd.count !== 1) {
      return false;
    }

    await tx.leadQualification.create({
      data: {
        contactId: input.contactId,
        leadId: input.leadId,
        qualified: true,
        reason: input.criteriaNote,
        criteria: { override: true },
        source: "manual",
      },
    });

    await tx.auditEvent.create({
      data: {
        accountId: input.accountId,
        entityType: "lead",
        entityId: input.leadId,
        action: "lead_qualified_manual",
        actorType: "user",
        actorId: input.actorUserId,
        metadata: { contactId: input.contactId },
      },
    });

    return true;
  });

  if (!applied) {
    throw new Error("Lead no elegible para override");
  }

  const { dispatchIntegrationOutbound } = await import("@/jobs/dispatch");
  await dispatchIntegrationOutbound({
    accountId: input.accountId,
    leadId: input.leadId,
    contactId: input.contactId,
  });
}
