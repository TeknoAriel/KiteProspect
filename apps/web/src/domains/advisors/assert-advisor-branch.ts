import { prisma } from "@kite-prospect/db";

export async function assertBranchBelongsToAccount(
  accountId: string,
  branchId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (branchId === undefined) return { ok: true };
  if (branchId === null) return { ok: true };
  const b = await prisma.branch.findFirst({
    where: { id: branchId, accountId, status: "active" },
    select: { id: true },
  });
  if (!b) {
    return { ok: false, error: "Sucursal no válida para esta cuenta" };
  }
  return { ok: true };
}
