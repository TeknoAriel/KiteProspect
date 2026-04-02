/**
 * Inicia una FollowUpSequence para un contacto (plan del mismo tenant).
 * No reemplaza secuencias activas: debe resolverse antes en la capa llamadora.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { parsePlanSequence } from "./process-due-follow-ups";

export type StartFollowUpSequenceInput = {
  accountId: string;
  contactId: string;
  followUpPlanId: string;
  actorUserId: string;
};

export type StartFollowUpSequenceResult =
  | { ok: true; sequenceId: string }
  | { ok: false; error: "contact_not_found" | "plan_not_found" | "empty_sequence" | "active_sequence_exists" };

export async function startFollowUpSequenceForContact(
  input: StartFollowUpSequenceInput,
): Promise<StartFollowUpSequenceResult> {
  const contact = await prisma.contact.findFirst({
    where: { id: input.contactId, accountId: input.accountId },
    select: { id: true },
  });
  if (!contact) return { ok: false, error: "contact_not_found" };

  const plan = await prisma.followUpPlan.findFirst({
    where: { id: input.followUpPlanId, accountId: input.accountId, status: "active" },
    select: { id: true, name: true, sequence: true, maxAttempts: true },
  });
  if (!plan) return { ok: false, error: "plan_not_found" };

  const steps = parsePlanSequence(plan.sequence);
  if (steps.length === 0) return { ok: false, error: "empty_sequence" };

  const existingActive = await prisma.followUpSequence.findFirst({
    where: { contactId: input.contactId, status: "active" },
    select: { id: true },
  });
  if (existingActive) return { ok: false, error: "active_sequence_exists" };

  const nextAttemptAt = new Date();

  const seq = await prisma.followUpSequence.create({
    data: {
      contactId: input.contactId,
      followUpPlanId: plan.id,
      status: "active",
      currentStep: 0,
      attempts: 0,
      nextAttemptAt,
    },
    select: { id: true },
  });

  await recordAuditEvent({
    accountId: input.accountId,
    entityType: "follow_up_sequence",
    entityId: seq.id,
    action: "follow_up_sequence_started",
    actorId: input.actorUserId,
    actorType: "user",
    metadata: {
      contactId: input.contactId,
      followUpPlanId: plan.id,
      planName: plan.name,
      stepsCount: steps.length,
      maxAttempts: plan.maxAttempts,
    },
  });

  return { ok: true, sequenceId: seq.id };
}
