/**
 * Procesa secuencias de seguimiento con nextAttemptAt vencido (cron / worker futuro).
 */
import { prisma, Prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { sendFollowUpEmailToContact } from "@/domains/integrations/email/send-follow-up-email";
import { sendWhatsAppTextToContact } from "@/domains/integrations/whatsapp/send-whatsapp-text";
import type { ProcessDueFollowUpsInput, ProcessDueFollowUpsResult } from "../follow-up-job-contract";
import { evaluateFollowUpTriggers } from "./evaluate-follow-up-triggers";
import { getOfficialMatrixRow } from "@/domains/core-prospeccion/follow-up-official-matrix";
import { inferFollowUpMatrixBranch } from "@/domains/core-prospeccion/infer-follow-up-matrix-branch";
import { resolveMatrixBranchForCron } from "@/domains/core-prospeccion/resolve-matrix-branch-for-cron";
import { normalizePlanIntensity } from "@/domains/core-prospeccion/follow-up-intensity-normalize";
import { advancePastSkippableSteps } from "@/domains/core-prospeccion/follow-up-matrix-step-skip";

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

function searchProfilesHaveBasics(
  rows: Array<{ intent: string | null; zone: string | null; minPrice: unknown; maxPrice: unknown }>,
): boolean {
  for (const p of rows) {
    const hasIntent = Boolean(p.intent?.trim());
    const hasZone = Boolean(p.zone?.trim());
    const hasPrice = p.minPrice != null || p.maxPrice != null;
    if (hasIntent || hasZone || hasPrice) return true;
  }
  return false;
}

function followUpWhatsAppBody(step: SequenceStep, objectiveFallback?: string): string {
  const o = step.objective?.trim() || objectiveFallback?.trim();
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
      contact: {
        select: {
          id: true,
          accountId: true,
          email: true,
          name: true,
          phone: true,
          commercialStage: true,
          conversationalStage: true,
          declaredProfile: true,
        },
      },
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

      const latestLeadScore = await prisma.leadScore.findFirst({
        where: { contactId: seq.contact.id },
        orderBy: { createdAt: "desc" },
        select: { totalScore: true },
      });
      const triggerCheck = evaluateFollowUpTriggers(plan.triggers, {
        commercialStage: seq.contact.commercialStage,
        conversationalStage: seq.contact.conversationalStage,
        totalScore: latestLeadScore?.totalScore ?? null,
      });
      if (!triggerCheck.ok) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: {
            nextAttemptAt: new Date(now.getTime() + HOUR_MS),
          },
        });
        skipped++;
        continue;
      }

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

      const startIdx = seq.currentStep;
      if (startIdx < 0 || startIdx >= steps.length) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: { status: "completed", nextAttemptAt: null },
        });
        skipped++;
        continue;
      }

      const intensityKey = normalizePlanIntensity(plan.intensity);

      const noResponseHoursRaw = process.env.FOLLOW_UP_NO_RESPONSE_HOURS?.trim();
      const noResponseAfterOutboundHours = noResponseHoursRaw
        ? Math.max(1, Number.parseInt(noResponseHoursRaw, 10) || 48)
        : 48;

      const [topMatch, matchCount, profiles, lastMsg] = await Promise.all([
        prisma.propertyMatch.findFirst({
          where: { contactId: seq.contact.id },
          orderBy: { score: "desc" },
          select: { score: true },
        }),
        prisma.propertyMatch.count({ where: { contactId: seq.contact.id } }),
        prisma.searchProfile.findMany({
          where: { contactId: seq.contact.id },
          select: {
            intent: true,
            zone: true,
            propertyType: true,
            minPrice: true,
            maxPrice: true,
            bedrooms: true,
          },
          take: 12,
        }),
        prisma.message.findFirst({
          where: { conversation: { contactId: seq.contact.id } },
          orderBy: { createdAt: "desc" },
          select: { direction: true, createdAt: true },
        }),
      ]);

      const matrixSkipEnabled = process.env.FOLLOW_UP_MATRIX_SKIP_ENABLED !== "false";
      const { nextIndex, skipped: skippedMatrixSteps } = matrixSkipEnabled
        ? advancePastSkippableSteps(intensityKey, steps.length, startIdx, {
            conversationalStage: seq.contact.conversationalStage,
            searchProfiles: profiles,
            declaredProfile: seq.contact.declaredProfile,
          })
        : { nextIndex: startIdx, skipped: 0 };

      if (nextIndex >= steps.length) {
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: {
            status: "completed",
            nextAttemptAt: null,
            matrixCoreStageKey: getOfficialMatrixRow(intensityKey, steps.length - 1)?.coreStageKey ?? null,
          },
        });
        skipped++;
        continue;
      }

      if (skippedMatrixSteps > 0) {
        const pendingRow = getOfficialMatrixRow(intensityKey, nextIndex);
        await prisma.followUpSequence.update({
          where: { id: seq.id },
          data: {
            currentStep: nextIndex,
            matrixCoreStageKey: pendingRow?.coreStageKey ?? null,
          },
        });
        try {
          await recordAuditEvent({
            accountId: seq.contact.accountId,
            entityType: "follow_up_sequence",
            entityId: seq.id,
            action: "follow_up_matrix_steps_skipped",
            actorType: "system",
            metadata: {
              contactId: seq.contact.id,
              fromStep: startIdx,
              toStep: nextIndex,
              skippedCount: skippedMatrixSteps,
            },
          });
        } catch (e) {
          console.error("[audit] follow_up_matrix_steps_skipped failed", e);
        }
      }

      const idx = nextIndex;
      const stepDef = steps[idx];
      const matrixExecuted = getOfficialMatrixRow(intensityKey, idx);
      const effectiveObjective =
        stepDef.objective?.trim() || matrixExecuted?.objectiveEs || undefined;
      const accountId = seq.contact.accountId;
      const channelNorm = stepDef.channel.trim().toLowerCase();

      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { name: true },
      });
      const accountName = account?.name ?? "Cuenta";

      const lastDir =
        lastMsg?.direction === "outbound" || lastMsg?.direction === "inbound"
          ? lastMsg.direction
          : null;

      const inferredBranch = inferFollowUpMatrixBranch({
        commercialStage: seq.contact.commercialStage,
        conversationalStage: seq.contact.conversationalStage,
        topMatchScore: topMatch?.score ?? null,
        matchCount,
        hasProfileBasics: searchProfilesHaveBasics(profiles),
        lastMessageDirection: lastDir,
        lastMessageAtMs: lastMsg ? lastMsg.createdAt.getTime() : null,
        nowMs: now.getTime(),
        noResponseAfterOutboundHours,
      });
      const matrixBranchKey = resolveMatrixBranchForCron({
        sequenceLocked: seq.matrixBranchLocked,
        sequenceBranchKey: seq.matrixBranchKey,
        inferred: inferredBranch,
      });

      const attemptId = await prisma.$transaction(async (tx) => {
        const branchMeta =
          matrixBranchKey && seq.matrixBranchLocked
            ? { branchManual: matrixBranchKey, branchLocked: true }
            : matrixBranchKey
              ? { branchInferred: matrixBranchKey }
              : {};
        const created = await tx.followUpAttempt.create({
          data: {
            sequenceId: seq.id,
            step: idx,
            channel: stepDef.channel,
            objective: effectiveObjective ?? null,
            outcome: "queued",
            metadata: {
              source: "cron_v1",
              ...branchMeta,
              ...(matrixExecuted
                ? {
                    matrix: {
                      intensityKey,
                      stepIndex: idx,
                      coreStageKey: matrixExecuted.coreStageKey,
                      objectiveEs: matrixExecuted.objectiveEs,
                      dataToObtainEs: matrixExecuted.dataToObtainEs,
                      nextActionHintEs: matrixExecuted.nextActionHintEs,
                    },
                  }
                : {}),
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

        const nextPendingRow =
          !hitMaxAttempts && !noMoreSteps
            ? getOfficialMatrixRow(intensityKey, nextStepIndex)
            : null;
        const matrixCoreStageKeyForSeq =
          hitMaxAttempts || noMoreSteps
            ? matrixExecuted?.coreStageKey ?? null
            : nextPendingRow?.coreStageKey ?? matrixExecuted?.coreStageKey ?? null;

        if (hitMaxAttempts || noMoreSteps) {
          await tx.followUpSequence.update({
            where: { id: seq.id },
            data: {
              currentStep: nextStepIndex,
              attempts: newAttempts,
              status: "completed",
              nextAttemptAt: null,
              matrixCoreStageKey: matrixCoreStageKeyForSeq,
              matrixBranchKey,
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
              matrixCoreStageKey: matrixCoreStageKeyForSeq,
              matrixBranchKey,
            },
          });
        }

        return created.id;
      });

      if (channelNorm === "whatsapp") {
        const send = await sendWhatsAppTextToContact({
          contactId: seq.contact.id,
          accountId,
          text: followUpWhatsAppBody(stepDef, matrixExecuted?.objectiveEs),
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
          objective: effectiveObjective,
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
            objective: effectiveObjective,
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
          objective: effectiveObjective,
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
