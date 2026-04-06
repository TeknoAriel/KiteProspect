import { prisma } from "@kite-prospect/db";

export type ResolveCaptureAccountResult =
  | { ok: true; accountId: string }
  | { ok: false; status: number; error: string };

/**
 * Resolución de tenant para captura (misma regla que `createLeadCapture`).
 */
export async function resolveCaptureAccountFromBody(body: Record<string, unknown>): Promise<ResolveCaptureAccountResult> {
  const accountSlug = typeof body.accountSlug === "string" ? body.accountSlug : undefined;
  const accountIdBody = typeof body.accountId === "string" ? body.accountId : undefined;

  if (accountSlug?.trim()) {
    const acc = await prisma.account.findUnique({
      where: { slug: accountSlug.trim() },
      select: { id: true },
    });
    if (!acc) {
      return { ok: false, status: 404, error: "Cuenta no encontrada" };
    }
    return { ok: true, accountId: acc.id };
  }
  if (accountIdBody?.trim()) {
    const acc = await prisma.account.findUnique({
      where: { id: accountIdBody.trim() },
      select: { id: true },
    });
    if (!acc) {
      return { ok: false, status: 404, error: "Cuenta no encontrada" };
    }
    return { ok: true, accountId: acc.id };
  }
  return { ok: false, status: 400, error: "Se requiere accountSlug o accountId" };
}
