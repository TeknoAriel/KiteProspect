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

function mapType(v: string): string {
  const t = v.toLowerCase();
  if (t.includes("casa")) return "casa";
  if (t.includes("terreno") || t.includes("lote")) return "terreno";
  if (t.includes("local")) return "local";
  return "departamento";
}

/**
 * Normaliza un objeto plano típico de export JSON (claves variables).
 */
function fromPlainObject(o: Record<string, unknown>): FeedListing | null {
  const externalId =
    str(o.codigoAviso) ||
    str(o.id) ||
    str(o.externalId) ||
    str(o.listingId) ||
    str(o.avisoId);
  if (!externalId) return null;

  const title =
    str(o.titulo) || str(o.title) || str(o.name) || `Propiedad ${externalId}`;
  const description = str(o.descripcion) || str(o.description) || "";
  const type = mapType(str(o.tipo) || str(o.tipoDePropiedad) || str(o.propertyType) || "departamento");

  const price =
    num(o.precio) ||
    num(o.price) ||
    num(o.amount) ||
    num((o.precios as Record<string, unknown> | undefined)?.monto);
  if (price === null || price <= 0) return null;

  const currency = (str(o.moneda) || str(o.currency) || "ARS").toUpperCase();
  const intent = mapIntent(str(o.operacion) || str(o.intent) || str(o.operation) || "VENTA");

  const zone =
    str(o.zona) ||
    str(o.zone) ||
    str(o.barrio) ||
    str((o.localizacion as Record<string, unknown> | undefined)?.Ubicacion) ||
    "";
  const address =
    str(o.direccion) ||
    str(o.address) ||
    str((o.localizacion as Record<string, unknown> | undefined)?.direccion) ||
    "";

  const bedrooms = num(o.dormitorios) ?? num(o.bedrooms) ?? null;
  const bathrooms = num(o.banos) ?? num(o.bathrooms) ?? null;
  const rooms = num(o.ambientes) ?? num(o.rooms) ?? null;
  const surfaceTotal = num(o.superficieTotal) ?? num(o.surfaceTotal) ?? null;
  const surfaceCovered = num(o.superficieCubierta) ?? num(o.surfaceCovered) ?? null;
  const latitude = num(o.latitud) ?? num(o.latitude) ?? null;
  const longitude = num(o.longitud) ?? num(o.longitude) ?? null;

  const amenitiesRaw = o.amenities ?? o.caracteristicas;
  let amenities: Record<string, boolean | string | number> = {};
  if (amenitiesRaw !== null && typeof amenitiesRaw === "object" && !Array.isArray(amenitiesRaw)) {
    amenities = amenitiesRaw as Record<string, boolean | string | number>;
  }

  const referenceKey = str(o.claveReferencia) || str(o.reference) || "";

  return {
    externalId,
    title,
    description,
    type,
    intent,
    price,
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
