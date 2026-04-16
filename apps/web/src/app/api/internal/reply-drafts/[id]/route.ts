import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * PATCH — editar borrador o cambiar estado (aprobar / descartar).
 * Body: `{ "editedPayload": {...}, "reviewStatus": "approved_to_send" | "discarded", "discardedReason": "..." }`
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { id } = await context.params;
  let body: {
    editedPayload?: unknown;
    reviewStatus?: string;
    discardedReason?: string;
    approvedByUserId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const row = await prisma.leadReplyDraftReview.findFirst({
    where: { id },
  });
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const data: {
    editedPayload?: object;
    reviewStatus?: string;
    discardedAt?: Date | null;
    discardedReason?: string | null;
    approvedAt?: Date | null;
    approvedByUserId?: string | null;
    manualReviewRequired?: boolean;
  } = {};

  if (body.editedPayload !== undefined) {
    data.editedPayload = body.editedPayload as object;
  }

  if (body.reviewStatus === "approved_to_send") {
    data.reviewStatus = "approved_to_send";
    data.approvedAt = new Date();
    data.approvedByUserId = body.approvedByUserId?.trim() || "internal_api";
    data.discardedAt = null;
    data.discardedReason = null;
  } else if (body.reviewStatus === "discarded") {
    data.reviewStatus = "discarded";
    data.discardedAt = new Date();
    data.discardedReason = body.discardedReason?.trim() ?? null;
  } else if (body.reviewStatus === "manual_review_required") {
    data.reviewStatus = "manual_review_required";
    data.manualReviewRequired = true;
  } else if (typeof body.reviewStatus === "string") {
    data.reviewStatus = body.reviewStatus;
  }

  const updated = await prisma.leadReplyDraftReview.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, item: updated });
}
