/**
 * Envío de texto por WhatsApp Cloud API (Meta).
 */
import { prisma, Prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { kitepropImportReviewModeEnabled } from "@/domains/integrations/kiteprop-rest/kiteprop-import-env";
import { getWhatsAppSendBlockReason } from "./whatsapp-consent";
import { normalizeWhatsAppPhone } from "./ingest-inbound";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";

function toGraphRecipient(phone: string): string {
  return phone.replace(/\D/g, "");
}

type GraphSendResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string; code?: number };
};

export type SendWhatsAppTextResult =
  | { ok: true; messageId: string; waMessageId: string }
  | { ok: false; error: string; messageId?: string };

export async function sendWhatsAppTextToContact(params: {
  contactId: string;
  accountId: string;
  text: string;
  actorUserId?: string | null;
  /**
   * Solo para despacho manual desde revisión de borradores (un lead aprobado).
   * No usar en seguimientos automáticos.
   */
  ignoreReviewModeBlock?: boolean;
}): Promise<SendWhatsAppTextResult> {
  if (!params.ignoreReviewModeBlock && kitepropImportReviewModeEnabled()) {
    return {
      ok: false,
      error:
        "KITEPROP_IMPORT_REVIEW_MODE=true: envío WhatsApp desactivado (fase validación import KiteProp).",
    };
  }

  const text = params.text.trim();
  if (!text) {
    return { ok: false, error: "El mensaje está vacío." };
  }
  if (text.length > 4096) {
    return { ok: false, error: "El mensaje supera 4096 caracteres." };
  }

  const block = await getWhatsAppSendBlockReason(params.contactId);
  if (block) {
    return { ok: false, error: block };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!phoneNumberId || !accessToken) {
    return {
      ok: false,
      error: "Falta WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN en el entorno.",
    };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: params.contactId, accountId: params.accountId },
  });
  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }
  if (!contact.phone?.trim()) {
    return { ok: false, error: "El contacto no tiene teléfono." };
  }

  const to = toGraphRecipient(normalizeWhatsAppPhone(contact.phone));
  if (to.length < 8) {
    return { ok: false, error: "Teléfono no válido para WhatsApp." };
  }

  let conv = await prisma.conversation.findFirst({
    where: {
      accountId: params.accountId,
      contactId: contact.id,
      channel: "whatsapp",
      status: "active",
    },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        accountId: params.accountId,
        contactId: contact.id,
        channel: "whatsapp",
        channelId: to,
        status: "active",
      },
    });
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  let graphJson: GraphSendResponse;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });
    graphJson = (await res.json()) as GraphSendResponse;
    if (!res.ok) {
      const errMsg = graphJson.error?.message ?? res.statusText;
      const failed = await prisma.message.create({
        data: {
          conversationId: conv.id,
          direction: "outbound",
          content: text,
          channel: "whatsapp",
          status: "failed",
          metadata: {
            source: "whatsapp_cloud_api",
            graphError: graphJson.error ?? { status: res.status },
          } as Prisma.InputJsonValue,
        },
      });
      try {
        await recordAuditEvent({
          accountId: params.accountId,
          entityType: "message",
          entityId: failed.id,
          action: "whatsapp_outbound_failed",
          actorType: "user",
          actorId: params.actorUserId ?? undefined,
          metadata: { contactId: contact.id, error: errMsg },
        });
      } catch (e) {
        console.error("[audit] whatsapp_outbound_failed", e);
      }
      return { ok: false, error: `Graph API: ${errMsg}`, messageId: failed.id };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red";
    return { ok: false, error: msg };
  }

  const waMessageId = graphJson.messages?.[0]?.id ?? "";
  if (!waMessageId) {
    return { ok: false, error: "Respuesta de Graph sin id de mensaje." };
  }

  const created = await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "outbound",
      content: text,
      channel: "whatsapp",
      status: "sent",
      metadata: {
        waMessageId,
        source: "whatsapp_cloud_api",
      } as Prisma.InputJsonValue,
    },
  });

  try {
    await recordAuditEvent({
      accountId: params.accountId,
      entityType: "message",
      entityId: created.id,
      action: "whatsapp_outbound_sent",
      actorType: "user",
      actorId: params.actorUserId ?? undefined,
      metadata: {
        contactId: contact.id,
        waMessageId,
        conversationId: conv.id,
      },
    });
  } catch (e) {
    console.error("[audit] whatsapp_outbound_sent failed", e);
  }

  return { ok: true, messageId: created.id, waMessageId };
}
