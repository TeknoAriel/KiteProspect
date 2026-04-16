import { createHash } from "node:crypto";
import type { NormalizedKitepropImport } from "./kiteprop-rest-types";

/**
 * Clave estable para IngestionIdempotencyKey (source kiteprop_rest).
 * Orden: id externo lead/mensaje → compuesto contacto+propiedad+fecha → email/tel+propiedad → hash mensaje.
 */
export function buildKitepropRestIdempotencyKey(
  accountId: string,
  n: NormalizedKitepropImport,
): string {
  if (n.externalMessageId) {
    return `msg:${n.externalMessageId}`;
  }
  if (n.externalLeadId) {
    return `lead:${n.externalLeadId}`;
  }

  const prop = n.propertyExternalId ?? "noprop";
  const t = Math.floor(n.occurredAt.getTime() / 3_600_000); // ventana ~1h
  if (n.externalContactId) {
    return `cc:${n.externalContactId}:p:${prop}:t:${t}`;
  }

  const ident = `${(n.email ?? "").toLowerCase()}|${(n.phone ?? "").replace(/\D/g, "")}|${prop}|${t}`;
  if (n.email || n.phone) {
    return `ep:${createHash("sha256").update(ident).digest("hex").slice(0, 32)}`;
  }

  const normMsg = (n.messageBody ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `h:${createHash("sha256").update(`${accountId}|${normMsg}`).digest("hex").slice(0, 40)}`;
}
