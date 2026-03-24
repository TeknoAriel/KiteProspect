import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica `X-Hub-Signature-256` (Meta / WhatsApp Cloud API).
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export function verifyMetaSignature256(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  const secret = appSecret.trim();
  if (!secret) return false;
  const h = signatureHeader?.trim();
  if (!h?.startsWith("sha256=")) return false;
  const receivedHex = h.slice(7);
  const expectedHex = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(receivedHex, "hex");
    const b = Buffer.from(expectedHex, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
