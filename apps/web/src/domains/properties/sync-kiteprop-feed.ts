import { createHash } from "node:crypto";
import type { Prisma } from "@kite-prospect/db";
import { prisma } from "@kite-prospect/db";
import type { KitepropFeedSyncStatePatch } from "@/domains/auth-tenancy/account-kiteprop-feed-config";
import type { FeedListing, KitepropSyncStats } from "./kiteprop-feed-types";
import { KITEPROP_EXTERNAL_SOURCE } from "./kiteprop-feed-types";
import { parseProppitPropertyJson } from "./parse-proppit-json";
import { parseZonapropOpenNaventXml } from "./parse-zonaprop-xml";

const FETCH_TIMEOUT_MS = 180_000;

type FetchResult =
  | { kind: "not_modified" }
  | { kind: "ok"; text: string; etag?: string; lastModified?: string };

function stableAmenitiesKey(listing: FeedListing): string {
  const keys = Object.keys(listing.amenities).sort();
  return JSON.stringify(keys.map((k) => [k, listing.amenities[k]]));
}

/** Hash estable del manifiesto: una línea por aviso `externalId\\tfeedUpdatedAt` ordenada. */
export function computeFeedManifestSha256(listings: Iterable<FeedListing>): string {
  const lines = [...listings]
    .map((L) => `${L.externalId}\t${L.feedUpdatedAt ?? ""}`)
    .sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

export function kitepropListingFingerprint(listing: FeedListing): string {
  const payload = {
    feedUpdatedAt: listing.feedUpdatedAt,
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

async function fetchFeedConditional(
  url: string,
  prevEtag: string,
  prevLastModified: string,
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    "User-Agent": "KiteProspect/1.0 (inventory sync)",
  };
  if (prevEtag) headers["If-None-Match"] = prevEtag;
  if (prevLastModified) headers["If-Modified-Since"] = prevLastModified;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
    cache: "no-store",
  });

  if (res.status === 304) {
    return { kind: "not_modified" };
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  return {
    kind: "ok",
    text,
    etag: res.headers.get("etag") ?? undefined,
    lastModified: res.headers.get("last-modified") ?? undefined,
  };
}

function etagPatchFromFetchResults(
  jsonResult: FetchResult | null | undefined,
  xmlResult: FetchResult | null | undefined,
): KitepropFeedSyncStatePatch {
  const p: KitepropFeedSyncStatePatch = {};
  if (jsonResult?.kind === "ok") {
    if (jsonResult.etag) p.lastProppitEtag = jsonResult.etag;
    if (jsonResult.lastModified) p.lastProppitLastModified = jsonResult.lastModified;
  }
  if (xmlResult?.kind === "ok") {
    if (xmlResult.etag) p.lastXmlEtag = xmlResult.etag;
    if (xmlResult.lastModified) p.lastXmlLastModified = xmlResult.lastModified;
  }
  return p;
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

function externalUpdatedAtData(listing: FeedListing): Date | null {
  if (!listing.feedUpdatedAt) return null;
  const d = new Date(listing.feedUpdatedAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertOneListing(
  accountId: string,
  listing: FeedListing,
  now: Date,
  stats: KitepropSyncStats,
): Promise<void> {
  const fp = kitepropListingFingerprint(listing);
  const extAt = externalUpdatedAtData(listing);

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
        externalFeedUpdatedAt: extAt,
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
      externalFeedUpdatedAt: extAt,
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
  removalPolicy: "withdraw" | "delete";
  skipManifestIfUnchanged: boolean;
  lastMergedManifestSha256: string;
  lastProppitEtag: string;
  lastProppitLastModified: string;
  lastXmlEtag: string;
  lastXmlLastModified: string;
};

export type SyncKitepropFeedOutcome = {
  stats: KitepropSyncStats;
  syncStatePatch: KitepropFeedSyncStatePatch;
};

/**
 * Descarga JSON/XML con If-None-Match / If-Modified-Since, fusiona por externalId,
 * omite trabajo si el manifiesto id+fecha no cambió, y retira avisos faltantes según política.
 */
export async function syncKitepropFeedForAccount(
  input: SyncKitepropFeedInput,
): Promise<SyncKitepropFeedOutcome> {
  const stats: KitepropSyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    delisted: 0,
    deleted: 0,
    errors: 0,
    skippedDownload304: 0,
    skippedManifestUnchanged: 0,
  };

  const hasJson = input.proppitJsonUrl.startsWith("http");
  const hasXml = input.zonapropXmlUrl.startsWith("http");

  let jsonResult: FetchResult | null = null;
  let xmlResult: FetchResult | null = null;

  if (hasJson) {
    try {
      jsonResult = await fetchFeedConditional(
        input.proppitJsonUrl,
        input.lastProppitEtag,
        input.lastProppitLastModified,
      );
    } catch (e) {
      console.error(`[kiteprop-feed] JSON fetch failed account=${input.accountId}`, e);
      stats.errors += 1;
    }
  }

  if (hasXml) {
    try {
      xmlResult = await fetchFeedConditional(
        input.zonapropXmlUrl,
        input.lastXmlEtag,
        input.lastXmlLastModified,
      );
    } catch (e) {
      console.error(`[kiteprop-feed] XML fetch failed account=${input.accountId}`, e);
      stats.errors += 1;
    }
  }

  const json304 = hasJson && jsonResult?.kind === "not_modified";
  const xml304 = hasXml && xmlResult?.kind === "not_modified";
  if (json304) stats.skippedDownload304 += 1;
  if (xml304) stats.skippedDownload304 += 1;

  if (hasJson && json304 && (!hasXml || xml304)) {
    return { stats, syncStatePatch: {} };
  }
  if (!hasJson && hasXml && xml304) {
    return { stats, syncStatePatch: {} };
  }

  let jsonList: FeedListing[] = [];
  let xmlList: FeedListing[] = [];
  let jsonOk = !hasJson;
  let xmlOk = !hasXml;

  if (hasJson) {
    if (json304) {
      jsonList = [];
      jsonOk = true;
    } else if (jsonResult?.kind === "ok") {
      try {
        jsonList = parseProppitPropertyJson(jsonResult.text);
        jsonOk = true;
      } catch (e) {
        console.error(`[kiteprop-feed] JSON parse failed account=${input.accountId}`, e);
        stats.errors += 1;
        jsonOk = false;
      }
    } else {
      jsonOk = false;
    }
  }

  if (hasXml) {
    if (xml304) {
      xmlList = [];
      xmlOk = true;
    } else if (xmlResult?.kind === "ok") {
      try {
        xmlList = parseZonapropOpenNaventXml(xmlResult.text);
        xmlOk = true;
      } catch (e) {
        console.error(`[kiteprop-feed] XML parse failed account=${input.accountId}`, e);
        stats.errors += 1;
        xmlOk = false;
      }
    } else {
      xmlOk = false;
    }
  }

  const snapshotTrusted = jsonOk && xmlOk;
  if (!snapshotTrusted) {
    return { stats, syncStatePatch: {} };
  }

  const merged = new Map<string, FeedListing>();
  for (const L of jsonList) merged.set(L.externalId, L);
  for (const L of xmlList) merged.set(L.externalId, L);

  const manifestSha = computeFeedManifestSha256(merged.values());

  if (
    input.skipManifestIfUnchanged &&
    input.lastMergedManifestSha256 &&
    manifestSha === input.lastMergedManifestSha256
  ) {
    stats.skippedManifestUnchanged = 1;
    return {
      stats,
      syncStatePatch: {
        ...etagPatchFromFetchResults(jsonResult ?? undefined, xmlResult ?? undefined),
      },
    };
  }

  const now = new Date();
  const aliveIds = new Set<string>();

  for (const listing of merged.values()) {
    aliveIds.add(listing.externalId);
    try {
      await upsertOneListing(input.accountId, listing, now, stats);
    } catch (e) {
      console.error(
        `[kiteprop-feed] upsert failed account=${input.accountId} id=${listing.externalId}`,
        e,
      );
      stats.errors += 1;
    }
  }

  if (input.delistMissing && snapshotTrusted) {
    const baseWhere = {
      accountId: input.accountId,
      externalSource: KITEPROP_EXTERNAL_SOURCE,
      status: { in: ["available", "reserved"] as string[] },
      externalId: { not: null },
    };

    if (input.removalPolicy === "delete") {
      const del =
        aliveIds.size === 0
          ? await prisma.property.deleteMany({
              where: baseWhere,
            })
          : await prisma.property.deleteMany({
              where: {
                ...baseWhere,
                externalId: { notIn: Array.from(aliveIds) },
              },
            });
      stats.deleted = del.count;
    } else {
      const delist =
        aliveIds.size === 0
          ? await prisma.property.updateMany({
              where: baseWhere,
              data: {
                status: "withdrawn",
                feedRemovedAt: now,
              },
            })
          : await prisma.property.updateMany({
              where: {
                ...baseWhere,
                externalId: { notIn: Array.from(aliveIds) },
              },
              data: {
                status: "withdrawn",
                feedRemovedAt: now,
              },
            });
      stats.delisted = delist.count;
    }
  }

  const syncStatePatch: KitepropFeedSyncStatePatch = {
    ...etagPatchFromFetchResults(jsonResult ?? undefined, xmlResult ?? undefined),
    lastMergedManifestSha256: manifestSha,
  };

  return { stats, syncStatePatch };
}
