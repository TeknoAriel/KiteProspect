import type { FeedListing } from "./kiteprop-feed-types";
import { parseOpenNaventAvisosBlock, parseZonapropOpenNaventXml } from "./parse-zonaprop-xml";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function mapIntent(v: string): string {
  const u = v.toUpperCase();
  if (u.includes("ALQUILER") || u.includes("RENT")) return "renta";
  return "venta";
}

/** Normaliza a ISO 8601 la fecha de última actualización del aviso en el JSON. */
function feedUpdatedAtFromPlainObject(o: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    o.last_update,
    o.fechaModificacion,
    o.fechaUltimaModificacion,
    o.fechaActualizacion,
    o.ultimaActualizacion,
    o.updatedAt,
    o.modifiedAt,
    o.fechaUltimaModificacionAviso,
    o.fechaPublicacion,
  ];
  for (const c of candidates) {
    const iso = toIso8601OrNull(c);
    if (iso) return iso;
  }
  return null;
}

function toIso8601OrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v > 1e12 ? v : v * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapType(v: string): string {
  const t = v.toLowerCase();
  if (t.includes("casa") || t.includes("house")) return "casa";
  if (t.includes("terreno") || t.includes("lote") || t.includes("land")) return "terreno";
  if (t.includes("local")) return "local";
  return "departamento";
}

function isKitepropJsonShape(o: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(o, "for_sale") ||
    Object.prototype.hasOwnProperty.call(o, "for_rent") ||
    (typeof o.property_type === "string" && Object.prototype.hasOwnProperty.call(o, "last_update"))
  );
}

/** Alineado a `Property.status` en Prisma. */
function mapAvailabilityStatus(raw: unknown): string {
  const s = str(raw).toLowerCase();
  if (!s) return "available";
  if (s.includes("reserv")) return "reserved";
  if (s === "sold" || s.includes("vend")) return "sold";
  if (s === "rented" || (s.includes("alquil") && !s.includes("tempor"))) return "rented";
  if (s.includes("withdraw") || s.includes("baja")) return "withdrawn";
  return "available";
}

function resolvePriceAndIntent(o: Record<string, unknown>): { price: number; intent: string } | null {
  if (o.for_sale === true) {
    const p =
      num(o.for_sale_price) ??
      num(o.precio) ??
      num(o.price) ??
      num(o.amount);
    if (p !== null && p > 0) return { price: p, intent: "venta" };
  }
  if (o.for_rent === true) {
    const p =
      num(o.for_rent_price) ??
      num(o.precio) ??
      num(o.price) ??
      num(o.amount);
    if (p !== null && p > 0) return { price: p, intent: "renta" };
  }
  const p =
    num(o.precio) ??
    num(o.price) ??
    num(o.amount) ??
    num((o.precios as Record<string, unknown> | undefined)?.monto);
  if (p === null || p <= 0) return null;
  const intent = mapIntent(str(o.operacion) || str(o.intent) || str(o.operation) || "VENTA");
  return { price: p, intent };
}

/**
 * Normaliza un objeto plano típico de export JSON (claves variables).
 * Soporta exports tipo **KiteProp externalsite** (`for_sale`, `content`, `last_update`, …).
 */
