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
  createdAt: string;
  updatedAt: string;
};
