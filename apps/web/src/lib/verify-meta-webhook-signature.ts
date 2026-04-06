/**
 * Verificación X-Hub-Signature-256 (Meta / Graph webhooks).
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaWebhookSignature256(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
  try {
    const a = Buffer.from(signatureHeader, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
