"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { revalidatePath } from "next/cache";
import {
  upsertDeclaredSearchProfile,
  type DeclaredSearchProfileFields,
} from "@/domains/crm-leads/services/update-profile";

const MAX_ZONE = 300;
const MAX_INTENT = 80;
const MAX_PROP_TYPE = 80;

export type UpdateDeclaredSearchProfileResult =
  | { ok: true }
  | { ok: false; error: string };

function parseOptionalInt(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0 || n > 50) return null;
  return n;
}

function parseOptionalNumber(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function trimField(
  raw: unknown,
  max: number,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = String(raw ?? "").trim();
  if (s === "") return { ok: true, value: null };
  if (s.length > max) {
    return { ok: false, error: `${label}: máximo ${max} caracteres.` };
  }
  return { ok: true, value: s };
}

export async function updateDeclaredSearchProfileAction(
  contactId: string,
  formData: FormData,
): Promise<UpdateDeclaredSearchProfileResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId: session.user.accountId },
    select: { id: true },
  });
  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  const intentR = trimField(formData.get("intent"), MAX_INTENT, "Intención");
  if (!intentR.ok) return intentR;
  const intent = intentR.value;

  const propertyTypeR = trimField(formData.get("propertyType"), MAX_PROP_TYPE, "Tipo de propiedad");
  if (!propertyTypeR.ok) return propertyTypeR;
  const propertyType = propertyTypeR.value;

  const zoneR = trimField(formData.get("zone"), MAX_ZONE, "Zona");
  if (!zoneR.ok) return zoneR;
  const zone = zoneR.value;

  const minPrice = parseOptionalNumber(formData.get("minPrice"));
  const maxPrice = parseOptionalNumber(formData.get("maxPrice"));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { ok: false, error: "El precio mínimo no puede ser mayor que el máximo." };
  }

  const bedrooms = parseOptionalInt(formData.get("bedrooms"));
  const bathrooms = parseOptionalInt(formData.get("bathrooms"));

  let extra: Record<string, unknown> | null = null;
  const extraRaw = String(formData.get("extraJson") ?? "").trim();
  if (extraRaw) {
    try {
      const parsed: unknown = JSON.parse(extraRaw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        extra = parsed as Record<string, unknown>;
      } else {
        return { ok: false, error: "Requisitos adicionales: el JSON debe ser un objeto." };
      }
    } catch {
      return { ok: false, error: "Requisitos adicionales: JSON inválido." };
    }
  }

  const fields: DeclaredSearchProfileFields = {
    intent,
    propertyType,
    zone,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    extra,
  };

  await upsertDeclaredSearchProfile(contactId, fields);

  logStructured("contact_search_profile_declared_saved", {
    accountId: session.user.accountId,
    contactId,
    hasIntent: Boolean(intent),
    hasZone: Boolean(zone),
    hasPriceRange: minPrice != null || maxPrice != null,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_search_profile_declared_saved",
      actorType: "user",
      actorId: session.user.id,
      metadata: {
        hasIntent: Boolean(intent),
        hasZone: Boolean(zone),
        hasPriceRange: minPrice != null || maxPrice != null,
      },
    });
  } catch (e) {
    console.error("[audit] contact_search_profile_declared_saved", e);
  }

  revalidatePath(`/dashboard/contacts/${contactId}/profile`);
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}
