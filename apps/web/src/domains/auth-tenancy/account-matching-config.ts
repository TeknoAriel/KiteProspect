import type { Prisma } from "@kite-prospect/db";

/** Pesos por dimensión (0–100 en suma) para matching; se normalizan a suma 100. F2-E2. */
export type MatchingDimensionWeights = {
  intent: number;
  type: number;
  zone: number;
  price: number;
  bedrooms: number;
};

export const DEFAULT_MATCHING_WEIGHTS: MatchingDimensionWeights = {
  intent: 20,
  type: 20,
  zone: 20,
  price: 20,
  bedrooms: 20,
};

const CONFIG_KEY = "matchingWeights";

function asRecord(config: unknown): Record<string, unknown> {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

export function extractMatchingWeightsFromAccountConfig(
  config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
): MatchingDimensionWeights {
  const o = asRecord(config ?? null);
  const raw = o[CONFIG_KEY];
  return normalizeMatchingWeights(raw);
}

export function normalizeMatchingWeights(raw: unknown): MatchingDimensionWeights {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_MATCHING_WEIGHTS;
  }
  const o = raw as Record<string, unknown>;
  const keys = ["intent", "type", "zone", "price", "bedrooms"] as const;
  const nums = keys.map((k) => {
    const v = o[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return 0;
    return Math.round(v);
  });
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum === 0) return DEFAULT_MATCHING_WEIGHTS;
  const scaled = nums.map((n) => Math.round((n * 100) / sum));
  let drift = 100 - scaled.reduce((a, b) => a + b, 0);
  if (drift !== 0) scaled[scaled.length - 1] = (scaled[scaled.length - 1] ?? 0) + drift;
  return {
    intent: scaled[0]!,
    type: scaled[1]!,
    zone: scaled[2]!,
    price: scaled[3]!,
    bedrooms: scaled[4]!,
  };
}

export type MatchingWeightsPatch = {
  matchingWeights?: MatchingDimensionWeights | null;
};

export function mergeMatchingWeightsIntoAccountConfig(
  existing: Prisma.JsonValue | null | undefined,
  patch: MatchingWeightsPatch,
): Prisma.InputJsonValue {
  const next = asRecord(existing ?? null);

  if (patch.matchingWeights === undefined) {
    return next as Prisma.InputJsonValue;
  }

  if (patch.matchingWeights === null) {
    delete next[CONFIG_KEY];
    return next as Prisma.InputJsonValue;
  }

  const w = normalizeMatchingWeights(patch.matchingWeights);
  const isDefault =
    w.intent === DEFAULT_MATCHING_WEIGHTS.intent &&
    w.type === DEFAULT_MATCHING_WEIGHTS.type &&
    w.zone === DEFAULT_MATCHING_WEIGHTS.zone &&
    w.price === DEFAULT_MATCHING_WEIGHTS.price &&
    w.bedrooms === DEFAULT_MATCHING_WEIGHTS.bedrooms;

  if (isDefault) {
    delete next[CONFIG_KEY];
  } else {
    next[CONFIG_KEY] = w;
  }

  return next as Prisma.InputJsonValue;
}
