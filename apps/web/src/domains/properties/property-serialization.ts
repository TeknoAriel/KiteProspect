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
    externalSource: p.externalSource ?? null,
    externalId: p.externalId ?? null,
    currency: p.currency ?? null,
    surfaceTotal: p.surfaceTotal?.toString() ?? null,
    surfaceCovered: p.surfaceCovered?.toString() ?? null,
    rooms: p.rooms ?? null,
    feedLastSeenAt: p.feedLastSeenAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
