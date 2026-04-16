/**
 * POST /api/lead — captura con Lead + idempotencia (activación).
 * Misma autenticación que POST /api/contacts/create.
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
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { logStructured } from "@/lib/structured-log";
import { resolveConsentMarketingInput } from "@/lib/resolve-consent-marketing";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    if (!allowRateLimit(`capture-api:${ip}`)) {
      const { windowMs } = getCaptureRateLimitConfig();
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(windowMs / 1000)),
          },
        },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
    }

    const resolved = await resolveCaptureAccountFromBody(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const accountId = resolved.accountId;
    const configured = await captureAuthConfiguredForAccount(accountId);
    if (!configured) {
      return NextResponse.json(
        {
          error:
            "Captura no configurada: definí CAPTURE_API_SECRET en el entorno o creá una API key en la cuenta (admin → captura).",
        },
        { status: 503 },
      );
    }

    const token = extractCaptureToken(request);
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const okGlobal = verifyGlobalCaptureSecret(token);
    const okTenant = await verifyTenantCaptureKey(token, accountId);
    if (!okGlobal && !okTenant) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const idem =
      request.headers.get("Idempotency-Key")?.trim() ||
      (typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "");
    if (!idem) {
      return NextResponse.json(
        { error: "Falta Idempotency-Key (header) o idempotencyKey (body)" },
        { status: 400 },
      );
    }

    const {
      branchSlug,
      email,
      phone,
      name,
      channel,
      message,
      campaignId,
      consentMarketing,
    } = body as Record<string, unknown>;

    let branchId: string | undefined;
    const branchSlugRaw =
      typeof branchSlug === "string" ? branchSlug.trim().toLowerCase() : "";
    if (branchSlugRaw) {
      const { prisma } = await import("@kite-prospect/db");
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

    const grantMarketingConsent = resolveConsentMarketingInput({
      consentMarketing,
    });

    const result = await ingestLeadWithIdempotency({
      accountId,
      branchId: branchId ?? null,
      idempotencySource: "capture",
      idempotencyKey: idem,
      email: typeof email === "string" ? email : undefined,
      phone: typeof phone === "string" ? phone : undefined,
      name: typeof name === "string" ? name : undefined,
      message: typeof message === "string" ? message : undefined,
      channel:
        typeof channel === "string"
          ? channel
          : "form",
      leadSource: "form",
      campaignId: typeof campaignId === "string" ? campaignId : null,
      grantMarketingConsent,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    logStructured("lead_api_ingestion_ok", {
      accountId,
      contactId: result.contactId,
      leadId: result.leadId,
      deduped: result.deduped,
    });

    if (!result.deduped) {
      void dispatchLeadCreated({
        accountId,
        contactId: result.contactId,
        leadId: result.leadId,
        event: "lead.created",
      }).catch((e) => console.error("[dispatch] lead.created", e));
    }

    return NextResponse.json({
      contactId: result.contactId,
      leadId: result.leadId,
      conversationId: result.conversationId,
      deduped: result.deduped,
    });
  } catch (error) {
    console.error("POST /api/lead:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
