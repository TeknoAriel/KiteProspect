/**
 * Alcance de contactos para usuarios con rol asesor y sucursal en `Advisor.branchId` (F3-E4++).
 * Ven contactos de esa sucursal o sin sucursal (pool compartido).
 */
import type { Session } from "next-auth";
import type { Prisma } from "@kite-prospect/db";

export function getAdvisorBranchScopeId(session: Session): string | null {
  if (session.user.role !== "advisor") return null;
  return session.user.advisorBranchId ?? null;
}

/** Filtro Prisma para `Contact` (incluye accountId). */
export function contactWhereForAdvisorRole(
  accountId: string,
  session: Session,
): Prisma.ContactWhereInput {
  const base: Prisma.ContactWhereInput = { accountId };
  const bid = getAdvisorBranchScopeId(session);
  if (!bid) return base;
  return {
    ...base,
    OR: [{ branchId: bid }, { branchId: null }],
  };
}

/** Filtro para `Conversation` por contacto en alcance. */
export function conversationWhereForAdvisorContact(
  accountId: string,
  session: Session,
): Prisma.ConversationWhereInput {
  const base: Prisma.ConversationWhereInput = { accountId };
  const bid = getAdvisorBranchScopeId(session);
  if (!bid) return base;
  return {
    ...base,
    contact: {
      OR: [{ branchId: bid }, { branchId: null }],
    },
  };
}

/** True si el contacto es visible para el asesor con sucursal. */
export function isContactVisibleToAdvisorSession(
  session: Session,
  contactBranchId: string | null,
): boolean {
  const bid = getAdvisorBranchScopeId(session);
  if (!bid) return true;
  return contactBranchId === null || contactBranchId === bid;
}
