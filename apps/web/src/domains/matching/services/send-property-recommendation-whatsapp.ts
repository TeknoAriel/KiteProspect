/**
 * Envía por WhatsApp el texto de una PropertyMatch existente y registra Recommendation + sentAt.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { sendWhatsAppTextToContact } from "@/domains/integrations/whatsapp/send-whatsapp-text";

export type SendPropertyRecommendationWhatsAppResult =
  | { ok: true; recommendationId: string; messageId: string }
  | { ok: false; error: string };

function formatPrice(value: { toString(): string }): string {
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return value.toString();
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function buildRecommendationBody(params: {
  propertyTitle: string;
  zone: string;
  priceFormatted: string;
  reason: string | null;
  accountName: string | null;
}): string {
  const lines = [
    "Te compartimos una opción alineada a tu búsqueda:",
    "",
    `*${params.propertyTitle}*`,
    `Zona: ${params.zone}`,
    `Precio: $${params.priceFormatted}`,
  ];
  if (params.reason?.trim()) {
    lines.push("");
    lines.push(params.reason.trim());
  }
  if (params.accountName?.trim()) {
    lines.push("");
    lines.push(`— ${params.accountName.trim()}`);
  }
  return lines.join("\n");
}

export async function sendPropertyRecommendationWhatsApp(params: {
  accountId: string;
  contactId: string;
  propertyMatchId: string;
  actorUserId: string | null;
}): Promise<SendPropertyRecommendationWhatsAppResult> {
  const match = await prisma.propertyMatch.findFirst({
    where: {
      id: params.propertyMatchId,
      contactId: params.contactId,
      contact: { accountId: params.accountId },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          zone: true,
          price: true,
          status: true,
        },
      },
    },
  });

  if (!match) {
    return { ok: false, error: "Match no encontrado o no pertenece a este contacto." };
  }

  if (match.property.status !== "available") {
    return { ok: false, error: "La propiedad no está disponible; no se envía la recomendación." };
  }

  const account = await prisma.account.findFirst({
    where: { id: params.accountId },
    select: { name: true },
  });

  const text = buildRecommendationBody({
    propertyTitle: match.property.title,
    zone: match.property.zone ?? "—",
    priceFormatted: formatPrice(match.property.price),
    reason: match.reason,
    accountName: account?.name ?? null,
  });

  const send = await sendWhatsAppTextToContact({
    contactId: params.contactId,
    accountId: params.accountId,
    text,
    actorUserId: params.actorUserId,
  });

  if (!send.ok) {
    return { ok: false, error: send.error };
  }

  const now = new Date();

  const [recommendation] = await prisma.$transaction([
    prisma.recommendation.create({
      data: {
        contactId: params.contactId,
        propertyId: match.propertyId,
        channel: "whatsapp",
        status: "sent",
        sentAt: now,
      },
    }),
    prisma.propertyMatch.update({
      where: { id: match.id },
      data: { sentAt: now },
    }),
  ]);

  try {
    await recordAuditEvent({
      accountId: params.accountId,
      entityType: "recommendation",
      entityId: recommendation.id,
      action: "property_recommendation_sent_whatsapp",
      actorType: "user",
      actorId: params.actorUserId ?? undefined,
      metadata: {
        contactId: params.contactId,
        propertyId: match.propertyId,
        propertyMatchId: match.id,
        messageId: send.messageId,
      },
    });
  } catch (e) {
    console.error("[audit] property_recommendation_sent_whatsapp", e);
  }

  return { ok: true, recommendationId: recommendation.id, messageId: send.messageId };
}
