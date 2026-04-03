import type { Prisma } from "@kite-prospect/db";

const MAX_URL_LEN = 2048;

/** Política para avisos que dejaron de aparecer en el snapshot del feed. */
export type KitepropRemovalPolicy = "withdraw" | "delete";

export type KitepropFeedConfig = {
  enabled: boolean;
  proppitJsonUrl: string;
  zonapropXmlUrl: string;
  /** Si true, las importadas que ya no vienen en el snapshot se retiran del inventario activo. */
  delistMissing: boolean;
  /** withdraw = estado withdrawn; delete = borrado en BD (cascade matches/recommendations). */
  removalPolicy: KitepropRemovalPolicy;
  /** Si el hash de manifiesto (id + fecha feed) no cambió, omitir upserts y bajas. */
  skipManifestIfUnchanged: boolean;
  /** SHA-256 del listado ordenado `externalId\\tfeedUpdatedAt`. */
  lastMergedManifestSha256: string;
  lastProppitEtag: string;
  lastProppitLastModified: string;
  lastXmlEtag: string;
  lastXmlLastModified: string;
};

function asRecord(config: unknown): Record<string, unknown> {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

function trimUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, MAX_URL_LEN);
}

function strOpt(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function extractKitepropFeedFromConfig(
  config: Prisma.JsonValue | null | undefined,
): KitepropFeedConfig {
  const o = asRecord(config ?? null);
  const k = asRecord(o.kitepropFeed ?? null);
  const removal = strOpt(k.removalPolicy).toLowerCase();
  return {
    enabled: k.enabled === true,
    proppitJsonUrl: trimUrl(k.proppitJsonUrl),
    zonapropXmlUrl: trimUrl(k.zonapropXmlUrl),
    delistMissing: k.delistMissing !== false,
    removalPolicy: removal === "delete" ? "delete" : "withdraw",
    skipManifestIfUnchanged: k.skipManifestIfUnchanged !== false,
    lastMergedManifestSha256: strOpt(k.lastMergedManifestSha256).trim(),
    lastProppitEtag: strOpt(k.lastProppitEtag).trim(),
    lastProppitLastModified: strOpt(k.lastProppitLastModified).trim(),
    lastXmlEtag: strOpt(k.lastXmlEtag).trim(),
    lastXmlLastModified: strOpt(k.lastXmlLastModified).trim(),
  };
}

export type KitepropFeedConfigPatch = {
  enabled?: boolean;
  proppitJsonUrl?: string | null;
  zonapropXmlUrl?: string | null;
  delistMissing?: boolean;
  removalPolicy?: KitepropRemovalPolicy;
  skipManifestIfUnchanged?: boolean;
};

export type KitepropFeedSyncStatePatch = {
  lastMergedManifestSha256?: string;
  lastProppitEtag?: string | null;
  lastProppitLastModified?: string | null;
  lastXmlEtag?: string | null;
  lastXmlLastModified?: string | null;
};

export function mergeKitepropFeedIntoAccountConfig(
  existing: Prisma.JsonValue | null | undefined,
  patch: KitepropFeedConfigPatch,
): Prisma.InputJsonValue {
  const next = asRecord(existing ?? null);
  const cur = asRecord(next.kitepropFeed ?? null);

  if (patch.enabled !== undefined) {
    cur.enabled = patch.enabled;
  }
  if (patch.proppitJsonUrl !== undefined) {
    const u = patch.proppitJsonUrl?.trim() ?? "";
    if (!u) delete cur.proppitJsonUrl;
    else cur.proppitJsonUrl = u.slice(0, MAX_URL_LEN);
  }
  if (patch.zonapropXmlUrl !== undefined) {
    const u = patch.zonapropXmlUrl?.trim() ?? "";
    if (!u) delete cur.zonapropXmlUrl;
    else cur.zonapropXmlUrl = u.slice(0, MAX_URL_LEN);
  }
  if (patch.delistMissing !== undefined) {
    cur.delistMissing = patch.delistMissing;
  }
  if (patch.removalPolicy !== undefined) {
    cur.removalPolicy = patch.removalPolicy;
  }
  if (patch.skipManifestIfUnchanged !== undefined) {
    cur.skipManifestIfUnchanged = patch.skipManifestIfUnchanged;
  }

  if (Object.keys(cur).length === 0) {
    delete next.kitepropFeed;
  } else {
    next.kitepropFeed = cur;
  }

  return next as Prisma.InputJsonValue;
}

/** Aplica campos persistidos por el job de sync (ETags, manifiesto) sin borrar el resto de `kitepropFeed`. */
export function applyKitepropFeedSyncStatePatch(
  existing: Prisma.JsonValue | null | undefined,
  patch: KitepropFeedSyncStatePatch,
): Prisma.InputJsonValue {
  const next = asRecord(existing ?? null);
  const cur = asRecord(next.kitepropFeed ?? null);

  if (patch.lastMergedManifestSha256 !== undefined) {
    cur.lastMergedManifestSha256 = patch.lastMergedManifestSha256;
  }
  if (patch.lastProppitEtag !== undefined) {
    if (patch.lastProppitEtag === null || patch.lastProppitEtag === "") delete cur.lastProppitEtag;
    else cur.lastProppitEtag = patch.lastProppitEtag;
  }
  if (patch.lastProppitLastModified !== undefined) {
    if (patch.lastProppitLastModified === null || patch.lastProppitLastModified === "")
      delete cur.lastProppitLastModified;
    else cur.lastProppitLastModified = patch.lastProppitLastModified;
  }
  if (patch.lastXmlEtag !== undefined) {
    if (patch.lastXmlEtag === null || patch.lastXmlEtag === "") delete cur.lastXmlEtag;
    else cur.lastXmlEtag = patch.lastXmlEtag;
  }
  if (patch.lastXmlLastModified !== undefined) {
    if (patch.lastXmlLastModified === null || patch.lastXmlLastModified === "")
      delete cur.lastXmlLastModified;
    else cur.lastXmlLastModified = patch.lastXmlLastModified;
  }

  if (Object.keys(cur).length === 0) {
    delete next.kitepropFeed;
  } else {
    next.kitepropFeed = cur;
  }

  return next as Prisma.InputJsonValue;
}

export function kitepropFeedIsRunnable(cfg: KitepropFeedConfig): boolean {
  if (!cfg.enabled) return false;
  const hasJson = cfg.proppitJsonUrl.startsWith("http");
  const hasXml = cfg.zonapropXmlUrl.startsWith("http");
  return hasJson || hasXml;
}
