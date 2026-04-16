/**
 * Webhook mock de campaña externa → misma ingesta que /api/lead con source campaign_mock.
 */
import { NextRequest, NextResponse } from "next/server";
import { ingestLeadWithIdempotency } from "@/domains/activation/ingest-lead";
import { resolveCaptureAccountFromBody } from "@/domains/capture/services/resolve-capture-account";
import {
  captureAuthConfiguredForAccount,
  extractCaptureToken,
  verifyGlobalCaptureSecret,
  verifyTenantCaptureKey,
} from "@/domains/capture/services/verify-capture-auth";
import { dispatchLeadCreated } from "@/jobs/dispatch";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit } from "@/lib/rate-limit-memory";
import { resolveConsentMarketingInput } from "@/lib/resolve-consent-marketing";

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  if (!allowRateLimit(`campaign-mock:${ip}`)) {
    return NextResponse.json({ error: "rate limit" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const resolved = await resolveCaptureAccountFromBody(body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const accountId = resolved.accountId;
  const configured = await captureAuthConfiguredForAccount(accountId);
  if (!configured) {
    return NextResponse.json({ error: "Captura no configurada" }, { status: 503 });
  }

  const token = extractCaptureToken(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (
    !verifyGlobalCaptureSecret(token) &&
    !(await verifyTenantCaptureKey(token, accountId))
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const idem =
    request.headers.get("Idempotency-Key")?.trim() ||
    (typeof body.externalEventId === "string" ? body.externalEventId : "") ||
    (typeof body.idempotencyKey === "string" ? body.idempotencyKey : "");
  if (!idem) {
    return NextResponse.json(
      { error: "Falta Idempotency-Key o externalEventId" },
      { status: 400 },
    );
  }

  const { email, phone, name, message, campaignId, consentMarketing } =
    body as Record<string, unknown>;

  const result = await ingestLeadWithIdempotency({
    accountId,
    idempotencySource: "campaign_mock",
    idempotencyKey: idem,
    email: typeof email === "string" ? email : undefined,
    phone: typeof phone === "string" ? phone : undefined,
    name: typeof name === "string" ? name : undefined,
    message: typeof message === "string" ? message : undefined,
    channel: "landing",
    leadSource: typeof campaignId === "string" ? `campaign:${campaignId}` : "campaign_mock",
    campaignId: typeof campaignId === "string" ? campaignId : null,
    grantMarketingConsent: resolveConsentMarketingInput({ consentMarketing }),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!result.deduped) {
    void dispatchLeadCreated({
      accountId,
      contactId: result.contactId,
      leadId: result.leadId,
      event: "lead.created",
    }).catch(() => undefined);
  }

  return NextResponse.json({
    contactId: result.contactId,
    leadId: result.leadId,
    conversationId: result.conversationId,
    deduped: result.deduped,
  });
}
