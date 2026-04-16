import { allowImplicitMarketingConsentDefault } from "./runtime-env";

/**
 * Resuelve si se otorga consentimiento de marketing en captura.
 * En producción sin flag, hace falta `consentMarketing: true` explícito.
 */
export function resolveConsentMarketingInput(input: {
  consentMarketing?: unknown;
}): boolean {
  if (input.consentMarketing === true || input.consentMarketing === "true") {
    return true;
  }
  if (input.consentMarketing === false || input.consentMarketing === "false") {
    return false;
  }
  return allowImplicitMarketingConsentDefault();
}
