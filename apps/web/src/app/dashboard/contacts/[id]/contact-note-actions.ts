"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { revalidatePath } from "next/cache";

const MAX_NOTE_LEN = 12_000;

export type AddContactNoteResult = { ok: true } | { ok: false; error: string };
export type UpdateContactNoteResult = { ok: true } | { ok: false; error: string };

async function assertNoteInTenant(noteId: string, accountId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId },
    include: { contact: { select: { accountId: true, id: true } } },
  });
  if (!note || note.contact.accountId !== accountId) {
    return null;
  }
  return note;
}

export async function addContactNoteAction(
  contactId: string,
  content: string,
): Promise<AddContactNoteResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "La nota no puede estar vacía." };
  }
  if (trimmed.length > MAX_NOTE_LEN) {
    return { ok: false, error: `La nota no puede superar ${MAX_NOTE_LEN} caracteres.` };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId: session.user.accountId },
    select: { id: true },
  });
  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  const created = await prisma.note.create({
    data: {
      contactId,
      content: trimmed,
      authorId: session.user.id,
    },
    select: { id: true },
  });

  logStructured("crm_note_created", {
    accountId: session.user.accountId,
    contactId,
    noteId: created.id,
    contentLength: trimmed.length,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: contactId,
      action: "contact_note_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { length: trimmed.length },
    });
  } catch (e) {
    console.error("[audit] contact_note_created", e);
  }

  revalidatePath(`/dashboard/contacts/${contactId}`);
  return { ok: true };
}

export async function updateContactNoteAction(
  noteId: string,
  content: string,
): Promise<UpdateContactNoteResult> {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return { ok: false, error: "No autorizado." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "La nota no puede estar vacía." };
  }
  if (trimmed.length > MAX_NOTE_LEN) {
    return { ok: false, error: `La nota no puede superar ${MAX_NOTE_LEN} caracteres.` };
  }

  const note = await assertNoteInTenant(noteId, session.user.accountId);
  if (!note) {
    return { ok: false, error: "Nota no encontrada." };
  }

  await prisma.note.update({
    where: { id: noteId },
    data: { content: trimmed },
  });

  logStructured("crm_note_updated", {
    accountId: session.user.accountId,
    contactId: note.contactId,
    noteId,
    contentLength: trimmed.length,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "contact",
      entityId: note.contactId,
      action: "contact_note_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { length: trimmed.length },
    });
  } catch (e) {
    console.error("[audit] contact_note_updated", e);
  }

  revalidatePath(`/dashboard/contacts/${note.contactId}`);
  return { ok: true };
}
