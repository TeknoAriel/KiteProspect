/**
 * Matching v0 — reglas solo sobre inventario real (Property + SearchProfile).
 * Sin IA; puntajes 0–100 por dimensiones fijas. Ver `docs/decisions/slice-s04-matching-v0.md`.
 */

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

const DIM = {
  intent: 20,
  type: 20,
  zone: 20,
  price: 20,
  bedrooms: 20,
} as const;

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
): number {
  const pi = normIntentToken(profileIntent);
  const pint = norm(propertyIntent);
  if (!pi) return 10;

  if (pi === "compra" && pint === "venta") return DIM.intent;
  if (pi === "renta" && pint === "renta") return DIM.intent;
  if (pi === "inversion" && (pint === "venta" || pint === "renta")) return 16;
  return 0;
}

export function scoreTypeDimension(
  profileType: string | null | undefined,
  propertyType: string,
): number {
  const a = norm(profileType);
  const b = norm(propertyType);
  if (!a) return 10;
  if (!b) return 5;
  return a === b ? DIM.type : 0;
}

export function scoreZoneDimension(
  profileZone: string | null | undefined,
  propertyZone: string | null | undefined,
): number {
  const a = norm(profileZone);
  const b = norm(propertyZone);
  if (!a) return 10;
  if (!b) return 6;
  if (a === b) return DIM.zone;
  if (b.includes(a) || a.includes(b)) return Math.round(DIM.zone * 0.85);
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
): number {
  const price = toNumber(propertyPrice);
  if (!Number.isFinite(price)) return 0;
  const min = minPrice != null ? toNumber(minPrice) : NaN;
  const max = maxPrice != null ? toNumber(maxPrice) : NaN;

  if (!Number.isFinite(max) && !Number.isFinite(min)) return 12;

  if (Number.isFinite(max) && price > max) return 0;
  if (Number.isFinite(min) && price < min) return 0;
  return DIM.price;
}

export function scoreBedroomsDimension(
  profileBedrooms: number | null | undefined,
  propertyBedrooms: number | null | undefined,
): number {
  if (profileBedrooms == null) return 10;
  if (propertyBedrooms == null) return 8;
  if (propertyBedrooms >= profileBedrooms) return DIM.bedrooms;
  if (propertyBedrooms === profileBedrooms - 1) return Math.round(DIM.bedrooms * 0.5);
  return 0;
}

/**
 * Calcula score 0–100 y texto de motivo (auditable, sin inventar datos).
 */
export function scorePropertyAgainstProfile(
  profile: ProfileInput,
  property: PropertyInput,
): { score: number; reason: string } {
  if (property.status !== "available") {
    return { score: 0, reason: "La propiedad no está disponible (no se usa en matching v0)." };
  }

  const intentPts = scoreIntentDimension(profile.intent, property.intent);
  const typePts = scoreTypeDimension(profile.propertyType, property.type);
  const zonePts = scoreZoneDimension(profile.zone, property.zone);
  const pricePts = scorePriceDimension(profile.minPrice, profile.maxPrice, property.price);
  const bedPts = scoreBedroomsDimension(profile.bedrooms, property.bedrooms);

  const raw = intentPts + typePts + zonePts + pricePts + bedPts;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  const bits: string[] = [];
  if (intentPts >= 15) bits.push("intención");
  if (typePts >= 15) bits.push("tipo");
  if (zonePts >= 15) bits.push("zona");
  if (pricePts >= 15) bits.push("precio");
  if (bedPts >= 15) bits.push("dormitorios");

  const reason =
    bits.length > 0
      ? `Coincidencia por: ${bits.join(", ")} (reglas v0, inventario real).`
      : "Coincidencia parcial con criterios del perfil (reglas v0).";

  return { score, reason: reason.slice(0, 500) };
}

/**
 * Casos de referencia (documentación; no ejecutados en CI sin Vitest).
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
