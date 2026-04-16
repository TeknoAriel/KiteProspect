import { UnrecoverableError } from "bullmq";
import { prisma } from "@kite-prospect/db";
import type { IntegrationOutboundJobPayload } from "../job-payloads";
import {
  buildDedupeKey,
  deterministicEventIdForDedupe,
  type LeadQualifiedPayload,
} from "@/domains/activation/handoff-webhook";
import { sendLeadQualifiedToKiteprop } from "@/domains/integrations/kiteprop/kiteprop-lead-qualified-adapter";
import { resolveKitepropHandoffUrl } from "@/domains/integrations/kiteprop/resolve-kiteprop-handoff-config";
import { logStructured } from "@/lib/structured-log";

const PAYLOAD_SNAPSHOT_MAX = 8000;

function truncatePayloadSnapshot(json: string): string {
  if (json.length <= PAYLOAD_SNAPSHOT_MAX) return json;
  return `${json.slice(0, PAYLOAD_SNAPSHOT_MAX - 24)}\n...[truncado]`;
}

export async function processIntegrationOutboundJob(
  payload: IntegrationOutboundJobPayload,
): Promise<void> {
  const [lead, contact, account, score, lastSuccess] = await Promise.all([
    prisma.lead.findFirst({
      where: {
        id: payload.leadId,
        accountId: payload.accountId,
        contactId: payload.contactId,
      },
    }),
    prisma.contact.findFirst({
      where: { id: payload.contactId, accountId: payload.accountId },
    }),
    prisma.account.findFirst({ where: { id: payload.accountId } }),
    prisma.leadScore.findFirst({
      where: { leadId: payload.leadId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.handoffOutboundAttempt.findFirst({
      where: { leadId: payload.leadId, ok: true },
    }),
  ]);

  if (!lead || !contact || !account || lead.status !== "qualified") {
    return;
  }

  if (lastSuccess) {
    await prisma.lead.updateMany({
      where: { id: payload.leadId, status: "qualified" },
      data: { status: "handed_off" },
    });
    return;
  }

  const url = resolveKitepropHandoffUrl(account);
  if (!url) {
    throw new Error(
      "Handoff KiteProp: sin URL (config.kitepropHandoffUrl o KITEPROP_HANDOFF_URL)",
    );
  }

  const profile = await prisma.searchProfile.findFirst({
    where: { contactId: contact.id },
    orderBy: { updatedAt: "desc" },
  });

  const dedupeKey = buildDedupeKey(payload.accountId, payload.leadId);

  const qual = await prisma.leadQualification.findFirst({
    where: { leadId: payload.leadId, contactId: payload.contactId },
    orderBy: { createdAt: "desc" },
  });
  const manualOverride = qual?.source === "manual";

  const basePayload: Omit<LeadQualifiedPayload, "event_id" | "occurred_at"> & {
    dedupe_key: string;
  } = {
    event: "lead.qualified",
    schema_version: 1,
    dedupe_key: dedupeKey,
    tenant: { account_id: payload.accountId, slug: account.slug },
    contact: {
      id: contact.id,
      external_id: contact.externalId,
      phone_e164: contact.phone,
      email: contact.email,
      name: contact.name,
    },
    lead: {
      id: lead.id,
      source: lead.source,
      scores: {
        intent: score?.intentScore ?? 0,
        readiness: score?.readinessScore ?? 0,
        fit: score?.fitScore ?? 0,
        engagement: score?.engagementScore ?? 0,
        total: score?.totalScore ?? 0,
      },
      search_profile_summary: profile
        ? {
            intent: profile.intent,
            zone: profile.zone,
            maxPrice: profile.maxPrice?.toString(),
          }
        : {},
    },
    qualification: {
      source: manualOverride ? "manual" : "rule",
      manual_override: manualOverride,
    },
  };

  const attemptNo =
    (await prisma.handoffOutboundAttempt.count({
      where: { leadId: payload.leadId },
    })) + 1;

  const result = await sendLeadQualifiedToKiteprop({
    url,
    accountSlug: account.slug,
    payload: basePayload,
  });

  const reqHash = result.requestBodySha256;

  await prisma.handoffOutboundAttempt.create({
    data: {
      accountId: payload.accountId,
      leadId: payload.leadId,
      contactId: payload.contactId,
      dedupeKey,
      eventId: deterministicEventIdForDedupe(dedupeKey),
      attemptNumber: attemptNo,
      targetUrl: url,
      httpStatus: result.httpStatus,
      ok: result.ack,
      latencyMs: result.latencyMs,
      requestBodySha256: reqHash,
      requestPayloadSnapshot: truncatePayloadSnapshot(result.requestBodyJson),
      responseSnippet: result.responseText.slice(0, 4000),
      errorMessage: result.errorMessage ?? (result.ack ? null : `HTTP ${result.httpStatus}`),
    },
  });

  logStructured("kiteprop_handoff_attempt", {
    leadId: payload.leadId,
    accountId: payload.accountId,
    httpStatus: result.httpStatus,
    classification: result.classification,
    ack: result.ack,
    latencyMs: result.latencyMs,
    requestSha256: reqHash,
  });

  if (result.classification === "fatal") {
    throw new UnrecoverableError(
      result.errorMessage ??
        `Handoff fatal HTTP ${result.httpStatus}: ${result.responseText.slice(0, 200)}`,
    );
  }

  if (result.classification === "retry") {
    throw new Error(
      result.errorMessage ||
        `Handoff reintentable HTTP ${result.httpStatus}: ${result.responseText.slice(0, 200)}`,
    );
  }

  const handed = await prisma.lead.updateMany({
    where: {
      id: payload.leadId,
      accountId: payload.accountId,
      status: "qualified",
    },
    data: { status: "handed_off" },
  });

  if (handed.count !== 1) {
    return;
  }

  await prisma.auditEvent.create({
    data: {
      accountId: payload.accountId,
      entityType: "lead",
      entityId: payload.leadId,
      action: "lead_handed_off",
      actorType: "system",
      metadata: {
        dedupeKey,
        httpStatus: result.httpStatus,
        latencyMs: result.latencyMs,
        requestSha256: reqHash,
        kitepropAck: true,
      },
    },
  });
}
