/**
 * Solo https en producción; http permitido para localhost (pruebas).
 */
export function isAllowedOutboundWebhookUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol === "https:") return true;
    if (u.protocol === "http:") {
      const host = u.hostname;
      return host === "localhost" || host === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}
