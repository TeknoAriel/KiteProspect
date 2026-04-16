export const KITEPROP_EXTERNAL_SOURCE = "kiteprop" as const;

export type FeedListing = {
  externalId: string;
  /** ISO 8601 desde el feed (última modificación del aviso), si existe. */
  feedUpdatedAt: string | null;
  title: string;
  description: string;
  type: string;
  intent: string;
  price: number;
  currency: string;
  zone: string;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  surfaceTotal: number | null;
  surfaceCovered: number | null;
  latitude: number | null;
  longitude: number | null;
  amenities: Record<string, boolean | string | number>;
  /** Referencia humana (ej. claveReferencia). */
  referenceKey: string;
  /** Canon `Property.status`: available | reserved | sold | rented | withdrawn */
  availabilityStatus: string;
  /** Origen del parseo (trazabilidad en Property.metadata.kiteprop). */
  feedFormat: "proppit" | "kiteprop_json" | "opennavent_xml";
  city?: string | null;
  province?: string | null;
  country?: string | null;
  /** URL pública de ficha (KiteProp `url`). */
  publicUrl?: string;
  /** Snapshot del objeto JSON origen (feed externalsite); consultas en SQL/JSON sin re-fetch. */
  rawRecord?: Record<string, unknown>;
};

export type KitepropSyncStats = {
  created: number;
  updated: number;
  skipped: number;
  delisted: number;
  /** Filas eliminadas de BD (política delete). */
  deleted: number;
  errors: number;
  /** Respuestas HTTP 304 (sin cuerpo) por fuente. */
  skippedDownload304: number;
  /** Manifiesto id+fecha igual al guardado: sin upserts ni bajas. */
  skippedManifestUnchanged: number;
};
