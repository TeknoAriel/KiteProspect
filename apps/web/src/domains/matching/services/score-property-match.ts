/**
 * Matching v0 — reglas solo sobre inventario real (Property + SearchProfile).
 * Sin IA; puntajes 0–100 por dimensiones. Pesos configurables por cuenta (F2-E2).
 * Ver `docs/decisions/slice-s04-matching-v0.md`, `slice-l5-f2e2-matching-weights-feedback-exclusions.md`.
 */

import type { MatchingDimensionWeights } from "@/domains/auth-tenancy/account-matching-config";
import { DEFAULT_MATCHING_WEIGHTS } from "@/domains/auth-tenancy/account-matching-config";

export type ProfileInput = {
  intent: string | null;
  propertyType: string | null;
  zone: string | null;
  minPrice: unknown;
  maxPrice: unknown;
  bedrooms: number | null;
};

export type PropertyInput = {
  type: string;
  intent: string;
  zone: string | null;
  price: unknown;
  bedrooms: number | null;
  status: string;
};

export type ScorePropertyOptions = {
  weights?: MatchingDimensionWeights;
};

function norm(s: string | null | undefined): string {
  if (s == null || s === "") return "";
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Normaliza intención de perfil: minúsculas, sin acentos, ñ→n (ej. inversión → inversion). */
function normIntentToken(s: string | null | undefined): string {
  return norm(s).replace(/ñ/g, "n");
}

/** compra ↔ listado venta; renta ↔ renta; inversión acepta ambos con leve penalización */
export function scoreIntentDimension(
  profileIntent: string | null | undefined,
  propertyIntent: string,
  maxPoints: number,
): number {
  const pi = normIntentToken(profileIntent);
  const pint = norm(propertyIntent);
  const half = Math.round(maxPoints * 0.5);
  if (!pi) return half;

  if (pi === "compra" && pint === "venta") return maxPoints;
  if (pi === "renta" && pint === "renta") return maxPoints;
  if (pi === "inversion" && (pint === "venta" || pint === "renta")) {
    return Math.round(maxPoints * 0.8);
  }
  return 0;
}

export function scoreTypeDimension(
  profileType: string | null | undefined,
  propertyType: string,
  maxPoints: number,
): number {
  const a = norm(profileType);
  const b = norm(propertyType);
  if (!a) return Math.round(maxPoints * 0.5);
  if (!b) return Math.round(maxPoints * 0.25);
  return a === b ? maxPoints : 0;
}

export function scoreZoneDimension(
  profileZone: string | null | undefined,
  propertyZone: string | null | undefined,
  maxPoints: number,
): number {
  const a = norm(profileZone);
  const b = norm(propertyZone);
  if (!a) return Math.round(maxPoints * 0.5);
  if (!b) return Math.round(maxPoints * 0.3);
  if (a === b) return maxPoints;
  if (b.includes(a) || a.includes(b)) return Math.round(maxPoints * 0.85);
  return 0;
}

function toNumber(n: unknown): number {
  if (n == null) return NaN;
  if (typeof n === "number") return n;
  if (typeof n === "object" && n !== null && "toNumber" in n && typeof (n as { toNumber: () => number }).toNumber === "function") {
    return (n as { toNumber: () => number }).toNumber();
  }
  return Number(n);
}

export function scorePriceDimension(
  minPrice: unknown,
  maxPrice: unknown,
  propertyPrice: unknown,
  maxPoints: number,
): number {
  const price = toNumber(propertyPrice);
  if (!Number.isFinite(price)) return 0;
  const min = minPrice != null ? toNumber(minPrice) : NaN;
  const max = maxPrice != null ? toNumber(maxPrice) : NaN;

  if (!Number.isFinite(max) && !Number.isFinite(min)) {
    return Math.round(maxPoints * 0.6);
  }

  if (Number.isFinite(max) && price > max) return 0;
  if (Number.isFinite(min) && price < min) return 0;
  return maxPoints;
}

export function scoreBedroomsDimension(
  profileBedrooms: number | null | undefined,
  propertyBedrooms: number | null | undefined,
  maxPoints: number,
): number {
  if (profileBedrooms == null) return Math.round(maxPoints * 0.5);
  if (propertyBedrooms == null) return Math.round(maxPoints * 0.4);
  if (propertyBedrooms >= profileBedrooms) return maxPoints;
  if (propertyBedrooms === profileBedrooms - 1) return Math.round(maxPoints * 0.5);
  return 0;
}

/**
 * Calcula score 0–100 y texto de motivo (auditable, sin inventar datos).
 */
export function scorePropertyAgainstProfile(
  profile: ProfileInput,
  property: PropertyInput,
  options?: ScorePropertyOptions,
): { score: number; reason: string } {
  if (property.status !== "available") {
    return { score: 0, reason: "La propiedad no está disponible (no se usa en matching v0)." };
  }

  const w = options?.weights ?? DEFAULT_MATCHING_WEIGHTS;

  const intentPts = scoreIntentDimension(profile.intent, property.intent, w.intent);
  const typePts = scoreTypeDimension(profile.propertyType, property.type, w.type);
  const zonePts = scoreZoneDimension(profile.zone, property.zone, w.zone);
  const pricePts = scorePriceDimension(profile.minPrice, profile.maxPrice, property.price, w.price);
  const bedPts = scoreBedroomsDimension(profile.bedrooms, property.bedrooms, w.bedrooms);

  const raw = intentPts + typePts + zonePts + pricePts + bedPts;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  const bits: string[] = [];
  const thr = (dim: number) => Math.max(8, Math.round(dim * 0.75));
  if (intentPts >= thr(w.intent)) bits.push("intención");
  if (typePts >= thr(w.type)) bits.push("tipo");
  if (zonePts >= thr(w.zone)) bits.push("zona");
  if (pricePts >= thr(w.price)) bits.push("precio");
  if (bedPts >= thr(w.bedrooms)) bits.push("dormitorios");

  const reason =
    bits.length > 0
      ? `Coincidencia por: ${bits.join(", ")} (reglas, inventario real).`
      : "Coincidencia parcial con criterios del perfil (reglas).";

  return { score, reason: reason.slice(0, 500) };
}

/**
 * Casos de referencia (documentación; Vitest).
 */
export const MATCHING_SCORE_CASES: Array<{
  name: string;
  profile: ProfileInput;
  property: PropertyInput;
  minExpected: number;
  maxExpected: number;
}> = [
  {
    name: "alto — mismo tipo, zona y precio bajo máximo",
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Palermo",
      minPrice: null,
      maxPrice: 200000,
      bedrooms: 2,
    },
    property: {
      type: "departamento",
      intent: "venta",
      zone: "Palermo",
      price: 185000,
      bedrooms: 2,
      status: "available",
    },
    minExpected: 85,
    maxExpected: 100,
  },
  {
    name: "bajo — zona distinta",
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Belgrano",
      minPrice: null,
      maxPrice: 200000,
      bedrooms: 2,
    },
    property: {
      type: "departamento",
      intent: "venta",
      zone: "Palermo",
      price: 185000,
      bedrooms: 2,
      status: "available",
    },
    minExpected: 78,
    maxExpected: 82,
  },
];
