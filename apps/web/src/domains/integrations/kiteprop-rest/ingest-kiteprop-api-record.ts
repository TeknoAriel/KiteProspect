/**
 * Ingresa un registro normalizado: Contact + Lead + Conversation + Message + LeadReplyDraftReview.
 * Idempotencia: source kiteprop_rest.
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { validateLeadCaptureFields } from "@/lib/capture-validation";
import { dispatchLeadCreated } from "@/jobs/dispatch";
import { buildKitepropRestIdempotencyKey } from "./kiteprop-import-dedup";
import { classifyKitepropChannel, toConversationChannel } from "./classify-kiteprop-channel";
import { resolvePropertyFromKitepropApiLead } from "./resolve-property-from-kiteprop-api-lead";
import { generateReplyDrafts } from "./generate-reply-drafts";
import { KITEPROP_REVIEW_STATUS } from "./kiteprop-review-status";
import type { NormalizedKitepropImport } from "./kiteprop-rest-types";

function mergeContactKitepropApiMetadata(
  existing: Prisma.JsonValue | null | undefined,
  raw: unknown,
): Prisma.InputJsonValue {
  const base =
    existing !== null && typeof existing === "object" && !Array.isArray(existing)
      ? ({ ...(existing as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  base.kitepropApi = {
    lastImportedAt: new Date().toISOString(),
    sourceSnapshot: raw,
  };
  return base as Prisma.InputJsonValue;
}

function validateImport(n: NormalizedKitepropImport): string | null {
  if (n.externalContactId?.trim()) {
    if (n.name !== undefined && n.name.length > 200) {
      return "El nombre no puede superar 200 caracteres";
    }
    if (n.messageBody !== undefined && n.messageBody.length > 8000) {
      return "El mensaje no puede superar 8000 caracteres";
    }
    return null;
  }
  return validateLeadCaptureFields({
    email: n.email,
    phone: n.phone,
    name: n.name,
    message: n.messageBody,
  });
}

export type IngestKitepropResult =
  | { outcome: "deduped" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "imported"; leadId: string; contactId: string };

export async function ingestKitepropApiRecord(
  accountId: string,
  n: NormalizedKitepropImport,
): Promise<IngestKitepropResult> {
  const idemKey = buildKitepropRestIdempotencyKey(accountId, n);

  const existingKey = await prisma.ingestionIdempotencyKey.findUnique({
    where: {
      accountId_source_key: {
        accountId,
        source: "kiteprop_rest",
        key: idemKey,
      },
    },
  });
  if (existingKey?.leadId && existingKey.contactId) {
    return { outcome: "deduped" };
  }

  const verr = validateImport(n);
  if (verr) {
    return { outcome: "skipped", reason: verr };
  }

  const classified = classifyKitepropChannel(n);
  const convChannel = toConversationChannel(classified.sourceChannel);
  const propRes = await resolvePropertyFromKitepropApiLead({
    accountId,
    propertyExternalId: n.propertyExternalId,
    propertyExternalSource: n.propertyExternalSource,
  });

  let propertyTitle: string | null = null;
  if (propRes.propertyId) {
    const p = await prisma.property.findUnique({
      where: { id: propRes.propertyId },
      select: { title: true },
    });
    propertyTitle = p?.title ?? null;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let contact = n.externalContactId
        ? await tx.contact.findFirst({
            where: {
              accountId,
              externalId: n.externalContactId,
            },
          })
        : null;

      if (!contact && (n.email || n.phone)) {
        const or: { email?: string; phone?: string }[] = [];
        if (n.email) or.push({ email: n.email.trim() });
        if (n.phone) or.push({ phone: n.phone.trim() });
        contact = await tx.contact.findFirst({
          where: { accountId, OR: or },
        });
      }

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            accountId,
            email: n.email?.trim() || null,
            phone: n.phone?.trim() || null,
            name: n.name?.trim() || null,
            externalId: n.externalContactId?.trim() || null,
            conversationalStage: "new",
            commercialStage: "exploratory",
            metadata: mergeContactKitepropApiMetadata(null, n.raw),
          },
        });
      } else {
        const data: Prisma.ContactUpdateInput = {};
        if (n.externalContactId && !contact.externalId) {
          data.externalId = n.externalContactId;
        }
        if (n.name && !contact.name) data.name = n.name.trim();
        data.metadata = mergeContactKitepropApiMetadata(contact.metadata, n.raw);
        contact = await tx.contact.update({
          where: { id: contact.id },
          data,
        });
      }

      await tx.lead.updateMany({
        where: {
          contactId: contact.id,
          status: { in: ["open", "qualified"] },
        },
        data: {
          status: "archived",
          archivedReason: "superseded_by_kiteprop_import",
        },
      });

      const lead = await tx.lead.create({
        data: {
          accountId,
          contactId: contact.id,
          status: "open",
          source: "kiteprop_api",
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          accountId,
          contactId: contact.id,
          leadId: lead.id,
          channel: convChannel,
          status: "active",
        },
      });

      if (n.messageBody?.trim()) {
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            direction: "inbound",
            content: n.messageBody.trim(),
            channel: convChannel,
            metadata: { kitepropImport: true } as Prisma.InputJsonValue,
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
          accountId,
          source: "kiteprop_rest",
          key: idemKey,
          contactId: contact.id,
          leadId: lead.id,
        },
      });

      const drafts = generateReplyDrafts({
        normalized: n,
        channel: classified,
        propertyTitle,
        contactName: contact.name,
      });

      const reviewStatus = drafts.manualReviewRequired
        ? KITEPROP_REVIEW_STATUS.MANUAL_REVIEW_REQUIRED
        : KITEPROP_REVIEW_STATUS.DRAFT_PENDING_REVIEW;

      await tx.leadReplyDraftReview.create({
        data: {
          accountId,
          leadId: lead.id,
          contactId: contact.id,
          reviewStatus,
          sourceChannel: classified.sourceChannel,
          sourcePortal: classified.sourcePortal,
          channelConfidence: classified.channelConfidence,
          externalPropertyRef: propRes.externalPropertyRef as Prisma.InputJsonValue,
          propertyId: propRes.propertyId,
          draftKind: drafts.draftKind,
          draftPayload: drafts.payload as Prisma.InputJsonValue,
          manualReviewRequired: drafts.manualReviewRequired,
        },
      });

      return { lead, contact, conversation };
    });

    void dispatchLeadCreated({
      accountId,
      contactId: result.contact.id,
      leadId: result.lead.id,
      event: "lead.created",
    }).catch(() => {});

    return {
      outcome: "imported",
      leadId: result.lead.id,
      contactId: result.contact.id,
    };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { outcome: "deduped" };
    }
    throw e;
  }
}
