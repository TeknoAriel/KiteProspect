/**
 * Alcance de contactos para agregados de reportes (tenant ± sucursal).
 */
import type { Session } from "next-auth";
import type { Prisma } from "@kite-prospect/db";
import { contactWhereForAdvisorRole } from "@/domains/auth-tenancy/advisor-contact-scope";

export function contactWhereOperational(
  accountId: string,
  branchId: string | undefined,
): { accountId: string; branchId?: string } {
  if (branchId) {
    return { accountId, branchId };
  }
  return { accountId };
}

/** Reportes operativos: filtro UI (sucursal) ∩ alcance por rol asesor (F3-E4++). */
export function getOperationalContactWhere(
  accountId: string,
  branchId: string | undefined,
  session: Session,
): Prisma.ContactWhereInput {
  const op = contactWhereOperational(accountId, branchId) as Prisma.ContactWhereInput;
  const roleScope = contactWhereForAdvisorRole(accountId, session);
  return { AND: [op, roleScope] };
}
