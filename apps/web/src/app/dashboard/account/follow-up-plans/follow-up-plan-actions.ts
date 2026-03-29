"use server";

import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@kite-prospect/db";
import { parsePlanSequence } from "@/domains/followups/services/process-due-follow-ups";
import { recordAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const INTENSITIES = new Set(["low", "medium", "high"]);
const STATUSES = new Set(["active", "paused", "archived"]);

export type UpdateFollowUpPlanResult = { ok: true } | { ok: false; error: string };

export async function updateFollowUpPlanAction(
  planId: string,
  formData: FormData,
): Promise<UpdateFollowUpPlanResult> {
  const session = await auth();
  if (!session?.user?.accountId || session.user.role !== "admin") {
    return { ok: false, error: "No autorizado." };
  }

  const accountId = session.user.accountId;

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw ? descriptionRaw : null;
  const intensity = String(formData.get("intensity") ?? "medium");
  const maxAttemptsRaw = Number.parseInt(String(formData.get("maxAttempts") ?? "10"), 10);
  const maxAttempts = Number.isFinite(maxAttemptsRaw)
    ? Math.min(500, Math.max(1, maxAttemptsRaw))
    : 10;
  const status = String(formData.get("status") ?? "active");
  const sequenceRaw = String(formData.get("sequence") ?? "").trim();

  if (!name) {
    return { ok: false, error: "El nombre es obligatorio." };
  }
  if (!INTENSITIES.has(intensity)) {
    return { ok: false, error: "Intensidad inválida." };
  }
  if (!STATUSES.has(status)) {
    return { ok: false, error: "Estado inválido." };
  }

  let sequenceJson: unknown;
  try {
    sequenceJson = JSON.parse(sequenceRaw || "[]");
  } catch {
    return { ok: false, error: "La secuencia no es JSON válido." };
  }

  const steps = parsePlanSequence(sequenceJson);
  if (steps.length === 0) {
    return {
      ok: false,
      error:
        "La secuencia debe ser un array con al menos un paso (step, delayHours, channel, objective opcional).",
    };
  }

  const existing = await prisma.followUpPlan.findFirst({
    where: { id: planId, accountId },
  });
  if (!existing) {
    return { ok: false, error: "Plan no encontrado." };
  }

  await prisma.followUpPlan.update({
    where: { id: planId },
    data: {
      name,
      description,
      intensity,
      maxAttempts,
      status,
      sequence: sequenceJson as Prisma.InputJsonValue,
    },
  });

  try {
    await recordAuditEvent({
      accountId,
      entityType: "follow_up_plan",
      entityId: planId,
      action: "follow_up_plan_updated",
      actorType: "user",
      actorId: session.user.id ?? undefined,
      metadata: { name, status, stepsCount: steps.length },
    });
  } catch (e) {
    console.error("[audit] follow_up_plan_updated", e);
  }

  revalidatePath("/dashboard/account/follow-up-plans");
  revalidatePath(`/dashboard/account/follow-up-plans/${planId}`);
  revalidatePath("/dashboard/followups");
  return { ok: true };
}
