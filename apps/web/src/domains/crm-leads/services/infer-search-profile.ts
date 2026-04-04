/**
 * Persiste SearchProfile source=inferred desde mensajes entrantes (F2-E1).
 */
import { Prisma, prisma } from "@kite-prospect/db";
import type { InferredProfileFields } from "../inference/infer-search-profile-heuristics";
import { inferSearchProfileFromText } from "../inference/infer-search-profile-heuristics";
import { tryRefineSearchProfileWithLLM } from "./infer-search-profile-llm";
import { refreshConversationalStageForContact } from "./update-profile";

function hasAnyProfileField(f: InferredProfileFields): boolean {
  return !!(
    f.intent ||
    f.propertyType ||
    f.zone ||
    f.minPrice != null ||
    f.maxPrice != null ||
    f.bedrooms != null ||
    f.bathrooms != null
  );
}

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

  let { fields, confidence, signals } = inferSearchProfileFromText(joined);

  const llmRef = await tryRefineSearchProfileWithLLM(joined, fields);
  let inferenceMethod: string = "heuristic_v1";
  if (llmRef) {
    inferenceMethod = "heuristic_v1+llm";
    const merged = { ...fields };
    for (const [key, val] of Object.entries(llmRef.fields)) {
      const k = key as keyof InferredProfileFields;
      if (val === null || val === undefined) continue;
      if (merged[k] == null || merged[k] === "") {
        (merged as Record<string, unknown>)[k] = val;
      }
    }
    fields = merged;
    confidence = Math.min(1, confidence + llmRef.confidenceBoost);
    signals = [...signals, "llm_refine"];
  }

  if (signals.length === 0 && !hasAnyProfileField(fields)) {
    return {
      ok: false,
      error: "No hay señales suficientes en los mensajes entrantes para inferir (probá tras más intercambios).",
    };
  }

  const extraPayload: Prisma.InputJsonValue = {
    inferenceMethod,
    signals: signals.length > 0 ? signals : ["inferred_minimal"],
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
