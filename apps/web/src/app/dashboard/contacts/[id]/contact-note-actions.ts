"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const MAX_NOTE_LEN = 12_000;

export type AddContactNoteResult = { ok: true } | { ok: false; error: string };

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

  await prisma.note.create({
    data: {
      contactId,
      content: trimmed,
      authorId: session.user.id,
    },
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
