import { createHash, createHmac, randomUUID } from "node:crypto";

export type LeadQualifiedPayload = {
  event: "lead.qualified";
  event_id: string;
  schema_version: number;
  occurred_at: string;
  dedupe_key: string;
  tenant: { account_id: string; slug?: string };
  contact: {
    id: string;
    external_id: string | null;
    phone_e164: string | null;
    email: string | null;
    name: string | null;
  };
  lead: {
    id: string;
    source: string;
    scores: {
      intent: number;
      readiness: number;
      fit: number;
      engagement: number;
      total: number;
    };
    search_profile_summary: Record<string, unknown>;
  };
  qualification: {
    source: "rule" | "manual";
    manual_override: boolean;
    criteria?: unknown;
  };
};

export function buildDedupeKey(accountId: string, leadId: string): string {
  const raw = `${accountId}:${leadId}:qualified_v1`;
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Mismo `event_id` en todos los reintentos HTTP para el mismo dedupe (cuerpo estable salvo timestamps si se excluyen).
 * Formato UUID v4-like derivado del hash (estable por dedupe_key).
 */
export function deterministicEventIdForDedupe(dedupeKey: string): string {
  const h = createHash("sha256").update(`event_id:${dedupeKey}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Para pruebas o correlación adicional (no sustituye dedupe_key). */
export function randomHandoffEventId(): string {
  return randomUUID();
}

/** Timestamp ISO estable por dedupe (reintentos HTTP con mismo cuerpo lógico y misma firma). */
export function deterministicOccurredAtIso(dedupeKey: string): string {
  const n = parseInt(dedupeKey.slice(0, 12), 16) || 0;
  const ms = (n % 2_000_000_000_000) + 1_000_000_000_000;
  return new Date(ms).toISOString();
}

export function signHandoffBody(
  bodyJson: string,
  signingSecret: string,
): string {
  const h = createHmac("sha256", signingSecret);
  h.update(bodyJson);
  return `sha256=${h.digest("hex")}`;
}

/** Secreto HMAC global (y mock local si no hay env). */
export function resolveHandoffSigningSecret(): string {
  return (
    process.env.KITEPROP_HANDOFF_HMAC_SECRET?.trim() ||
    process.env.KITEPROP_HANDOFF_SIGNING_SECRET?.trim() ||
    "dev-handoff-secret-demo"
  );
}

/** Override por cuenta: `KITEPROP_HANDOFF_HMAC_SECRET_<SLUG_UPPER>`. */
export function resolveHandoffSigningSecretForAccount(accountSlug: string): string {
  const key = `KITEPROP_HANDOFF_HMAC_SECRET_${accountSlug
    .toUpperCase()
    .replace(/-/g, "_")}`;
  const fromEnv = process.env[key]?.trim();
  if (fromEnv) return fromEnv;
  return resolveHandoffSigningSecret();
}
