import { isProductionDeployment } from "./runtime-env";

const REQUIRED_PRODUCTION = ["DATABASE_URL", "AUTH_SECRET"] as const;

/**
 * Invocar al arranque del servidor Node (instrumentation).
 * Falla en producción si faltan secretos críticos.
 * La URL de handoff puede ir por tenant (`Account.config.kitepropHandoffUrl`).
 *
 * Escape hatch (solo migración): `KITEPROP_SKIP_PRODUCTION_HMAC_CHECK=true`
 */
export function validateServerEnvOrThrow(): void {
  if (!isProductionDeployment()) {
    return;
  }

  const missing: string[] = [];
  for (const k of REQUIRED_PRODUCTION) {
    if (!process.env[k]?.trim()) missing.push(k);
  }

  const skipHandoff =
    process.env.KITEPROP_SKIP_PRODUCTION_HMAC_CHECK?.trim() === "true";

  if (
    !skipHandoff &&
    !process.env.KITEPROP_HANDOFF_HMAC_SECRET?.trim() &&
    !process.env.KITEPROP_HANDOFF_SIGNING_SECRET?.trim()
  ) {
    missing.push(
      "KITEPROP_HANDOFF_HMAC_SECRET (o KITEPROP_HANDOFF_SIGNING_SECRET); o KITEPROP_SKIP_PRODUCTION_HMAC_CHECK=true temporal",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Producción: faltan variables obligatorias: ${missing.join(", ")}`,
    );
  }
}
