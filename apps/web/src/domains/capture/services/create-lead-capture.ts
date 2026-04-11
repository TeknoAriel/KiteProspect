/**
 * Creación de contacto + conversación + mensaje (captura omnicanal).
 * Usado por POST /api/contacts/create y por el formulario público /lead.
 */
import { prisma } from "@kite-prospect/db";
import { validateLeadCaptureFields } from "@/lib/capture-validation";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { emitAccountWebhooks } from "@/domains/integrations/services/emit-account-webhooks";

const ALLOWED_CHANNELS = new Set([
  "web_widget",
  "landing",
  "whatsapp",
  "form",
  "meta_lead",
]);

export type LeadCaptureSource = "api" | "public_form";

export type CreateLeadCaptureInput = {
  accountSlug?: string;
  accountId?: string;
  /** Opcional: sucursal por slug (F3-E4). Si no existe, se ignora. */
  branchSlug?: string;
  email?: string;
  phone?: string;
  name?: string;
  channel?: string;
  message?: string;
  source: LeadCaptureSource;
};

export type CreateLeadCaptureResult =
  | { ok: true; contactId: string; conversationId: string }
  | { ok: false; status: number; error: string };

export async function createLeadCapture(
  input: CreateLeadCaptureInput,
): Promise<CreateLeadCaptureResult> {
  const channel =
    typeof input.channel === "string" && ALLOWED_CHANNELS.has(input.channel)
      ? input.channel
      : "form";

  const emailStr =
    typeof input.email === "string" ? input.email.trim() || undefined : undefined;
  const phoneStr =
    typeof input.phone === "string" ? input.phone.trim() || undefined : undefined;
  const nameStr =
    typeof input.name === "string" ? input.name.trim() || undefined : undefined;
  const messageStr =
    typeof input.message === "string" ? input.message.trim() || undefined : undefined;

  const validationError = validateLeadCaptureFields({
    email: emailStr,
    phone: phoneStr,
    name: nameStr,
    message: messageStr,
  });
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  let accountId: string | undefined;

  if (typeof input.accountSlug === "string" && input.accountSlug.trim()) {
    const acc = await prisma.account.findUnique({
      where: { slug: input.accountSlug.trim() },
      select: { id: true },
    });
    if (!acc) {
      return { ok: false, status: 404, error: "Cuenta no encontrada" };
    }
    accountId = acc.id;
  } else if (typeof input.accountId === "string" && input.accountId.trim()) {
    const acc = await prisma.account.findUnique({
      where: { id: input.accountId.trim() },
      select: { id: true },
    });
    if (!acc) {
      return { ok: false, status: 404, error: "Cuenta no encontrada" };
    }
    accountId = acc.id;
  } else {
    return { ok: false, status: 400, error: "Se requiere accountSlug o accountId" };
  }

  let branchId: string | undefined;
  const branchSlugRaw =
    typeof input.branchSlug === "string" ? input.branchSlug.trim().toLowerCase() : "";
  if (branchSlugRaw) {
    const br = await prisma.branch.findFirst({
      where: {
        accountId,
        slug: branchSlugRaw,
        status: "active",
      },
      select: { id: true },
    });
    if (br) branchId = br.id;
  }

  const orConditions: { email?: string; phone?: string }[] = [];
  if (emailStr) orConditions.push({ email: emailStr });
  if (phoneStr) orConditions.push({ phone: phoneStr });

  let contact = await prisma.contact.findFirst({
    where: {
      accountId,
      OR: orConditions,
    },
  });

  let createdNewContact = false;
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        accountId,
        branchId: branchId ?? null,
        email: emailStr ?? null,
        phone: phoneStr ?? null,
        name: nameStr ?? null,
        conversationalStage: "new",
        commercialStage: "exploratory",
      },
    });
    createdNewContact = true;
  } else {
    if (nameStr && !contact.name) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { name: nameStr },
      });
      contact = { ...contact, name: nameStr };
    }
    if (branchId && contact.branchId !== branchId) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { branchId },
      });
      contact = { ...contact, branchId };
    }
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      accountId,
      contactId: contact.id,
      channel,
      status: "active",
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        accountId,
        contactId: contact.id,
        channel,
        status: "active",
      },
    });
  }

  if (messageStr) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        content: messageStr,
        channel,
      },
    });

    if (contact.conversationalStage === "new") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { conversationalStage: "answered" },
      });
    }
  }

  const via =
    input.source === "public_form" ? "public_lead_form" : "api_contacts_create";

  try {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contact.id,
      action: "lead_captured",
      actorType: "integration",
      metadata: {
        channel,
        conversationId: conversation.id,
        via,
      },
    });
  } catch (e) {
    console.error("[audit] lead_captured failed", e);
  }

  logStructured("lead_captured", {
    accountId,
    contactId: contact.id,
    channel,
    newContact: createdNewContact,
    hasInboundMessage: Boolean(messageStr),
    source: input.source === "public_form" ? "public_form" : "api",
  });

  void emitAccountWebhooks({
    accountId,
    event: "lead.captured",
    data: {
      contactId: contact.id,
      conversationId: conversation.id,
      channel,
      isNewContact: createdNewContact,
      source: input.source === "public_form" ? "public_form" : "api",
    },
  }).catch((e) => console.error("[webhook] lead.captured", e));

  return {
    ok: true,
    contactId: contact.id,
    conversationId: conversation.id,
  };
}
