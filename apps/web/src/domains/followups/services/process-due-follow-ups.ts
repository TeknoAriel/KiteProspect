/**
 * Procesa secuencias de seguimiento con nextAttemptAt vencido (cron / worker futuro).
 */
import { prisma, Prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { sendFollowUpEmailToContact } from "@/domains/integrations/email/send-follow-up-email";
import { sendWhatsAppTextToContact } from "@/domains/integrations/whatsapp/send-whatsapp-text";
import type { ProcessDueFollowUpsInput, ProcessDueFollowUpsResult } from "../follow-up-job-contract";

const HOUR_MS = 60 * 60 * 1000;

export type SequenceStep = {
  step: number;
  delayHours: number;
  channel: string;
  objective?: string;
};

export function parsePlanSequence(json: unknown): SequenceStep[] {
  if (!Array.isArray(json)) return [];
  const out: SequenceStep[] = [];
  for (let i = 0; i < json.length; i++) {
    const x = json[i];
    if (typeof x !== "object" || x === null) continue;
    const o = x as Record<string, unknown>;
    const channel = typeof o.channel === "string" ? o.channel : "email";
    const delayHours = typeof o.delayHours === "number" ? o.delayHours : 0;
    const step = typeof o.step === "number" ? o.step : i;
    const objective = typeof o.objective === "string" ? o.objective : undefined;
    out.push({ step, delayHours, channel, objective });
  }
  return out;
}

function defaultBatchLimit(): number {
  const raw = process.env.FOLLOW_UP_CRON_BATCH_LIMIT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 25;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 25;
}

function followUpWhatsAppBody(step: SequenceStep): string {
  const o = step.objective?.trim();
  if (o) return o.slice(0, 4096);
  return "Hola, te escribimos para dar seguimiento a tu consulta. Si querés, contanos cómo seguimos.";
}

async function createManualFollowUpTask(params: {
  contactId: string;
  channel: string;
  objective?: string | null;
  sequenceId: string;
  step: number;
}): Promise<string> {
  const ch = params.channel.trim().toLowerCase();
  const title =
    ch === "instagram" || ch === "ig"
      ? "Seguimiento Instagram (DM manual)"
      : `Seguimiento ${params.channel} (acción manual)`;
  const description = [
    params.objective?.trim() || undefined,
    `Referencia: secuencia ${params.sequenceId} · paso ${params.step}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const task = await prisma.task.create({
    data: {
      contactId: params.contactId,
      title: title.slice(0, 500),
      description: description.slice(0, 8000),
      type: "followup",
      status: "pending",
    },
  });
  return task.id;
}

/**
 * Ejecuta un paso por secuencia vencida: crea FollowUpAttempt, avanza paso y programa siguiente.
 * - `whatsapp`: Graph API (Meta) si está configurado.
 * - `email`: Resend si `RESEND_API_KEY` + `FOLLOW_UP_FROM_EMAIL`; si no, tarea manual.
 * - `instagram` / otros: tarea CRM para acción humana (sin API de DM en MVP).
 */
export async function processDueFollowUps(
  input: ProcessDueFollowUpsInput = {},
): Promise<ProcessDueFollowUpsResult> {
  const batchLimit =
    input.batchLimit != null && input.batchLimit > 0
      ? Math.min(input.batchLimit, 200)
      : defaultBatchLimit();
  const now = new Date();

  const due = await prisma.followUpSequence.findMany({
    where: {
      status: "active",
      nextAttemptAt: { lte: now },
    },
    include: {
      contact: { select: { id: true, accountId: true, email: true, name: true, phone: true } },
      plan: true,
    },
    orderBy: { nextAttemptAt: "asc" },
    take: batchLimit,
  });

  let sequencesExamined = 0;
  let attemptsCreated = 0;
  let skipped = 0;

  for (const seq of due) {
    sequencesExamined++;
    try {
      const plan = seq.plan;
      const steps = parsePlanSequence(plan.sequence);

      if (steps.length === 0) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: { status: "completed", nextAttemptAt: null },
        });
        skipped++;
        continue;
      }

      if (seq.attempts >= plan.maxAttempts) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: { status: "completed", nextAttemptAt: null },
        });
        skipped++;
        continue;
      }

      const idx = seq.currentStep;
      if (idx < 0 || idx >= steps.length) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: { status: "completed", nextAttemptAt: null },
        });
        skipped++;
        continue;
      }

      const stepDef = steps[idx];
      const accountId = seq.contact.accountId;
      const channelNorm = stepDef.channel.trim().toLowerCase();

      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { name: true },
      });
      const accountName = account?.name ?? "Cuenta";

      const attemptId = await prisma.$transaction(async (tx) => {
        const created = await tx.followUpAttempt.create({
          data: {
            sequenceId: seq.id,
            step: idx,
            channel: stepDef.channel,
            objective: stepDef.objective ?? null,
            outcome: "queued",
            metadata: {
              source: "cron_v1",
              note:
                stepDef.channel === "whatsapp"
                  ? "pendiente envío"
                  : "MVP: sin envío real aún (canal no whatsapp)",
            },
          },
        });

        const newAttempts = seq.attempts + 1;
        const nextStepIndex = idx + 1;

        const hitMaxAttempts = newAttempts >= plan.maxAttempts;
        const noMoreSteps = nextStepIndex >= steps.length;

        if (hitMaxAttempts || noMoreSteps) {
          await tx.followUpSequence.update({
            where: { id: seq.id },
            data: {
              currentStep: nextStepIndex,
              attempts: newAttempts,
              status: "completed",
              nextAttemptAt: null,
            },
          });
        } else {
          const delayBeforeNext = steps[nextStepIndex].delayHours;
          const nextAt = new Date(now.getTime() + delayBeforeNext * HOUR_MS);
          await tx.followUpSequence.update({
            where: { id: seq.id },
            data: {
              currentStep: nextStepIndex,
              attempts: newAttempts,
              nextAttemptAt: nextAt,
            },
          });
        }

        return created.id;
      });

      if (channelNorm === "whatsapp") {
        const send = await sendWhatsAppTextToContact({
          contactId: seq.contact.id,
          accountId,
          text: followUpWhatsAppBody(stepDef),
          actorUserId: null,
        });
        await prisma.followUpAttempt.update({
          where: { id: attemptId },
          data: {
            outcome: send.ok ? "sent" : "failed",
            metadata: (
              send.ok
                ? {
                    source: "cron_v2",
                    channel: "whatsapp",
                    messageId: send.messageId,
                    waMessageId: send.waMessageId,
                  }
                : {
                    source: "cron_v2",
                    channel: "whatsapp",
                    error: send.error,
                  }
            ) as Prisma.InputJsonValue,
          },
        });
      } else if (channelNorm === "email") {
        const send = await sendFollowUpEmailToContact({
          contactId: seq.contact.id,
          accountId,
          accountName,
          objective: stepDef.objective,
        });
        if (send.ok) {
          await prisma.followUpAttempt.update({
            where: { id: attemptId },
            data: {
              outcome: "sent",
              metadata: {
                source: "cron_v2",
                channel: "email",
                provider: "resend",
                emailId: send.providerId,
              } as Prisma.InputJsonValue,
            },
          });
        } else if (send.reason === "not_configured" || send.reason === "no_email") {
          const taskId = await createManualFollowUpTask({
            contactId: seq.contact.id,
            channel: "email",
            objective: stepDef.objective,
            sequenceId: seq.id,
            step: idx,
          });
          await prisma.followUpAttempt.update({
            where: { id: attemptId },
            data: {
              outcome: "manual",
              metadata: {
                source: "cron_v2",
                channel: "email",
                reason: send.reason,
                error: send.error,
                taskId,
                note:
                  send.reason === "not_configured"
                    ? "Configurá RESEND_API_KEY y FOLLOW_UP_FROM_EMAIL para envío automático."
                    : "El contacto no tiene email; completar dato o enviar por otro canal.",
              } as Prisma.InputJsonValue,
            },
          });
        } else {
          await prisma.followUpAttempt.update({
            where: { id: attemptId },
            data: {
              outcome: send.reason === "blocked" ? "skipped" : "failed",
              metadata: {
                source: "cron_v2",
                channel: "email",
                reason: send.reason,
                error: send.error,
              } as Prisma.InputJsonValue,
            },
          });
        }
      } else {
        const taskId = await createManualFollowUpTask({
          contactId: seq.contact.id,
          channel: stepDef.channel,
          objective: stepDef.objective,
          sequenceId: seq.id,
          step: idx,
        });
        await prisma.followUpAttempt.update({
          where: { id: attemptId },
          data: {
            outcome: "manual",
            metadata: {
              source: "cron_v2",
              channel: stepDef.channel,
              taskId,
              note:
                channelNorm === "instagram" || channelNorm === "ig"
                  ? "DM Instagram sin API en MVP: usar tarea y Meta Business."
                  : "Canal sin automatización en MVP: completar desde CRM.",
            } as Prisma.InputJsonValue,
          },
        });
      }

      attemptsCreated++;

      try {
        await recordAuditEvent({
          accountId,
          entityType: "follow_up_sequence",
          entityId: seq.id,
          action: "follow_up_step_executed",
          actorType: "system",
          metadata: {
            contactId: seq.contact.id,
            step: idx,
            channel: stepDef.channel,
            planId: plan.id,
          },
        });
      } catch (e) {
        console.error("[audit] follow_up_step_executed failed", e);
      }
    } catch (e) {
      console.error(`[follow-up] sequence ${seq.id} failed`, e);
      skipped++;
    }
  }

  logStructured("follow_up_due_batch_done", {
    sequencesExamined,
    attemptsCreated,
    skipped,
  });

  return {
    sequencesExamined,
    attemptsCreated,
    skipped,
  };
}
