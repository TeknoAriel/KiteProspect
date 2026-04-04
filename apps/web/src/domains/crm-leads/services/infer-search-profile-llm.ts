/**
 * Refinamiento opcional del perfil inferido con salida JSON (F2-E1 capa LLM).
 * Requiere `SEARCH_PROFILE_INFER_LLM=true` y proveedor de IA configurado.
 */
import { callAIProviderJson } from "@/domains/ai-orchestration/provider-chat-json";
import type { InferredProfileFields } from "../inference/infer-search-profile-heuristics";

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (v !== null && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}

function pickStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, 300);
}

function pickNum(o: Record<string, unknown>, k: string): number | null {
  const v = o[k];
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickInt(o: Record<string, unknown>, k: string): number | null {
  const n = pickNum(o, k);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * Completa campos vacíos del borrador heurístico usando el modelo.
 */
export async function tryRefineSearchProfileWithLLM(
  joinedInboundText: string,
  heuristic: InferredProfileFields,
): Promise<{ fields: Partial<InferredProfileFields>; confidenceBoost: number } | null> {
  if (process.env.SEARCH_PROFILE_INFER_LLM?.trim() !== "true") {
    return null;
  }
  const trimmed = joinedInboundText.trim();
  if (trimmed.length < 20) return null;

  const system = [
    "Sos un extractor inmobiliario para Argentina/LATAM.",
    "Respondé SOLO un JSON con claves: intent, propertyType, zone, minPrice, maxPrice, bedrooms, bathrooms.",
    "Valores null si no hay evidencia. intent: compra | renta | inversión. propertyType: departamento | casa | terreno.",
    "Precios en ARS como números enteros si el usuario dio montos.",
    "No inventes zona ni precios sin señal en el texto.",
  ].join(" ");

  const user = [
    "Borrador heurístico (puede tener nulls):",
    JSON.stringify(heuristic),
    "",
    "Texto del lead (mensajes entrantes):",
    trimmed.slice(0, 12_000),
  ].join("\n");

  const res = await callAIProviderJson({
    system,
    user,
    maxTokens: 500,
    temperature: 0.2,
  });
  if (!res.ok) return null;

  const o = parseJsonObject(res.content);
  if (!o) return null;

  const partial: Partial<InferredProfileFields> = {};
  const intent = pickStr(o, "intent");
  const propertyType = pickStr(o, "propertyType");
  const zone = pickStr(o, "zone");
  if (intent) partial.intent = intent;
  if (propertyType) partial.propertyType = propertyType;
  if (zone) partial.zone = zone;
  const minPrice = pickInt(o, "minPrice");
  const maxPrice = pickInt(o, "maxPrice");
  const bedrooms = pickInt(o, "bedrooms");
  const bathrooms = pickInt(o, "bathrooms");
  if (minPrice !== null) partial.minPrice = minPrice;
  if (maxPrice !== null) partial.maxPrice = maxPrice;
  if (bedrooms !== null) partial.bedrooms = bedrooms;
  if (bathrooms !== null) partial.bathrooms = bathrooms;

  if (Object.keys(partial).length === 0) return null;

  return { fields: partial, confidenceBoost: 0.08 };
}
