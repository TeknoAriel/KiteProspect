/**
 * Auditoría básica — escritura de AuditEvent
 * MVP: eventos explícitos desde código (login, acciones futuras)
 * TODO Fase 2: middleware Prisma / outbox para no olvidar eventos
 */
import { prisma } from "@kite-prospect/db";

export type AuditPayload = {
  accountId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorType?: "user" | "system" | "integration" | string;
  changes?: unknown;
  metadata?: unknown;
};

export async function recordAuditEvent(payload: AuditPayload): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      accountId: payload.accountId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      actorId: payload.actorId ?? undefined,
      actorType: payload.actorType ?? undefined,
      changes: payload.changes === undefined ? undefined : (payload.changes as object),
      metadata: payload.metadata === undefined ? undefined : (payload.metadata as object),
    },
  });
}
