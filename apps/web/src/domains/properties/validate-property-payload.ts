/**
 * Validación de entrada para ABM Property (F1-E4).
 * Valores alineados a comentarios en schema Prisma y uso en matching.
 */

export const PROPERTY_TYPES = ["departamento", "casa", "terreno"] as const;
export const PROPERTY_INTENTS = ["venta", "renta"] as const;
export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyIntent = (typeof PROPERTY_INTENTS)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function parseOptionalInt(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    return undefined;
  }
  return v;
}

function parseOptionalDecimal(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return String(v);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return v.trim();
  }
  return undefined;
}

export type ParsePropertyCreateResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Campos requeridos para alta; opcionales con null explícito donde aplica.
 */
export function parsePropertyCreateBody(body: unknown): ParsePropertyCreateResult {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) return { ok: false, error: "title es obligatorio" };

  const type = typeof o.type === "string" ? o.type.trim() : "";
  if (!PROPERTY_TYPES.includes(type as PropertyType)) {
    return { ok: false, error: `type debe ser uno de: ${PROPERTY_TYPES.join(", ")}` };
  }

  const intent = typeof o.intent === "string" ? o.intent.trim() : "";
  if (!PROPERTY_INTENTS.includes(intent as PropertyIntent)) {
    return { ok: false, error: `intent debe ser uno de: ${PROPERTY_INTENTS.join(", ")}` };
  }

  const priceRaw = o.price;
  const price =
    typeof priceRaw === "number" && isFiniteNumber(priceRaw) && priceRaw >= 0
      ? String(priceRaw)
      : typeof priceRaw === "string" && priceRaw.trim() !== ""
        ? (() => {
            const n = Number(priceRaw);
            return Number.isFinite(n) && n >= 0 ? priceRaw.trim() : null;
          })()
        : null;
  if (price === null) return { ok: false, error: "price debe ser un número >= 0" };

  const description =
    o.description === undefined || o.description === null
      ? null
      : typeof o.description === "string"
        ? o.description.trim() || null
        : undefined;
  if (description === undefined && o.description !== undefined) {
    return { ok: false, error: "description inválido" };
  }

  const zone =
    o.zone === undefined || o.zone === null
      ? null
      : typeof o.zone === "string"
        ? o.zone.trim() || null
        : undefined;
  if (zone === undefined && o.zone !== undefined) {
    return { ok: false, error: "zone inválida" };
  }

  const address =
    o.address === undefined || o.address === null
      ? null
      : typeof o.address === "string"
        ? o.address.trim() || null
        : undefined;
  if (address === undefined && o.address !== undefined) {
    return { ok: false, error: "address inválida" };
  }

  let status: PropertyStatus = "available";
  if (o.status !== undefined && o.status !== null) {
    if (typeof o.status !== "string" || !PROPERTY_STATUSES.includes(o.status as PropertyStatus)) {
      return { ok: false, error: `status debe ser uno de: ${PROPERTY_STATUSES.join(", ")}` };
    }
    status = o.status as PropertyStatus;
  }

  const data: Record<string, unknown> = {
    title,
    description: description ?? null,
    type,
    intent,
    zone: zone ?? null,
    address: address ?? null,
    price,
    status,
  };

  if (o.bedrooms !== undefined) {
    const bedrooms = parseOptionalInt(o.bedrooms);
    if (bedrooms === undefined) {
      return { ok: false, error: "bedrooms debe ser entero >= 0 o null" };
    }
    data.bedrooms = bedrooms;
  }

  if (o.bathrooms !== undefined) {
    const bathrooms = parseOptionalInt(o.bathrooms);
    if (bathrooms === undefined) {
      return { ok: false, error: "bathrooms debe ser entero >= 0 o null" };
    }
    data.bathrooms = bathrooms;
  }

  if (o.area !== undefined) {
    const area = parseOptionalDecimal(o.area);
    if (area === undefined) {
      return { ok: false, error: "area debe ser número >= 0 o null" };
    }
    data.area = area;
  }

  if (o.metadata !== undefined) {
    if (o.metadata !== null && typeof o.metadata !== "object") {
      return { ok: false, error: "metadata debe ser objeto o null" };
    }
    data.metadata = o.metadata;
  }

  return { ok: true, data };
}

export type ParsePropertyPatchResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

export function parsePropertyPatchBody(body: unknown): ParsePropertyPatchResult {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if ("title" in o) {
    if (typeof o.title !== "string" || !o.title.trim()) {
      return { ok: false, error: "title no puede estar vacío" };
    }
    data.title = o.title.trim();
  }

  if ("description" in o) {
    if (o.description !== null && typeof o.description !== "string") {
      return { ok: false, error: "description inválido" };
    }
    data.description = o.description === null ? null : o.description.trim() || null;
  }

  if ("type" in o) {
    if (typeof o.type !== "string" || !PROPERTY_TYPES.includes(o.type as PropertyType)) {
      return { ok: false, error: `type debe ser uno de: ${PROPERTY_TYPES.join(", ")}` };
    }
    data.type = o.type;
  }

  if ("intent" in o) {
    if (typeof o.intent !== "string" || !PROPERTY_INTENTS.includes(o.intent as PropertyIntent)) {
      return { ok: false, error: `intent debe ser uno de: ${PROPERTY_INTENTS.join(", ")}` };
    }
    data.intent = o.intent;
  }

  if ("zone" in o) {
    if (o.zone !== null && typeof o.zone !== "string") {
      return { ok: false, error: "zone inválida" };
    }
    data.zone = o.zone === null ? null : o.zone.trim() || null;
  }

  if ("address" in o) {
    if (o.address !== null && typeof o.address !== "string") {
      return { ok: false, error: "address inválida" };
    }
    data.address = o.address === null ? null : o.address.trim() || null;
  }

  if ("price" in o) {
    const priceRaw = o.price;
    const price =
      typeof priceRaw === "number" && isFiniteNumber(priceRaw) && priceRaw >= 0
        ? String(priceRaw)
        : typeof priceRaw === "string" && priceRaw.trim() !== ""
          ? (() => {
              const n = Number(priceRaw);
              return Number.isFinite(n) && n >= 0 ? priceRaw.trim() : null;
            })()
          : null;
    if (price === null) return { ok: false, error: "price debe ser un número >= 0" };
    data.price = price;
  }

  if ("bedrooms" in o) {
    const b = parseOptionalInt(o.bedrooms);
    if (b === undefined) return { ok: false, error: "bedrooms debe ser entero >= 0 o null" };
    data.bedrooms = b;
  }

  if ("bathrooms" in o) {
    const b = parseOptionalInt(o.bathrooms);
    if (b === undefined) return { ok: false, error: "bathrooms debe ser entero >= 0 o null" };
    data.bathrooms = b;
  }

  if ("area" in o) {
    const a = parseOptionalDecimal(o.area);
    if (a === undefined) return { ok: false, error: "area debe ser número >= 0 o null" };
    data.area = a;
  }

  if ("status" in o) {
    if (typeof o.status !== "string" || !PROPERTY_STATUSES.includes(o.status as PropertyStatus)) {
      return { ok: false, error: `status debe ser uno de: ${PROPERTY_STATUSES.join(", ")}` };
    }
    data.status = o.status;
  }

  if ("metadata" in o) {
    if (o.metadata !== null && typeof o.metadata !== "object") {
      return { ok: false, error: "metadata debe ser objeto o null" };
    }
    data.metadata = o.metadata;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Ningún campo para actualizar" };
  }

  return { ok: true, data };
}
