/**
 * Persistencia de mensajes WhatsApp entrantes (multi-tenant por accountId).
 */
import { prisma, Prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import type { ParsedInboundMessage, ParsedStatus } from "./parse-cloud-api";

const OPT_OUT = new Set(["STOP", "BAJA", "UNSUBSCRIBE", "CANCELAR", "DAR DE BAJA", "QUIT"]);

export function normalizeWhatsAppPhone(from: string): string {
  const d = from.replace(/\D/g, "");
  if (d.length < 8) return from.trim();
  return `+${d}`;
}

function isOptOutText(text: string | null): boolean {
  if (!text) return false;
  const t = text.trim().toUpperCase();
  if (OPT_OUT.has(t)) return true;
  const first = t.split(/\s+/)[0] ?? "";
  return OPT_OUT.has(first);
}

async function findMessageByWaId(waMessageId: string): Promise<{ id: string; conversationId: string } | null> {
  const rows = await prisma.$queryRaw<{ id: string; conversationId: string }[]>(
    Prisma.sql`
      SELECT id, "conversationId" FROM "Message"
      WHERE metadata->>'waMessageId' = ${waMessageId}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}

async function ensureConsentOptOut(contactId: string): Promise<void> {
  const prev = await prisma.consent.findFirst({
    where: { contactId, channel: "whatsapp" },
    orderBy: { updatedAt: "desc" },
  });
  if (prev) {
    await prisma.consent.update({
      where: { id: prev.id },
      data: { granted: false, revokedAt: new Date() },
    });
  } else {
    await prisma.consent.create({
      data: {
        contactId,
        channel: "whatsapp",
        granted: false,
        revokedAt: new Date(),
        purpose: "marketing",
      },
    });
  }
}

export async function ingestInboundWhatsAppMessage(
  accountId: string,
  msg: ParsedInboundMessage,
): Promise<{ skipped: boolean; contactId?: string; conversationId?: string; messageId?: string }> {
  const existing = await findMessageByWaId(msg.waMessageId);
  if (existing) {
    return { skipped: true };
  }

  const phone = normalizeWhatsAppPhone(msg.from);

  let contact = await prisma.contact.findFirst({
    where: { accountId, phone },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        accountId,
        phone,
        conversationalStage: "new",
        commercialStage: "exploratory",
      },
    });
  }

  if (isOptOutText(msg.text)) {
    await ensureConsentOptOut(contact.id);
  }

  let conv = await prisma.conversation.findFirst({
    where: {
      accountId,
      contactId: contact.id,
      channel: "whatsapp",
      status: "active",
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        accountId,
        contactId: contact.id,
        channel: "whatsapp",
        channelId: msg.from,
        status: "active",
      },
    });
  }

  const content =
    msg.text ??
    ((msg.type !== "text" ? `[${msg.type}]` : "") || "[mensaje sin texto]");

  const created = await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "inbound",
      content: content || "[vacío]",
      channel: "whatsapp",
      metadata: {
        waMessageId: msg.waMessageId,
        waType: msg.type,
        source: "whatsapp_cloud_api",
        timestamp: msg.timestamp,
      } as Prisma.InputJsonValue,
    },
  });

  if (contact.conversationalStage === "new") {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { conversationalStage: "answered" },
    });
  }

  try {
    await recordAuditEvent({
      accountId,
      entityType: "message",
      entityId: created.id,
      action: "whatsapp_inbound_received",
      actorType: "integration",
      metadata: {
        contactId: contact.id,
        conversationId: conv.id,
        waMessageId: msg.waMessageId,
      },
    });
  } catch (e) {
    console.error("[audit] whatsapp_inbound_received failed", e);
  }

  return {
    skipped: false,
    contactId: contact.id,
    conversationId: conv.id,
    messageId: created.id,
  };
}

export async function applyWhatsAppStatusUpdate(st: ParsedStatus): Promise<boolean> {
  const row = await findMessageByWaId(st.waMessageId);
  if (!row) return false;

  const map: Record<string, string> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };
  const status = map[st.status] ?? st.status;

  const current = await prisma.message.findUnique({
    where: { id: row.id },
    select: { metadata: true },
  });
  const meta = (current?.metadata as Record<string, unknown> | null) ?? {};

  await prisma.message.update({
    where: { id: row.id },
    data: {
      status,
      metadata: {
        ...meta,
        lastWaStatus: st.status,
        lastWaStatusAt: st.timestamp,
      } as Prisma.InputJsonValue,
    },
  });
  return true;
}
