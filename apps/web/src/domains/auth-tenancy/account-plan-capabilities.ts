/**
 * Base estructural para planes y límites (monetización futura).
 * No facturación; solo tipos y lectura segura de `Account.config`.
 * Ver `docs/monetizacion-base.md`.
 */
import type { Prisma } from "@kite-prospect/db";

export type PlanTier = "basic" | "pro" | "advanced" | "enterprise";

export type AccountFeatureFlags = {
  /** Tier comercial (opcional). */
  planTier?: PlanTier;
  /** Límites blandos; enforcement progresivo en código. */
  maxActiveLeads?: number;
  maxInternalUsers?: number;
  maxFollowUpPlans?: number;
  maxChannelsEnabled?: number;
  advancedScoring?: boolean;
  advancedAnalytics?: boolean;
  crmIntegrations?: boolean;
  smartReactivation?: boolean;
  autoDerivation?: boolean;
  partialWhiteLabel?: boolean;
};

function asRecord(config: unknown): Record<string, unknown> {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

export function extractFeatureFlagsFromAccountConfig(
  config: Prisma.JsonValue | null | undefined,
): AccountFeatureFlags {
  const o = asRecord(config ?? null);
  const ff = o.featureFlags;
  if (ff === null || typeof ff !== "object" || Array.isArray(ff)) return {};
  return ff as AccountFeatureFlags;
}
