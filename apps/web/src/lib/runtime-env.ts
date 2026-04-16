/**
 * Clasificación de entorno para defaults seguros (p. ej. consentimiento implícito solo en dev/preview).
 */

export function isDevelopmentNodeEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Vercel: preview | production | empty (local). */
export function vercelEnv(): string | undefined {
  return process.env.VERCEL_ENV?.trim() || undefined;
}

/**
 * `true` si se permiten defaults de demo (consentimiento sin opt-in explícito en body).
 * Producción Vercel: solo con ALLOW_IMPLICIT_CONSENT_DEFAULT=true (explícito).
 */
export function allowImplicitMarketingConsentDefault(): boolean {
  const implicit = process.env.ALLOW_IMPLICIT_CONSENT_DEFAULT?.trim();
  if (implicit === "true" || implicit === "1") {
    return true;
  }
  if (isDevelopmentNodeEnv()) {
    return true;
  }
  const v = vercelEnv();
  if (v === "preview") {
    return true;
  }
  return false;
}

export function isProductionDeployment(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const v = vercelEnv();
  if (v === "production") return true;
  if (process.env.FORCE_PRODUCTION_ENV_CHECKS === "true") return true;
  return false;
}
