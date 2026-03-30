/** Vista serializada de Property para API y UI (sin Decimal). */
export type SerializedProperty = {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  type: string;
  intent: string;
  zone: string | null;
  address: string | null;
  price: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  status: string;
  metadata: unknown;
  externalSource: string | null;
  externalId: string | null;
  currency: string | null;
  surfaceTotal: string | null;
  surfaceCovered: string | null;
  rooms: number | null;
  feedLastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};
