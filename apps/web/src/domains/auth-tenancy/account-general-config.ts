import type { Prisma } from "@kite-prospect/db";

export type AccountGeneralConfig = {
  timezone?: string;
};

const MAX_TIMEZONE_LEN = 80;

function asRecord(config: unknown): Record<string, unknown> {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

export function extractGeneralFromAccountConfig(
  config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
): AccountGeneralConfig {
  const o = asRecord(config ?? null);
  const timezone = o.timezone;
  return {
    timezone:
      typeof timezone === "string" ? timezone.slice(0, MAX_TIMEZONE_LEN) : undefined,
  };
}

export type AccountGeneralConfigPatch = {
  timezone?: string | null;
};

export function mergeGeneralIntoAccountConfig(
  existing: Prisma.JsonValue | null | undefined,
  patch: AccountGeneralConfigPatch,
): Prisma.InputJsonValue {
  const next = asRecord(existing ?? null);

  if (patch.timezone !== undefined) {
    const tz = patch.timezone?.trim();
    if (!tz) {
      delete next.timezone;
    } else {
      next.timezone = tz.slice(0, MAX_TIMEZONE_LEN);
    }
  }

  return next as Prisma.InputJsonValue;
}
