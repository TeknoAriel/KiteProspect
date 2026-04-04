/**
 * Inferencia conservadora desde texto libre (mensajes inbound) — reglas, sin LLM (F2-E1 paso 1).
 * Español (AR/LATAM); evita inventar zona si no hay señal clara.
 */

export type InferredProfileFields = {
  intent: string | null;
  propertyType: string | null;
  zone: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
};

export type InferHeuristicResult = {
  fields: InferredProfileFields;
  /** 0–1 según cantidad y fuerza de señales. */
  confidence: number;
  /** Claves detectadas (debug / extra). */
  signals: string[];
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrae número en pesos: 150000, 150 mil, 1.5 millones (aprox). */
function parseMoneySegment(t: string): number | null {
  const n = norm(t);
  const mil = /(\d+(?:[.,]\d+)?)\s*mil\b/.exec(n);
  if (mil) {
    const v = parseFloat(mil[1]!.replace(",", "."));
    if (!Number.isFinite(v)) return null;
    return Math.round(v * 1000);
  }
  const mill = /(\d+(?:[.,]\d+)?)\s*mill/.exec(n);
  if (mill) {
    const v = parseFloat(mill[1]!.replace(",", "."));
    if (!Number.isFinite(v)) return null;
    return Math.round(v * 1_000_000);
  }
  const raw = /\$?\s*(\d{1,3}(?:\.\d{3})+|\d{5,})/.exec(n);
  if (raw) {
    const digits = raw[1]!.replace(/\./g, "");
    const v = parseInt(digits, 10);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

function extractIntent(n: string): string | null {
  if (/\b(alquiler|alquilar|rentar|arrendar)\b/.test(n)) return "renta";
  if (/\b(inversor|inversion)\b/.test(n)) return "inversión";
  if (/\b(comprar|compra|adquirir|busco (?:para )?comprar)\b/.test(n)) return "compra";
  if (/\b(departamento|depto|casa|ph|terreno)\b/.test(n) && /\b(venta|vendo|oportunidad)\b/.test(n))
    return "compra";
  return null;
}

function extractPropertyType(n: string): string | null {
  if (/\b(monoambiente|mono|depto|departamento|duplex|penthouse)\b/.test(n)) return "departamento";
  if (/\bcasa\b/.test(n)) return "casa";
  if (/\b(terreno|lote)\b/.test(n)) return "terreno";
  return null;
}

/** Zona: frases "en Palermo", "zona norte", "barrio Caballito" (palabra capitalizada opcional). */
function extractZone(raw: string, n: string): string | null {
  const m1 = /\b(?:en|barrio|zona)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\b/.exec(raw);
  if (m1) return m1[1]!.trim();
  const m2 = /\b(?:en|barrio|zona)\s+([a-záéíóúñ]{4,})\b/.exec(n);
  if (m2 && !/^(busco|venta|alquiler|departamento|casa|terreno)$/.test(m2[1]!)) {
    return m2[1]!.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

function extractBedrooms(n: string): number | null {
  const m = /(\d+)\s*(?:dorm|dormitorios?|habitaciones?|hab\.?|ambientes)\b/.exec(n);
  if (m) {
    const v = parseInt(m[1]!, 10);
    return Number.isFinite(v) && v > 0 && v < 20 ? v : null;
  }
  return null;
}

function extractBathrooms(n: string): number | null {
  const m = /(\d+)\s*ba(?:ñ|n)os?\b/.exec(n);
  if (m) {
    const v = parseInt(m[1]!, 10);
    return Number.isFinite(v) && v > 0 && v < 20 ? v : null;
  }
  return null;
}

function extractPriceRange(n: string): { min: number | null; max: number | null } {
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  const hasta = /\b(?:hasta|max(?:imo)?|menos de)\s+([^.,;]+?)(?:[.,;]|$)/i.exec(n);
  if (hasta) {
    const v = parseMoneySegment(hasta[1]!);
    if (v != null) maxPrice = v;
  }

  const desde = /\b(?:desde|min(?:imo)?|más de)\s+([^.,;]+?)(?:[.,;]|$)/i.exec(n);
  if (desde) {
    const v = parseMoneySegment(desde[1]!);
    if (v != null) minPrice = v;
  }

  const entre = /\bentre\s+([^y]+)\s+y\s+([^\s.,;]+)/i.exec(n);
  if (entre) {
    const a = parseMoneySegment(entre[1]!);
    const b = parseMoneySegment(entre[2]!);
    if (a != null) minPrice = a;
    if (b != null) maxPrice = b;
  }

  return { min: minPrice, max: maxPrice };
}

/**
 * Concatenación de mensajes entrantes (ya filtrados por el caller).
 */
export function inferSearchProfileFromText(rawText: string): InferHeuristicResult {
  const raw = rawText.slice(0, 20_000);
  const n = norm(raw);
  const signals: string[] = [];

  const intent = extractIntent(n);
  if (intent) signals.push("intent");

  const propertyType = extractPropertyType(n);
  if (propertyType) signals.push("propertyType");

  const zone = extractZone(raw, n);
  if (zone) signals.push("zone");

  const bedrooms = extractBedrooms(n);
  if (bedrooms != null) signals.push("bedrooms");

  const bathrooms = extractBathrooms(n);
  if (bathrooms != null) signals.push("bathrooms");

  const { min: minPrice, max: maxPrice } = extractPriceRange(n);
  if (minPrice != null) signals.push("minPrice");
  if (maxPrice != null) signals.push("maxPrice");

  const fields: InferredProfileFields = {
    intent,
    propertyType,
    zone,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
  };

  let confidence = 0;
  if (intent) confidence += 0.22;
  if (propertyType) confidence += 0.18;
  if (zone) confidence += 0.18;
  if (bedrooms != null) confidence += 0.12;
  if (bathrooms != null) confidence += 0.08;
  if (minPrice != null || maxPrice != null) confidence += 0.22;
  confidence = Math.min(0.95, confidence);
  if (signals.length > 0 && confidence < 0.28) confidence = 0.28;

  return { fields, confidence, signals };
}
