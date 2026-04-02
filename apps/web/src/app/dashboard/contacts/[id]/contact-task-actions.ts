"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { revalidatePath } from "next/cache";

const MAX_TITLE = 500;
const MAX_DESC = 8_000;

const TASK_TYPES = ["call", "visit", "followup", "other"] as const;
export type ContactTaskType = (typeof TASK_TYPES)[number];

const TASK_STATUSES = ["pending", "completed", "cancelled"] as const;
export type ContactTaskStatus = (typeof TASK_STATUSES)[number];

export type AddContactTaskResult = { ok: true } | { ok: false; error: string };
export type UpdateContactTaskResult = { ok: true } | { ok: false; error: string };

function isValidTaskType(t: string): t is ContactTaskType {
  return (TASK_TYPES as readonly string[]).includes(t);
}

function isValidTaskStatus(s: string): s is ContactTaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(s);
}

async function assertTaskInTenant(taskId: string, accountId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: { contact: { select: { accountId: true, id: true } } },
  });
  if (!task || task.contact.accountId !== accountId) {
    return null;
  }
  return task;
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

  const created = await prisma.task.create({
    data: {
      contactId,
      title,
      description,
      type,
      status: "pending",
      dueAt,
    },
    select: { id: true },
  });

  logStructured("crm_task_created", {
    accountId: session.user.accountId,
    contactId,
    taskId: created.id,
    taskType: type,
    hasDue: Boolean(dueAt),
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

export async function updateContactTaskAction(
  taskId: string,
  input: {
    title: string;
    description?: string;
    type: string;
    dueAtIso?: string | null;
    status: string;
  },
): Promise<UpdateContactTaskResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const task = await assertTaskInTenant(taskId, session.user.accountId);
  if (!task) {
    return { ok: false, error: "Tarea no encontrada." };
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

  const status = input.status.trim();
  if (!isValidTaskStatus(status)) {
    return { ok: false, error: "Estado no válido." };
  }

  let description: string | null = null;
  if (input.description != null && input.description.trim() !== "") {
    const d = input.description.trim();
    if (d.length > MAX_DESC) {
      return { ok: false, error: `La descripción no puede superar ${MAX_DESC} caracteres.` };
    }
    description = d;
  }

  let dueAt: Date | null = null;
  if (input.dueAtIso && input.dueAtIso.trim() !== "") {
    const parsed = new Date(input.dueAtIso);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Fecha de vencimiento no válida." };
    }
    dueAt = parsed;
  }

  const completedAt = status === "completed" ? (task.completedAt ?? new Date()) : null;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      type,
      status,
      dueAt,
      completedAt,
    },
  });

  logStructured("crm_task_updated", {
    accountId: session.user.accountId,
    contactId: task.contactId,
    taskId,
    taskType: type,
    status,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: task.contactId,
      action: "contact_task_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { type, status },
    });
  } catch (e) {
    console.error("[audit] contact_task_updated", e);
  }

  revalidatePath(`/dashboard/contacts/${task.contactId}`);
  return { ok: true };
}

export async function completeContactTaskAction(taskId: string): Promise<UpdateContactTaskResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const task = await assertTaskInTenant(taskId, session.user.accountId);
  if (!task) {
    return { ok: false, error: "Tarea no encontrada." };
  }

  if (task.status !== "pending") {
    return { ok: false, error: "La tarea ya no está pendiente." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  logStructured("crm_task_completed", {
    accountId: session.user.accountId,
    contactId: task.contactId,
    taskId,
    taskType: task.type,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: task.contactId,
      action: "contact_task_completed",
      actorType: "user",
      actorId: session.user.id,
      metadata: { type: task.type },
    });
  } catch (e) {
    console.error("[audit] contact_task_completed", e);
  }

  revalidatePath(`/dashboard/contacts/${task.contactId}`);
  return { ok: true };
}
