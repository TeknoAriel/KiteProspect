/**
 * URL y secreto de firma para handoff lead.qualified hacia KiteProp (o receptor compatible).
 * Prioridad URL: Account.config.kitepropHandoffUrl → KITEPROP_HANDOFF_URL → KITEPROP_HANDOFF_MOCK_URL (solo dev).
 */
import { isDevelopmentNodeEnv, vercelEnv } from "@/lib/runtime-env";

export type AccountConfigHandoff = {
  kitepropHandoffUrl?: string;
};

export function resolveKitepropHandoffUrl(account: {
  config: unknown;
  slug: string;
}): string | null {
  const cfg = account.config as AccountConfigHandoff | null | undefined;
  const fromTenant = cfg?.kitepropHandoffUrl?.trim();
  if (fromTenant) return fromTenant;

  const globalUrl =
    process.env.KITEPROP_HANDOFF_URL?.trim() ||
    process.env.KITEPROP_HANDOFF_MOCK_URL?.trim();
  if (globalUrl) return globalUrl;

  if (isDevelopmentNodeEnv() || vercelEnv() === "preview") {
    return "http://127.0.0.1:3000/api/mock/kiteprop-handoff";
  }

  return null;
}
