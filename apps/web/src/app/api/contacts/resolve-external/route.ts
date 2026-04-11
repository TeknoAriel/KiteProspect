/**
 * Resolución de contacto por `externalId` dentro del tenant (CRM ↔ Kite).
 * Autenticación: misma que captura (`CAPTURE_API_SECRET` global o `kp_…` por cuenta).
 * Query: `accountSlug` o `accountId`, y `externalId` (no vacío).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { resolveCaptureAccountFromSearchParams } from "@/domains/capture/services/resolve-capture-account";
import {
  captureAuthConfiguredForAccount,
  extractCaptureToken,
  verifyGlobalCaptureSecret,
  verifyTenantCaptureKey,
} from "@/domains/capture/services/verify-capture-auth";
import { normalizeContactExternalId } from "@/domains/crm-leads/contact-external-id";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { logStructured } from "@/lib/structured-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  if (!allowRateLimit(`contact-resolve-external:${ip}`)) {
    const { windowMs } = getCaptureRateLimitConfig();
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      },
    );
  }

  const url = new URL(request.url);
  const resolved = await resolveCaptureAccountFromSearchParams(url.searchParams);
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

  const extParam = url.searchParams.get("externalId");
  const normalized = normalizeContactExternalId(extParam === null ? undefined : extParam);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }
  if (normalized.value === null) {
    return NextResponse.json({ error: "Se requiere externalId no vacío" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { accountId, externalId: normalized.value },
    select: {
      id: true,
      externalId: true,
      commercialStage: true,
      conversationalStage: true,
      branchId: true,
    },
  });

  if (!contact) {
    logStructured("contact_resolve_external_miss", { accountId });
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  logStructured("contact_resolve_external_ok", {
    accountId,
    contactId: contact.id,
  });

  return NextResponse.json({
    ok: true,
    contact: {
      id: contact.id,
      externalId: contact.externalId,
      commercialStage: contact.commercialStage,
      conversationalStage: contact.conversationalStage,
      branchId: contact.branchId,
    },
  });
}
