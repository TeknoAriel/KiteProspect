import type { Property } from "@kite-prospect/db";
import type { SerializedProperty } from "./property-types";

/** JSON seguro para cliente: Decimal → string */
export function serializeProperty(p: Property): SerializedProperty {
  return {
    id: p.id,
    accountId: p.accountId,
    title: p.title,
    description: p.description,
    type: p.type,
    intent: p.intent,
    zone: p.zone,
    address: p.address,
    price: p.price.toString(),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area?.toString() ?? null,
    status: p.status,
    metadata: p.metadata,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
