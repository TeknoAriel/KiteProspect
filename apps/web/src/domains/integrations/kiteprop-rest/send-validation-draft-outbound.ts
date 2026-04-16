/**
 * Despacho manual uno por uno: solo con borrador en approved_to_send.
 * Omite el bloqueo global de KITEPROP_IMPORT_REVIEW_MODE en WhatsApp/email.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { sendTransactionalEmailToContact } from "@/domains/integrations/email/send-follow-up-email";
import { sendWhatsAppTextToContact } from "@/domains/integrations/whatsapp/send-whatsapp-text";
import type { DraftPayload } from "./generate-reply-drafts";
import { KITEPROP_REVIEW_STATUS } from "./kiteprop-review-status";

function mergePayload(row: {
  draftPayload: unknown;
  editedPayload: unknown;
}): DraftPayload {
  const base = (row.draftPayload ?? {}) as DraftPayload;
  const edit = row.editedPayload as DraftPayload | null | undefined;
  if (!edit) return base;
  return {
    ...base,
    ...edit,
    whatsapp: edit.whatsapp ?? base.whatsapp,
    email: edit.email ?? base.email,
  };
}

export async function sendApprovedValidationDraftOutbound(params: {
  reviewId: string;
  accountId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; channel: "whatsapp" | "email"; providerId: string }
  | { ok: false; error: string }
> {
  const row = await prisma.leadReplyDraftReview.findFirst({
    where: {
      id: params.reviewId,
      accountId: params.accountId,
    },
  });
  if (!row) {
    return { ok: false, error: "Borrador no encontrado." };
  }
  if (row.reviewStatus !== KITEPROP_REVIEW_STATUS.APPROVED_TO_SEND) {
    return {
      ok: false,
      error: "El borrador debe estar aprobado (approved_to_send) antes de enviar.",
    };
  }

  const payload = mergePayload(row);
  const kind = row.draftKind;

  if (kind === "email") {
    const em = payload.email;
    if (!em?.subject?.trim() || !em.body?.trim()) {
      return { ok: false, error: "Falta asunto o cuerpo del email en el borrador." };
    }
    const bodyText = em.cta?.trim()
      ? `${em.body.trim()}\n\n${em.cta.trim()}`
      : em.body.trim();
    const send = await sendTransactionalEmailToContact({
      contactId: row.contactId,
      accountId: params.accountId,
      subject: em.subject.trim(),
      text: bodyText,
      ignoreReviewModeBlock: true,
    });
    if (!send.ok) {
      return {
        ok: false,
        error: send.error ?? send.reason,
      };
    }

    await prisma.leadReplyDraftReview.update({
      where: { id: row.id },
      data: {
        reviewStatus: KITEPROP_REVIEW_STATUS.SENT,
        sentAt: new Date(),
      },
    });

    await recordAuditEvent({
      accountId: params.accountId,
      entityType: "lead_reply_draft_review",
      entityId: row.id,
      action: "validation_outbound_sent",
      actorType: "user",
      actorId: params.actorUserId,
      metadata: {
        channel: "email",
        leadId: row.leadId,
        contactId: row.contactId,
        providerId: send.providerId,
      },
    });

    return { ok: true, channel: "email", providerId: send.providerId };
  }

  if (kind === "whatsapp") {
    const w = payload.whatsapp?.body?.trim();
    if (!w) {
      return { ok: false, error: "Falta texto WhatsApp en el borrador." };
    }
    const send = await sendWhatsAppTextToContact({
      contactId: row.contactId,
      accountId: params.accountId,
      text: w,
      actorUserId: params.actorUserId,
      ignoreReviewModeBlock: true,
    });
    if (!send.ok) {
      return { ok: false, error: send.error };
    }

    await prisma.leadReplyDraftReview.update({
      where: { id: row.id },
      data: {
        reviewStatus: KITEPROP_REVIEW_STATUS.SENT,
        sentAt: new Date(),
      },
    });

    await recordAuditEvent({
      accountId: params.accountId,
      entityType: "lead_reply_draft_review",
      entityId: row.id,
      action: "validation_outbound_sent",
      actorType: "user",
      actorId: params.actorUserId,
      metadata: {
        channel: "whatsapp",
        leadId: row.leadId,
        contactId: row.contactId,
        waMessageId: send.waMessageId,
        messageId: send.messageId,
      },
    });

    return { ok: true, channel: "whatsapp", providerId: send.waMessageId };
  }

  return {
    ok: false,
    error:
      "Canal no soportado para envío desde borrador (solo email o WhatsApp). Marcá revisión manual o editá el borrador.",
  };
}
