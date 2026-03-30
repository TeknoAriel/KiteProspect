import type { Prisma } from "@kite-prospect/db";

const MAX_URL_LEN = 2048;

export type KitepropFeedConfig = {
  enabled: boolean;
  proppitJsonUrl: string;
  zonapropXmlUrl: string;
  /** Si true, las importadas que ya no vienen en el JSON pasan a withdrawn (solo available/reserved). */
  delistMissing: boolean;
};

const DEFAULTS: KitepropFeedConfig = {
  enabled: false,
  proppitJsonUrl: "",
  zonapropXmlUrl: "",
  delistMissing: true,
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

export function extractKitepropFeedFromConfig(
  config: Prisma.JsonValue | null | undefined,
): KitepropFeedConfig {
  const o = asRecord(config ?? null);
  const k = asRecord(o.kitepropFeed ?? null);
  return {
    enabled: k.enabled === true,
    proppitJsonUrl: trimUrl(k.proppitJsonUrl),
    zonapropXmlUrl: trimUrl(k.zonapropXmlUrl),
    delistMissing: k.delistMissing !== false,
  };
}

export type KitepropFeedConfigPatch = {
  enabled?: boolean;
  proppitJsonUrl?: string | null;
  zonapropXmlUrl?: string | null;
  delistMissing?: boolean;
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
