/**
 * Sincronización inbound por lotes desde CRM o middleware (F3-E1+ / L22b).
 * No llama a sistemas externos: el cliente empuja cambios autorizados por tenant.
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { emitAccountWebhooks } from "@/domains/integrations/services/emit-account-webhooks";
import { findContactExternalIdConflict } from "@/domains/crm-leads/contact-external-id-conflict";
import { normalizeContactExternalId } from "@/domains/crm-leads/contact-external-id";
import {
  isCommercialStage,
  isConversationalStage,
} from "@/domains/crm-leads/contact-stage-constants";

export const CRM_BATCH_SYNC_MAX_ITEMS = 100;

export type CrmBatchSyncActor =
  | { type: "user"; userId: string }
  | { type: "integration" };

export type CrmBatchSyncItemResult =
  | {
      contactId: string;
      status: "ok";
      changed: {
        externalId?: boolean;
        stages?: boolean;
        branch?: boolean;
      };
    }
  | { contactId: string; status: "error"; error: string };

export type CrmBatchSyncRawItem = Record<string, unknown>;

export type ParsedCrmBatchSyncItem = {
  contactId: string;
  setExternalId: boolean;
  externalId: string | null;
  commercialStage?: string;
  conversationalStage?: string;
  setBranchId: boolean;
  branchId: string | null;
  branchSlug?: string;
};

export function parseCrmBatchSyncItem(raw: unknown): { ok: true; value: ParsedCrmBatchSyncItem } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Cada ítem debe ser un objeto" };
  }
  const o = raw as CrmBatchSyncRawItem;
  const contactId = typeof o.contactId === "string" ? o.contactId.trim() : "";
  if (!contactId) {
    return { ok: false, error: "contactId es obligatorio" };
  }

  let setExternalId = false;
  let externalId: string | null = null;
  if (Object.prototype.hasOwnProperty.call(o, "externalId")) {
    setExternalId = true;
    const n = normalizeContactExternalId(o.externalId);
    if (!n.ok) {
      return { ok: false, error: n.error };
    }
    externalId = n.value;
  }

  let commercialStage: string | undefined;
  if (o.commercialStage !== undefined) {
    if (typeof o.commercialStage !== "string" || !isCommercialStage(o.commercialStage)) {
      return { ok: false, error: "commercialStage inválido" };
    }
    commercialStage = o.commercialStage;
  }

  let conversationalStage: string | undefined;
  if (o.conversationalStage !== undefined) {
    if (typeof o.conversationalStage !== "string" || !isConversationalStage(o.conversationalStage)) {
      return { ok: false, error: "conversationalStage inválido" };
    }
    conversationalStage = o.conversationalStage;
  }

  const hasBranchIdKey = Object.prototype.hasOwnProperty.call(o, "branchId");
  let setBranchId = false;
  let branchId: string | null = null;
  if (hasBranchIdKey) {
    setBranchId = true;
    const br = o.branchId;
    if (br === null) {
      branchId = null;
    } else if (typeof br === "string" && br.trim()) {
      branchId = br.trim();
    } else {
      return { ok: false, error: "branchId inválido" };
    }
  }

  const branchSlug =
    typeof o.branchSlug === "string" && o.branchSlug.trim() ? o.branchSlug.trim() : undefined;

  const hasPatch =
    setExternalId ||
    commercialStage !== undefined ||
    conversationalStage !== undefined ||
    setBranchId ||
    (!setBranchId && branchSlug !== undefined);

  if (!hasPatch) {
    return { ok: false, error: "Nada que actualizar en el ítem" };
  }

  if (setBranchId && branchSlug !== undefined) {
    // branchId explícito gana; ignoramos branchSlug (evita ambigüedad silenciosa).
  }

  return {
    ok: true,
    value: {
      contactId,
      setExternalId,
      externalId,
      commercialStage,
      conversationalStage,
      setBranchId,
      branchId,
      branchSlug: setBranchId ? undefined : branchSlug,
    },
  };
}

export async function applyCrmBatchSyncItem(params: {
  accountId: string;
  item: ParsedCrmBatchSyncItem;
  actor: CrmBatchSyncActor;
}): Promise<CrmBatchSyncItemResult> {
  const { accountId, item, actor } = params;
  const { contactId } = item;

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: {
      id: true,
      externalId: true,
      commercialStage: true,
      conversationalStage: true,
      branchId: true,
    },
  });
  if (!existing) {
    return { contactId, status: "error", error: "Contacto no encontrado" };
  }

  const data: Prisma.ContactUncheckedUpdateInput = {};
  const changed: { externalId?: boolean; stages?: boolean; branch?: boolean } = {};

  if (item.setExternalId) {
    if (existing.externalId !== item.externalId) {
      const conflict = await findContactExternalIdConflict({
        accountId,
        contactId,
        nextExternalId: item.externalId,
      });
      if (conflict) {
        return {
          contactId,
          status: "error",
          error: "Conflicto de externalId en la cuenta",
        };
      }
      data.externalId = item.externalId;
      changed.externalId = true;
    }
  }

  let stagesTouched = false;
  if (item.commercialStage !== undefined && item.commercialStage !== existing.commercialStage) {
    data.commercialStage = item.commercialStage;
    stagesTouched = true;
  }
  if (item.conversationalStage !== undefined && item.conversationalStage !== existing.conversationalStage) {
    data.conversationalStage = item.conversationalStage;
    stagesTouched = true;
  }
  if (stagesTouched) {
    changed.stages = true;
  }

  let resolvedBranchId: string | null | undefined;
  if (item.setBranchId) {
    if (item.branchId === null) {
      resolvedBranchId = null;
    } else {
      const found = await prisma.branch.findFirst({
        where: {
          id: item.branchId!,
          accountId,
          status: "active",
        },
        select: { id: true },
      });
      if (!found) {
        return { contactId, status: "error", error: "Sucursal no válida para esta cuenta" };
      }
      resolvedBranchId = found.id;
    }
  } else if (item.branchSlug !== undefined) {
    const found = await prisma.branch.findFirst({
      where: {
        accountId,
        slug: item.branchSlug,
        status: "active",
      },
      select: { id: true },
    });
    if (!found) {
      return { contactId, status: "error", error: "branchSlug no válido para esta cuenta" };
    }
    resolvedBranchId = found.id;
  }

  if (resolvedBranchId !== undefined && resolvedBranchId !== existing.branchId) {
    data.branchId = resolvedBranchId;
    changed.branch = true;
  }

  const hasData = Object.keys(data).length > 0;
  if (!hasData) {
    return {
      contactId,
      status: "ok",
      changed: {},
    };
  }

  const actorId = actor.type === "user" ? actor.userId : undefined;
  const actorType = actor.type === "user" ? "user" : "integration";

  let updated: {
    id: string;
    externalId: string | null;
    commercialStage: string;
    conversationalStage: string;
    branchId: string | null;
  };
  try {
    updated = await prisma.contact.update({
      where: { id: contactId },
      data,
      select: {
        id: true,
        externalId: true,
        commercialStage: true,
        conversationalStage: true,
        branchId: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { contactId, status: "error", error: "Conflicto de externalId (duplicado en la cuenta)" };
    }
    throw e;
  }

  if (changed.externalId) {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_external_id_updated",
      actorId,
      actorType,
      changes: {
        before: { externalId: existing.externalId },
        after: { externalId: updated.externalId },
      },
    });
    void emitAccountWebhooks({
      accountId,
      event: "contact.external_id_updated",
      data: {
        contactId,
        externalIdBefore: existing.externalId,
        externalIdAfter: updated.externalId,
      },
    }).catch((err) => console.error("[webhook] contact.external_id_updated", err));
  }

  if (changed.stages) {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_stages_updated",
      actorId,
      actorType,
      changes: {
        before: {
          commercialStage: existing.commercialStage,
          conversationalStage: existing.conversationalStage,
        },
        after: {
          commercialStage: updated.commercialStage,
          conversationalStage: updated.conversationalStage,
        },
      },
    });
    void emitAccountWebhooks({
      accountId,
      event: "contact.stages_updated",
      data: {
        contactId,
        before: {
          commercialStage: existing.commercialStage,
          conversationalStage: existing.conversationalStage,
        },
        after: {
          commercialStage: updated.commercialStage,
          conversationalStage: updated.conversationalStage,
        },
      },
    }).catch((err) => console.error("[webhook] contact.stages_updated", err));
  }

  if (changed.branch) {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_branch_updated",
      actorId,
      actorType,
      changes: {
        before: { branchId: existing.branchId },
        after: { branchId: updated.branchId },
      },
    });
  }

  return { contactId, status: "ok", changed };
}
