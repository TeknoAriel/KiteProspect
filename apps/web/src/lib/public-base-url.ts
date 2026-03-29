import { headers } from "next/headers";

/**
 * URL pública de la app para mostrar endpoints en UI (docs internas).
 * Prioridad: AUTH_URL → VERCEL_URL → cabeceras del request → localhost.
 */
export async function getPublicAppBaseUrl(): Promise<string> {
  const fromAuth = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (fromAuth) return fromAuth;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
