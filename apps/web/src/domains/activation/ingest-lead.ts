/**
 * Ingesta con idempotencia: Contact + Lead + Conversation + Message opcional.
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { validateLeadCaptureFields } from "@/lib/capture-validation";

export type IngestLeadInput = {
  accountId: string;
  branchId?: string | null;
  idempotencySource: "capture" | "wa_webhook" | "campaign_mock";
  idempotencyKey: string;
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
  channel: string;
  leadSource: string;
  campaignId?: string | null;
  /** Si true, crea consent email+whatsapp para cumplir Q6 en demos. */
  grantMarketingConsent?: boolean;
};

export type IngestLeadResult =
  | {
      ok: true;
      deduped: true;
      contactId: string;
      leadId: string;
      conversationId: string;
    }
  | {
      ok: true;
      deduped: false;
      contactId: string;
      leadId: string;
      conversationId: string;
    }
  | { ok: false; status: number; error: string };

export async function ingestLeadWithIdempotency(
  input: IngestLeadInput,
): Promise<IngestLeadResult> {
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

  const existing = await prisma.ingestionIdempotencyKey.findUnique({
    where: {
      accountId_source_key: {
        accountId: input.accountId,
        source: input.idempotencySource,
        key: input.idempotencyKey,
      },
    },
  });

  if (existing?.leadId && existing.contactId) {
    const conv = await prisma.conversation.findFirst({
      where: { leadId: existing.leadId },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      ok: true,
      deduped: true,
      contactId: existing.contactId,
      leadId: existing.leadId,
      conversationId: conv?.id ?? existing.leadId,
    };
  }

  const orConditions: { email?: string; phone?: string }[] = [];
  if (emailStr) orConditions.push({ email: emailStr });
  if (phoneStr) orConditions.push({ phone: phoneStr });

  if (orConditions.length === 0) {
    return { ok: false, status: 400, error: "Se requiere email o teléfono" };
  }

  let result: {
    contact: { id: string; conversationalStage: string; branchId: string | null };
    lead: { id: string };
    conversation: { id: string };
  };

  try {
    result = await prisma.$transaction(async (tx) => {
    let contact = await tx.contact.findFirst({
      where: {
        accountId: input.accountId,
        OR: orConditions,
      },
    });

    if (!contact) {
      contact = await tx.contact.create({
        data: {
          accountId: input.accountId,
          branchId: input.branchId ?? null,
          email: emailStr ?? null,
          phone: phoneStr ?? null,
          name: nameStr ?? null,
          conversationalStage: "new",
          commercialStage: "exploratory",
        },
      });
    } else {
      if (nameStr && !contact.name) {
        contact = await tx.contact.update({
          where: { id: contact.id },
          data: { name: nameStr },
        });
      }
      if (input.branchId && contact.branchId !== input.branchId) {
        contact = await tx.contact.update({
          where: { id: contact.id },
          data: { branchId: input.branchId },
        });
      }
    }

    await tx.lead.updateMany({
      where: {
        contactId: contact.id,
        status: { in: ["open", "qualified"] },
      },
      data: {
        status: "archived",
        archivedReason: "superseded_by_new_capture",
      },
    });

    const lead = await tx.lead.create({
      data: {
        accountId: input.accountId,
        contactId: contact.id,
        status: "open",
        source: input.leadSource,
        campaignId: input.campaignId ?? null,
      },
    });

    let conversation = await tx.conversation.findFirst({
      where: {
        accountId: input.accountId,
        contactId: contact.id,
        leadId: lead.id,
        channel: input.channel,
        status: "active",
      },
    });

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          accountId: input.accountId,
          contactId: contact.id,
          leadId: lead.id,
          channel: input.channel,
          status: "active",
        },
      });
    }

    if (messageStr) {
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          direction: "inbound",
          content: messageStr,
          channel: input.channel,
        },
      });
      if (contact.conversationalStage === "new") {
        await tx.contact.update({
          where: { id: contact.id },
          data: { conversationalStage: "answered" },
        });
      }
    }

    await tx.ingestionIdempotencyKey.create({
      data: {
        accountId: input.accountId,
        source: input.idempotencySource,
        key: input.idempotencyKey,
        contactId: contact.id,
        leadId: lead.id,
      },
    });

      return { contact, lead, conversation };
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const target = e.meta?.target;
      const t = Array.isArray(target) ? target.join(" ") : String(target ?? "");
      if (t.includes("IngestionIdempotencyKey")) {
        const again = await prisma.ingestionIdempotencyKey.findUnique({
          where: {
            accountId_source_key: {
              accountId: input.accountId,
              source: input.idempotencySource,
              key: input.idempotencyKey,
            },
          },
        });
        if (again?.leadId && again.contactId) {
          const conv = await prisma.conversation.findFirst({
            where: { leadId: again.leadId },
            select: { id: true },
            orderBy: { createdAt: "desc" },
          });
          return {
            ok: true,
            deduped: true,
            contactId: again.contactId,
            leadId: again.leadId,
            conversationId: conv?.id ?? again.leadId,
          };
        }
      }
    }
    throw e;
  }

  const { contact, lead, conversation } = result;

  if (input.grantMarketingConsent) {
    await prisma.$transaction(async (tx) => {
      for (const channel of ["email", "whatsapp"] as const) {
        const existingC = await tx.consent.findFirst({
          where: { contactId: contact.id, channel },
        });
        if (existingC) {
          await tx.consent.update({
            where: { id: existingC.id },
            data: { granted: true, grantedAt: new Date(), revokedAt: null },
          });
        } else {
          await tx.consent.create({
            data: {
              contactId: contact.id,
              channel,
              granted: true,
              grantedAt: new Date(),
              purpose: "marketing",
            },
          });
        }
      }
    });
  }

  const chStateKey = input.channel === "whatsapp" ? "whatsapp" : "email";
  await prisma.channelState.upsert({
    where: {
      accountId_contactId_channel: {
        accountId: input.accountId,
        contactId: contact.id,
        channel: chStateKey,
      },
    },
    create: {
      accountId: input.accountId,
      contactId: contact.id,
      channel: chStateKey,
      lastInboundAt: messageStr ? new Date() : null,
    },
    update: {
      lastInboundAt: messageStr ? new Date() : undefined,
    },
  });

  return {
    ok: true,
    deduped: false,
    contactId: contact.id,
    leadId: lead.id,
    conversationId: conversation.id,
  };
}
