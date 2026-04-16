import { XMLParser } from "fast-xml-parser";
import type { FeedListing } from "./kiteprop-feed-types";

function xmlText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  if (typeof v === "object" && v !== null && "#text" in v) {
    return String((v as { "#text": unknown })["#text"]).trim();
  }
  return "";
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseNumberLoose(v: string): number | null {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseBoolish(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "si";
}

function mapOperacionToIntent(op: string): string {
  const u = op.trim().toUpperCase();
  if (u.includes("ALQUILER") || u.includes("RENT")) return "renta";
  if (u.includes("VENTA") || u.includes("SALE")) return "venta";
  return "venta";
}

function mapTipoToPropertyType(tipo: string): string {
  const t = tipo.trim().toLowerCase();
  if (t.includes("casa")) return "casa";
  if (t.includes("terreno") || t.includes("lote")) return "terreno";
  if (t.includes("local") || t.includes("comercial")) return "departamento";
  return "departamento";
}

function zoneFromUbicacion(ubicacion: string): string {
  const u = ubicacion.trim();
  if (!u) return "";
  const comma = u.indexOf(",");
  return comma > 0 ? u.slice(0, comma).trim() : u;
}

type Caracteristica = {
  nombre?: unknown;
  valor?: unknown;
  idValor?: unknown;
};

function parseCaracteristicas(block: unknown): {
  amenities: Record<string, boolean | string | number>;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  surfaceTotal: number | null;
  surfaceCovered: number | null;
} {
  const amenities: Record<string, boolean | string | number> = {};
  let bedrooms: number | null = null;
  let bathrooms: number | null = null;
  let rooms: number | null = null;
  let surfaceTotal: number | null = null;
  let surfaceCovered: number | null = null;

  const root = block as { caracteristica?: Caracteristica | Caracteristica[] } | undefined;
  const list = toArray(root?.caracteristica);

  for (const c of list) {
    const nombre = xmlText(c?.nombre);
    if (!nombre) continue;
    const rawVal = xmlText(c?.valor);
    const rawId = xmlText(c?.idValor);
    const hasValor = rawVal.length > 0;
    const hasId = rawId.length > 0;

    if (hasValor && hasId) {
      const nId = parseNumberLoose(rawId);
      if (nId !== null) amenities[nombre] = nId;
      else amenities[nombre] = rawId;
    } else if (hasValor) {
      const n = parseNumberLoose(rawVal);
      if (n !== null) amenities[nombre] = n;
      else amenities[nombre] = rawVal;
    } else if (hasId) {
      const n = parseNumberLoose(rawId);
      if (n !== null) amenities[nombre] = n;
      else amenities[nombre] = parseBoolish(rawId) || rawId;
    } else {
      amenities[nombre] = true;
    }

    const upper = nombre.toUpperCase();
    if (upper.endsWith("|DORMITORIO") || upper.includes("PRINCIPALES|DORMITORIO")) {
      const n = parseNumberLoose(hasValor ? rawVal : rawId);
      if (n !== null) bedrooms = n;
    }
    if (upper.endsWith("|BANO") || upper.includes("PRINCIPALES|BANO")) {
      const n = parseNumberLoose(hasValor ? rawVal : rawId);
      if (n !== null) bathrooms = n;
    }
    if (upper.endsWith("|AMBIENTE") || upper.includes("PRINCIPALES|AMBIENTE")) {
      const n = parseNumberLoose(hasValor ? rawVal : rawId);
      if (n !== null) rooms = n;
    }
    if (upper.includes("SUPERFICIE_TOTAL")) {
      const n = parseNumberLoose(hasValor ? rawVal : rawId);
      if (n !== null) surfaceTotal = n;
    }
    if (upper.includes("SUPERFICIE_CUBIERTA")) {
      const n = parseNumberLoose(hasValor ? rawVal : rawId);
      if (n !== null) surfaceCovered = n;
    }
  }

  return { amenities, bedrooms, bathrooms, rooms, surfaceTotal, surfaceCovered };
}

type Precio = { monto?: unknown; moneda?: unknown; operacion?: unknown };

function pickPrecio(precios: unknown): { price: number; currency: string; intent: string } | null {
  const root = precios as { precio?: Precio | Precio[] } | undefined;
  const list = toArray(root?.precio);
  let best: { price: number; currency: string; intent: string } | null = null;
  for (const p of list) {
    const monto = xmlText(p?.monto);
    const moneda = xmlText(p?.moneda) || "ARS";
    const operacion = xmlText(p?.operacion);
    const price = parseNumberLoose(monto);
    if (price === null || price <= 0) continue;
    const intent = mapOperacionToIntent(operacion || "VENTA");
    if (!best || intent === "venta") {
      best = { price, currency: moneda.toUpperCase(), intent };
    }
  }
  return best;
}

function parseOneAviso(aviso: unknown): FeedListing | null {
  const a = aviso as Record<string, unknown>;
  const externalId = xmlText(a.codigoAviso);
  if (!externalId) return null;

  const title = xmlText(a.titulo) || `Propiedad ${externalId}`;
  const description = xmlText(a.descripcion);
  const tipoBlock = a.tipoDePropiedad as { tipo?: unknown } | undefined;
  const tipoRaw = xmlText(tipoBlock?.tipo);
  const type = mapTipoToPropertyType(tipoRaw || "Departamento");

  const precio = pickPrecio(a.precios);
  if (!precio) return null;

  const loc = a.localizacion as Record<string, unknown> | undefined;
  const ubicacion = xmlText(loc?.Ubicacion);
  const zone = zoneFromUbicacion(ubicacion);
  const address = xmlText(loc?.direccion);
  const lat = parseNumberLoose(xmlText(loc?.latitud));
  const lng = parseNumberLoose(xmlText(loc?.longitud));

  const ref = parseCaracteristicas(a.caracteristicas);
  const referenceKey = xmlText(a.claveReferencia);

  const feedUpdatedAtRaw =
    xmlText(a.fechaModificacion) ||
    xmlText(a.fechaUltimaModificacion) ||
    xmlText(a.fechaPublicacion);
  let feedUpdatedAt: string | null = null;
  if (feedUpdatedAtRaw) {
    const d = new Date(feedUpdatedAtRaw);
    if (!Number.isNaN(d.getTime())) feedUpdatedAt = d.toISOString();
  }

  return {
    externalId,
    feedUpdatedAt,
    title,
    description,
    type,
    intent: precio.intent,
    price: precio.price,
    currency: precio.currency,
    zone,
    address,
    bedrooms: ref.bedrooms,
    bathrooms: ref.bathrooms,
    rooms: ref.rooms,
    surfaceTotal: ref.surfaceTotal,
    surfaceCovered: ref.surfaceCovered,
    latitude: lat,
    longitude: lng,
    amenities: ref.amenities,
    referenceKey,
    availabilityStatus: "available",
    feedFormat: "opennavent_xml",
  };
}

/** Bloque `Avisos` ya parseado (JSON o XML → objeto), misma forma que OpenNavent. */
export function parseOpenNaventAvisosBlock(avisos: unknown): FeedListing[] {
  const block = avisos as { Aviso?: unknown | unknown[] } | undefined;
  const avisoList = toArray(block?.Aviso);
  const out: FeedListing[] = [];
  for (const av of avisoList) {
    const row = parseOneAviso(av);
    if (row) out.push(row);
  }
  return out;
}

export function parseZonapropOpenNaventXml(xml: string): FeedListing[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: false,
    isArray: () => false,
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const open = (doc.OpenNavent ?? doc.openNavent) as Record<string, unknown> | undefined;
  const avisos = open?.Avisos;
  return parseOpenNaventAvisosBlock(avisos);
}
