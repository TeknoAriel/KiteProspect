"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const MAX_TITLE = 500;
const MAX_DESC = 8_000;

const TASK_TYPES = ["call", "visit", "followup", "other"] as const;
export type ContactTaskType = (typeof TASK_TYPES)[number];

export type AddContactTaskResult = { ok: true } | { ok: false; error: string };

function isValidTaskType(t: string): t is ContactTaskType {
  return (TASK_TYPES as readonly string[]).includes(t);
}

export async function addContactTaskAction(
  contactId: string,
  input: {
    title: string;
    description?: string;
    type: string;
    dueAtIso?: string | null;
  },
): Promise<AddContactTaskResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "El título es obligatorio." };
  }
  if (title.length > MAX_TITLE) {
    return { ok: false, error: `El título no puede superar ${MAX_TITLE} caracteres.` };
  }

  const type = input.type.trim();
  if (!isValidTaskType(type)) {
    return { ok: false, error: "Tipo de tarea no válido." };
  }

  let description: string | undefined;
  if (input.description != null && input.description.trim() !== "") {
    const d = input.description.trim();
    if (d.length > MAX_DESC) {
      return { ok: false, error: `La descripción no puede superar ${MAX_DESC} caracteres.` };
    }
    description = d;
  }

  let dueAt: Date | undefined;
  if (input.dueAtIso && input.dueAtIso.trim() !== "") {
    const parsed = new Date(input.dueAtIso);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Fecha de vencimiento no válida." };
    }
    dueAt = parsed;
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId: session.user.accountId },
    select: { id: true },
  });
  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  await prisma.task.create({
    data: {
      contactId,
      title,
      description,
      type,
      status: "pending",
      dueAt,
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_task_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { type, hasDue: Boolean(dueAt) },
    });
  } catch (e) {
    console.error("[audit] contact_task_created", e);
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}
