"use server";

import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { revalidatePath } from "next/cache";
import { KITEPROP_REVIEW_STATUS } from "@/domains/integrations/kiteprop-rest/kiteprop-review-status";
import { sendApprovedValidationDraftOutbound } from "@/domains/integrations/kiteprop-rest/send-validation-draft-outbound";

const ROLES = new Set(["admin", "coordinator"]);

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireOpsSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) return null;
  if (!session.user.role || !ROLES.has(session.user.role)) return null;
  return session;
}

async function getReviewInTenant(reviewId: string, accountId: string) {
  return prisma.leadReplyDraftReview.findFirst({
    where: { id: reviewId, accountId },
  });
}

export async function approveValidationDraftAction(reviewId: string): Promise<ActionResult> {
  const session = await requireOpsSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const row = await getReviewInTenant(reviewId, session.user.accountId);
  if (!row) return { ok: false, error: "No encontrado." };
  if (
    row.reviewStatus !== KITEPROP_REVIEW_STATUS.DRAFT_PENDING_REVIEW &&
    row.reviewStatus !== KITEPROP_REVIEW_STATUS.MANUAL_REVIEW_REQUIRED
  ) {
    return { ok: false, error: "Estado no permite aprobar." };
  }

  await prisma.leadReplyDraftReview.update({
    where: { id: reviewId },
    data: {
      reviewStatus: KITEPROP_REVIEW_STATUS.APPROVED_TO_SEND,
      approvedAt: new Date(),
      approvedByUserId: session.user.id,
      discardedAt: null,
      discardedReason: null,
    },
  });
  revalidatePath("/dashboard/validation-inbox");
  return { ok: true };
}

export async function discardValidationDraftAction(
  reviewId: string,
  reason: string,
): Promise<ActionResult> {
  const session = await requireOpsSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const row = await getReviewInTenant(reviewId, session.user.accountId);
  if (!row) return { ok: false, error: "No encontrado." };
  if (row.reviewStatus === KITEPROP_REVIEW_STATUS.SENT) {
    return { ok: false, error: "Ya enviado; no se descarta." };
  }

  await prisma.leadReplyDraftReview.update({
    where: { id: reviewId },
    data: {
      reviewStatus: KITEPROP_REVIEW_STATUS.DISCARDED,
      discardedAt: new Date(),
      discardedReason: reason.trim().slice(0, 2000) || null,
    },
  });
  revalidatePath("/dashboard/validation-inbox");
  return { ok: true };
}

export async function markManualReviewValidationAction(reviewId: string): Promise<ActionResult> {
  const session = await requireOpsSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const row = await getReviewInTenant(reviewId, session.user.accountId);
  if (!row) return { ok: false, error: "No encontrado." };

  await prisma.leadReplyDraftReview.update({
    where: { id: reviewId },
    data: {
      reviewStatus: KITEPROP_REVIEW_STATUS.MANUAL_REVIEW_REQUIRED,
      manualReviewRequired: true,
    },
  });
  revalidatePath("/dashboard/validation-inbox");
  return { ok: true };
}

export async function saveEditedDraftPayloadAction(
  reviewId: string,
  editedPayload: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await requireOpsSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const row = await getReviewInTenant(reviewId, session.user.accountId);
  if (!row) return { ok: false, error: "No encontrado." };
  if (row.reviewStatus === KITEPROP_REVIEW_STATUS.SENT) {
    return { ok: false, error: "Ya enviado." };
  }

  await prisma.leadReplyDraftReview.update({
    where: { id: reviewId },
    data: { editedPayload: editedPayload as object },
  });
  revalidatePath("/dashboard/validation-inbox");
  return { ok: true };
}

export async function sendApprovedDraftAction(reviewId: string): Promise<ActionResult> {
  const session = await requireOpsSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const result = await sendApprovedValidationDraftOutbound({
    reviewId,
    accountId: session.user.accountId,
    actorUserId: session.user.id,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/dashboard/validation-inbox");
  return { ok: true };
}
