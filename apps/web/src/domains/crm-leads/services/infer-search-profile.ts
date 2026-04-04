/**
 * Persiste SearchProfile source=inferred desde mensajes entrantes (F2-E1).
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { inferSearchProfileFromText } from "../inference/infer-search-profile-heuristics";
import { refreshConversationalStageForContact } from "./update-profile";

function toDecimal(n: number | null): Prisma.Decimal | null {
  if (n === null) return null;
  return new Prisma.Decimal(n);
}

export type InferSearchProfileResult =
  | { ok: true; confidence: number; signals: string[] }
  | { ok: false; error: string };

export async function inferAndUpsertSearchProfileFromMessages(
  contactId: string,
  accountId: string,
): Promise<InferSearchProfileResult> {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    include: {
      conversations: {
        include: {
          messages: {
            where: { direction: "inbound" },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  const texts = contact.conversations.flatMap((c) => c.messages.map((m) => m.content));
  const joined = texts.join("\n");

  const { fields, confidence, signals } = inferSearchProfileFromText(joined);

  if (signals.length === 0) {
    return {
      ok: false,
      error: "No hay señales suficientes en los mensajes entrantes para inferir (probá tras más intercambios).",
    };
  }

  const extraPayload: Prisma.InputJsonValue = {
    inferenceMethod: "heuristic_v1",
    signals,
  };

  const existing = await prisma.searchProfile.findFirst({
    where: { contactId, source: "inferred" },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    intent: fields.intent,
    propertyType: fields.propertyType,
    zone: fields.zone,
    minPrice: toDecimal(fields.minPrice),
    maxPrice: toDecimal(fields.maxPrice),
    bedrooms: fields.bedrooms,
    bathrooms: fields.bathrooms,
    extra: extraPayload,
    confidence,
  };

  if (existing) {
    await prisma.searchProfile.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.searchProfile.create({
      data: {
        contactId,
        source: "inferred",
        ...data,
      },
    });
  }

  await refreshConversationalStageForContact(contactId);

  return { ok: true, confidence, signals };
}
