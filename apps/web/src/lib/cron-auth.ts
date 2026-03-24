import { timingSafeEqual } from "node:crypto";

/**
 * Valida `Authorization: Bearer <CRON_SECRET>` en tiempo constante.
 */
export function verifyCronBearer(authorizationHeader: string | null, secret: string): boolean {
  const s = secret.trim();
  if (!s) return false;

  const bearer = authorizationHeader?.trim();
  if (!bearer?.startsWith("Bearer ")) return false;
  const token = bearer.slice(7).trim();

  try {
    const bufA = Buffer.from(token, "utf8");
    const bufB = Buffer.from(s, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
