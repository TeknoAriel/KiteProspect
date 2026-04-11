import { prisma, Prisma } from "@kite-prospect/db";
import { processDueFollowUps } from "@/domains/followups/services/process-due-follow-ups";

export type FollowUpLabResult =
  | {
      ok: true;
      planId: string;
      planName: string;
      sequenceId: string;
      contactId: string;
      cron: {
        sequencesExamined: number;
        attemptsCreated: number;
        skipped: number;
      };
      firstAttempt: {
        id: string;
        step: number;
        channel: string;
        outcome: string | null;
      } | null;
    }
  | { ok: false; reason: string };

/**
 * Un tick de seguimiento aislado a la cuenta, con contacto sintético y plan existente.
 */
export async function runFollowUpLab(params: {
  accountId: string;
  phoneSuffix: string;
  asOf: Date;
}): Promise<FollowUpLabResult> {
  let plan = await prisma.followUpPlan.findFirst({
    where: {
      accountId: params.accountId,
      status: "active",
      triggers: { equals: Prisma.DbNull },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan) {
    plan = await prisma.followUpPlan.findFirst({
      where: { accountId: params.accountId, status: "active" },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!plan) {
    return { ok: false, reason: "No hay FollowUpPlan activo en la cuenta." };
  }

  const seqRaw = plan.sequence;
  if (!Array.isArray(seqRaw) || seqRaw.length === 0) {
    return { ok: false, reason: "El plan no tiene secuencia JSON válida." };
  }

  const phone = `+1555888${params.phoneSuffix}`;
  const contact = await prisma.contact.create({
    data: {
      accountId: params.accountId,
      name: "Lab · seguimiento (tick)",
      phone,
      email: `fu.lab.${params.phoneSuffix}@kite.lab`,
      conversationalStage: "answered",
      commercialStage: "exploratory",
    },
  });

  const sequence = await prisma.followUpSequence.create({
    data: {
      contactId: contact.id,
      followUpPlanId: plan.id,
      status: "active",
      currentStep: 0,
      attempts: 0,
      nextAttemptAt: new Date(params.asOf.getTime() - 60_000),
    },
  });

  const cron = await processDueFollowUps({
    asOf: params.asOf,
    filterAccountId: params.accountId,
    batchLimit: 50,
  });

  const firstAttempt = await prisma.followUpAttempt.findFirst({
    where: { sequenceId: sequence.id },
    orderBy: { attemptedAt: "asc" },
    select: { id: true, step: true, channel: true, outcome: true },
  });

  return {
    ok: true,
    planId: plan.id,
    planName: plan.name,
    sequenceId: sequence.id,
    contactId: contact.id,
    cron,
    firstAttempt: firstAttempt
      ? {
          id: firstAttempt.id,
          step: firstAttempt.step,
          channel: firstAttempt.channel,
          outcome: firstAttempt.outcome,
        }
      : null,
  };
}
