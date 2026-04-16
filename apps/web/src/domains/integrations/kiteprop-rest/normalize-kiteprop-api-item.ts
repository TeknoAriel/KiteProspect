import type { NormalizedKitepropImport } from "./kiteprop-rest-types";

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** IDs numéricos o string (respuestas REST típicas de KiteProp). */
function pickIdStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function pickNestedString(obj: unknown, path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" && cur.trim() ? cur.trim() : undefined;
}

function pickDate(obj: Record<string, unknown>, keys: string[]): Date | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
    if (typeof v === "string" || typeof v === "number") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}

/**
 * Intenta mapear un ítem JSON arbitrario al contrato interno.
 * Ampliar `pickStr` / rutas solo con **muestras reales** del payload KiteProp (no inventar campos).
 * Si no alcanza para armar lead/contacto, el ítem puede filtrarse (null) o requerir revisión manual tras ajustar el mapeo.
 */
export function normalizeKitepropApiItem(raw: unknown): NormalizedKitepropImport | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const contact =
    typeof o.contact === "object" && o.contact !== null
      ? (o.contact as Record<string, unknown>)
      : undefined;
  const message =
    typeof o.message === "object" && o.message !== null
      ? (o.message as Record<string, unknown>)
      : undefined;
  const property =
    typeof o.property === "object" && o.property !== null
      ? (o.property as Record<string, unknown>)
      : undefined;

  const externalLeadId = pickIdStr(o, ["id", "lead_id", "leadId", "external_id"]);
  const externalMessageId = message
    ? pickIdStr(message, ["id", "message_id", "messageId"])
    : pickIdStr(o, ["message_id", "messageId"]);
  const externalContactId = contact
    ? pickIdStr(contact, ["id", "contact_id", "contactId", "external_id"])
    : pickIdStr(o, ["contact_id", "contactId"]);

  const email =
    pickNestedString(raw, ["contact", "email"]) ??
    pickStr(o, ["email", "contact_email"]);
  const phone =
    pickNestedString(raw, ["contact", "phone"]) ??
    pickStr(o, ["phone", "phone_e164", "mobile"]);
  const firstName = pickNestedString(raw, ["contact", "first_name"]) ?? pickStr(o, ["first_name", "firstName"]);
  const lastName = pickNestedString(raw, ["contact", "last_name"]) ?? pickStr(o, ["last_name", "lastName"]);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const name =
    (combinedName || undefined) ??
    pickNestedString(raw, ["contact", "name"]) ??
    pickStr(o, ["name", "full_name"]);

  const messageBody =
    (message && pickStr(message, ["body", "text", "content", "message"])) ||
    pickStr(o, ["body", "text", "content", "message", "last_message", "summary"]);

  const occurredAt =
    pickDate(o, ["created_at", "updated_at", "occurred_at", "date"]) ??
    (message ? pickDate(message, ["created_at", "sent_at"]) : undefined) ??
    new Date();

  const propertyExternalId =
    property?.id != null
      ? String(property.id)
      : pickIdStr(o, ["property_id", "propertyId"]) ??
        pickNestedString(raw, ["property", "external_id"]);

  const channelRaw =
    pickStr(o, ["channel", "source_channel", "medium"]) ||
    pickNestedString(raw, ["meta", "channel"]);
  const portalRaw = pickStr(o, ["portal", "source_portal", "site"]) || undefined;

  if (
    !externalLeadId &&
    !externalMessageId &&
    !email &&
    !phone &&
    !externalContactId
  ) {
    return null;
  }

  return {
    externalLeadId,
    externalMessageId,
    externalContactId,
    email,
    phone,
    name,
    messageBody,
    occurredAt,
    propertyExternalId: propertyExternalId ?? undefined,
    propertyExternalSource: property ? pickStr(property, ["source"]) : undefined,
    channelRaw,
    portalRaw,
    raw,
  };
}
