import { createHash } from "node:crypto";
import type { Prisma } from "@kite-prospect/db";
import { prisma } from "@kite-prospect/db";
import type { FeedListing, KitepropSyncStats } from "./kiteprop-feed-types";
import { KITEPROP_EXTERNAL_SOURCE } from "./kiteprop-feed-types";
import { parseProppitPropertyJson } from "./parse-proppit-json";
import { parseZonapropOpenNaventXml } from "./parse-zonaprop-xml";

const FETCH_TIMEOUT_MS = 180_000;

function stableAmenitiesKey(listing: FeedListing): string {
  const keys = Object.keys(listing.amenities).sort();
  return JSON.stringify(keys.map((k) => [k, listing.amenities[k]]));
}

export function kitepropListingFingerprint(listing: FeedListing): string {
  const payload = {
    title: listing.title,
    description: listing.description,
    type: listing.type,
    intent: listing.intent,
    price: listing.price,
    currency: listing.currency,
    zone: listing.zone,
    address: listing.address,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    rooms: listing.rooms,
    surfaceTotal: listing.surfaceTotal,
    surfaceCovered: listing.surfaceCovered,
    latitude: listing.latitude,
    longitude: listing.longitude,
    amenities: stableAmenitiesKey(listing),
    referenceKey: listing.referenceKey,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function fetchFeedText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "KiteProspect/1.0 (inventory sync)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

function mergeMetadata(
  existing: Prisma.JsonValue | null | undefined,
  referenceKey: string,
): Prisma.InputJsonValue {
  const base =
    existing !== null && typeof existing === "object" && !Array.isArray(existing)
      ? ({ ...(existing as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const prevKp =
    typeof base.kiteprop === "object" && base.kiteprop !== null && !Array.isArray(base.kiteprop)
      ? ({ ...(base.kiteprop as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  if (referenceKey) prevKp.claveReferencia = referenceKey;
  base.kiteprop = prevKp;
  return base as Prisma.InputJsonValue;
}

function areaFromListing(listing: FeedListing): string | null {
  if (listing.surfaceTotal !== null) return String(listing.surfaceTotal);
  if (listing.surfaceCovered !== null) return String(listing.surfaceCovered);
  return null;
}

async function upsertOneListing(
  accountId: string,
  listing: FeedListing,
  now: Date,
  stats: KitepropSyncStats,
): Promise<void> {
  const fp = kitepropListingFingerprint(listing);
  const existing = await prisma.property.findUnique({
    where: {
      property_account_external_key: {
        accountId,
        externalSource: KITEPROP_EXTERNAL_SOURCE,
        externalId: listing.externalId,
      },
    },
    select: {
      id: true,
      importFingerprint: true,
      status: true,
      metadata: true,
    },
  });

  const nextStatus =
    existing?.status === "sold" || existing?.status === "rented" ? existing.status : "available";

  const metadata = mergeMetadata(existing?.metadata ?? null, listing.referenceKey);

  if (existing) {
    if (existing.importFingerprint === fp) {
      await prisma.property.update({
        where: { id: existing.id },
        data: { feedLastSeenAt: now },
      });
      stats.skipped += 1;
      return;
    }

    await prisma.property.update({
      where: { id: existing.id },
      data: {
        title: listing.title.slice(0, 500),
        description: listing.description ? listing.description.slice(0, 50_000) : null,
        type: listing.type,
        intent: listing.intent,
        zone: listing.zone ? listing.zone.slice(0, 200) : null,
        address: listing.address ? listing.address.slice(0, 500) : null,
        price: String(listing.price),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        area: areaFromListing(listing),
        status: nextStatus,
        importFingerprint: fp,
        amenities: listing.amenities as Prisma.InputJsonValue,
        currency: listing.currency.slice(0, 8),
        surfaceTotal:
          listing.surfaceTotal !== null ? String(listing.surfaceTotal) : null,
        surfaceCovered:
          listing.surfaceCovered !== null ? String(listing.surfaceCovered) : null,
        rooms: listing.rooms,
        latitude: listing.latitude !== null ? String(listing.latitude) : null,
        longitude: listing.longitude !== null ? String(listing.longitude) : null,
        feedLastSeenAt: now,
        feedRemovedAt: null,
        metadata,
      },
    });
    stats.updated += 1;
    return;
  }

  await prisma.property.create({
    data: {
      accountId,
      title: listing.title.slice(0, 500),
      description: listing.description ? listing.description.slice(0, 50_000) : null,
      type: listing.type,
      intent: listing.intent,
      zone: listing.zone ? listing.zone.slice(0, 200) : null,
      address: listing.address ? listing.address.slice(0, 500) : null,
      price: String(listing.price),
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: areaFromListing(listing),
      status: "available",
      externalSource: KITEPROP_EXTERNAL_SOURCE,
      externalId: listing.externalId.slice(0, 120),
      importFingerprint: fp,
      amenities: listing.amenities as Prisma.InputJsonValue,
      currency: listing.currency.slice(0, 8),
      surfaceTotal:
        listing.surfaceTotal !== null ? String(listing.surfaceTotal) : null,
      surfaceCovered:
        listing.surfaceCovered !== null ? String(listing.surfaceCovered) : null,
      rooms: listing.rooms,
      latitude: listing.latitude !== null ? String(listing.latitude) : null,
      longitude: listing.longitude !== null ? String(listing.longitude) : null,
      feedLastSeenAt: now,
      feedRemovedAt: null,
      metadata,
    },
  });
  stats.created += 1;
}

export type SyncKitepropFeedInput = {
  accountId: string;
  proppitJsonUrl: string;
  zonapropXmlUrl: string;
  delistMissing: boolean;
};

/**
 * Descarga JSON (Proppit) y/o XML (OpenNavent), fusiona por `externalId` (XML pisa JSON),
 * upsert con fingerprint y opcionalmente retira del inventario activo lo que ya no viene en el snapshot.
 */
export async function syncKitepropFeedForAccount(input: SyncKitepropFeedInput): Promise<KitepropSyncStats> {
  const stats: KitepropSyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    delisted: 0,
    errors: 0,
  };

  const merged = new Map<string, FeedListing>();
  let snapshotTrusted = false;

  const jsonUrl = input.proppitJsonUrl.trim();
  if (jsonUrl.startsWith("http://") || jsonUrl.startsWith("https://")) {
    try {
      const text = await fetchFeedText(jsonUrl);
      const list = parseProppitPropertyJson(text);
      snapshotTrusted = true;
      for (const L of list) merged.set(L.externalId, L);
    } catch (e) {
      console.error(`[kiteprop-feed] JSON fetch/parse failed account=${input.accountId}`, e);
      stats.errors += 1;
    }
  }

  const xmlUrl = input.zonapropXmlUrl.trim();
  if (xmlUrl.startsWith("http://") || xmlUrl.startsWith("https://")) {
    try {
      const text = await fetchFeedText(xmlUrl);
      const list = parseZonapropOpenNaventXml(text);
      snapshotTrusted = true;
      for (const L of list) merged.set(L.externalId, L);
    } catch (e) {
      console.error(`[kiteprop-feed] XML fetch/parse failed account=${input.accountId}`, e);
      stats.errors += 1;
    }
  }

  if (!snapshotTrusted) {
    return stats;
  }

  const now = new Date();
  const aliveIds = new Set<string>();

  for (const listing of merged.values()) {
    aliveIds.add(listing.externalId);
    try {
      await upsertOneListing(input.accountId, listing, now, stats);
    } catch (e) {
      console.error(`[kiteprop-feed] upsert failed account=${input.accountId} id=${listing.externalId}`, e);
      stats.errors += 1;
    }
  }

  if (input.delistMissing && snapshotTrusted) {
    const baseWhere = {
      accountId: input.accountId,
      externalSource: KITEPROP_EXTERNAL_SOURCE,
      status: { in: ["available", "reserved"] as string[] },
    };
    const delist =
      aliveIds.size === 0
        ? await prisma.property.updateMany({
            where: {
              ...baseWhere,
              externalId: { not: null },
            },
            data: {
              status: "withdrawn",
              feedRemovedAt: now,
            },
          })
        : await prisma.property.updateMany({
            where: {
              ...baseWhere,
              externalId: { not: null, notIn: Array.from(aliveIds) },
            },
            data: {
              status: "withdrawn",
              feedRemovedAt: now,
            },
          });
    stats.delisted = delist.count;
  }

  return stats;
}
