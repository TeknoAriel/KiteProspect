import { prisma } from "@kite-prospect/db";
import type { IngestionJobPayload } from "../job-payloads";
import { dispatchScoring } from "../dispatch";

export async function processIngestionJob(
  payload: IngestionJobPayload,
): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      accountId: payload.accountId,
      entityType: "lead",
      entityId: payload.leadId,
      action: "lead_created_event",
      actorType: "system",
      metadata: {
        contactId: payload.contactId,
        event: payload.event,
      },
    },
  });

  await dispatchScoring({
    accountId: payload.accountId,
    contactId: payload.contactId,
    leadId: payload.leadId,
    reason: "message.received",
  });
}