function fromPlainObject(o: Record<string, unknown>): FeedListing | null {
  const externalId =
    str(o.codigoAviso) ||
    str(o.id) ||
    str(o.externalId) ||
    str(o.listingId) ||
    str(o.avisoId);
  if (!externalId) return null;

  const kite = isKitepropJsonShape(o);
  const title =
    str(o.titulo) || str(o.title) || str(o.name) || `Propiedad ${externalId}`;
  const description =
    str(o.descripcion) || str(o.description) || str(o.content) || "";
  const type = mapType(
    str(o.tipo) || str(o.tipoDePropiedad) || str(o.property_type) || str(o.propertyType) || "departamento",
  );

  const priced = resolvePriceAndIntent(o);
  if (!priced) return null;

  const currency = (str(o.moneda) || str(o.currency) || "ARS").toUpperCase();

  const zone =
    str(o.zona) ||
    str(o.zone) ||
    str(o.barrio) ||
    str(o.city) ||
    str((o.localizacion as Record<string, unknown> | undefined)?.Ubicacion) ||
    "";
  const address =
    str(o.direccion) ||
    str(o.address) ||
    str((o.localizacion as Record<string, unknown> | undefined)?.direccion) ||
    "";

  const bedrooms = num(o.dormitorios) ?? num(o.bedrooms) ?? null;
  const bathrooms = num(o.banos) ?? num(o.bathrooms) ?? null;
  const rooms =
    num(o.ambientes) ?? num(o.rooms) ?? num(o.total_rooms) ?? null;
  const surfaceTotal =
    num(o.superficieTotal) ??
    num(o.surfaceTotal) ??
    num(o.total_meters) ??
    null;
  const surfaceCovered =
    num(o.superficieCubierta) ?? num(o.surfaceCovered) ?? num(o.covered_meters) ?? null;
  const latitude = num(o.latitud) ?? num(o.latitude) ?? null;
  const longitude = num(o.longitud) ?? num(o.longitude) ?? null;

  const amenitiesRaw = o.amenities ?? o.caracteristicas;
  let amenities: Record<string, boolean | string | number> = {};
  if (amenitiesRaw !== null && typeof amenitiesRaw === "object" && !Array.isArray(amenitiesRaw)) {
    amenities = amenitiesRaw as Record<string, boolean | string | number>;
  }
  if (Array.isArray(o.images)) {
    amenities = { ...amenities, kiteprop_image_count: o.images.length };
  }

  const referenceKey = str(o.claveReferencia) || str(o.reference) || "";
  const feedUpdatedAt = feedUpdatedAtFromPlainObject(o);
  const availabilityStatus = mapAvailabilityStatus(o.status);
  const city = str(o.city) || null;
  const province = str(o.region) || str(o.province) || null;
  const country = str(o.country) || null;
  const publicUrl = str(o.url) || undefined;
  const rawRecord = kite ? { ...o } : undefined;

  return {
    externalId,
    feedUpdatedAt,
    title,
    description,
    type,
    intent: priced.intent,
    price: priced.price,
    currency,
    zone,
    address,
    bedrooms,
    bathrooms,
    rooms,
    surfaceTotal,
    surfaceCovered,
    latitude,
    longitude,
    amenities,
    referenceKey,
    availabilityStatus,
    feedFormat: kite ? "kiteprop_json" : "proppit",
    city,
    province,
    country,
    publicUrl,
    rawRecord,
  };
}

/**
 * Parsea el JSON de Proppit / export: acepta array raíz, OpenNavent, o envoltorios comunes.
 */
export function parseProppitPropertyJson(jsonText: string): FeedListing[] {
  const trimmed = jsonText.trim();
  if (trimmed.startsWith("<")) {
    return parseZonapropOpenNaventXml(trimmed);
  }

  const data = JSON.parse(jsonText) as unknown;

  if (Array.isArray(data)) {
    const out: FeedListing[] = [];
    for (const item of data) {
      const rec = asRecord(item);
      if (rec) {
        const row = fromPlainObject(rec);
        if (row) out.push(row);
      }
    }
    return out;
  }

  const root = asRecord(data);
  if (!root) return [];

  const direct = parseOpenNaventAvisosBlock(root.Avisos);
  if (direct.length > 0) return direct;

  const nestedKeys = ["OpenNavent", "openNavent", "data", "result", "payload", "response"] as const;
  for (const k of nestedKeys) {
    const inner = asRecord(root[k]);
    if (inner) {
      const innerList = parseOpenNaventAvisosBlock(inner.Avisos);
      if (innerList.length > 0) return innerList;
    }
  }

  for (const key of ["avisos", "listings", "properties", "items"]) {
    const arr = root[key];
    if (Array.isArray(arr)) {
      const out: FeedListing[] = [];
      for (const item of arr) {
        const rec = asRecord(item);
        if (rec) {
          const row = fromPlainObject(rec);
          if (row) out.push(row);
        }
      }
      if (out.length > 0) return out;
    }
  }

  return [];
}
