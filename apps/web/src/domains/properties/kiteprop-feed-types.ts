export const KITEPROP_EXTERNAL_SOURCE = "kiteprop" as const;

export type FeedListing = {
  externalId: string;
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
};

export type KitepropSyncStats = {
  created: number;
  updated: number;
  skipped: number;
  delisted: number;
  errors: number;
};
