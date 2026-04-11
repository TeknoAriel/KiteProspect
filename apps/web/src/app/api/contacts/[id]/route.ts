/**
 * Actualización de etapas del contacto y sucursal (F1-E13, F3-E4). Admin / coordinador.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import {
  isCommercialStage,
  isConversationalStage,
} from "@/domains/crm-leads/contact-stage-constants";
import { emitAccountWebhooks } from "@/domains/integrations/services/emit-account-webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id: contactId } = await context.params;
  const accountId = session.user.accountId;

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: {
      id: true,
      commercialStage: true,
      conversationalStage: true,
      branchId: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const commercialRaw = o.commercialStage;
  const conversationalRaw = o.conversationalStage;

  const patch: {
    commercialStage?: string;
    conversationalStage?: string;
    branchId?: string | null;
  } = {};

  if (commercialRaw !== undefined) {
    if (typeof commercialRaw !== "string" || !isCommercialStage(commercialRaw)) {
      return NextResponse.json({ error: "commercialStage inválido" }, { status: 400 });
    }
    patch.commercialStage = commercialRaw;
  }
  if (conversationalRaw !== undefined) {
    if (typeof conversationalRaw !== "string" || !isConversationalStage(conversationalRaw)) {
      return NextResponse.json({ error: "conversationalStage inválido" }, { status: 400 });
    }
    patch.conversationalStage = conversationalRaw;
  }

  const hasBranchKey = Object.prototype.hasOwnProperty.call(o, "branchId");
  if (hasBranchKey) {
    const br = o.branchId;
    if (br === null) {
      patch.branchId = null;
    } else if (typeof br === "string" && br.trim()) {
      const found = await prisma.branch.findFirst({
        where: {
          id: br.trim(),
          accountId,
          status: "active",
        },
        select: { id: true },
      });
      if (!found) {
        return NextResponse.json({ error: "Sucursal no válida para esta cuenta" }, { status: 400 });
      }
      patch.branchId = found.id;
    } else {
      return NextResponse.json({ error: "branchId inválido" }, { status: 400 });
    }
  }

  const hasStagePatch = commercialRaw !== undefined || conversationalRaw !== undefined;
  const hasBranchPatch = hasBranchKey;
  if (!hasStagePatch && !hasBranchPatch) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: patch,
    select: {
      id: true,
      commercialStage: true,
      conversationalStage: true,
      branchId: true,
    },
  });

  if (patch.commercialStage !== undefined || patch.conversationalStage !== undefined) {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_stages_updated",
      actorId: session.user.id,
      actorType: "user",
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

    const commercialChanged =
      patch.commercialStage !== undefined &&
      updated.commercialStage !== existing.commercialStage;
    const conversationalChanged =
      patch.conversationalStage !== undefined &&
      updated.conversationalStage !== existing.conversationalStage;
    if (commercialChanged || conversationalChanged) {
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
      }).catch((e) => console.error("[webhook] contact.stages_updated", e));
    }
  }

  if (hasBranchPatch) {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_branch_updated",
      actorId: session.user.id,
      actorType: "user",
      changes: {
        before: { branchId: existing.branchId },
        after: { branchId: updated.branchId },
      },
    });
  }

  logStructured("contact_patched", {
    accountId,
    contactId,
    commercialChanged: patch.commercialStage !== undefined,
    conversationalChanged: patch.conversationalStage !== undefined,
    branchChanged: hasBranchPatch,
  });

  return NextResponse.json({ ok: true, contact: updated });
}
