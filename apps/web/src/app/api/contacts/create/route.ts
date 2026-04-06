/**
 * API pública: crear contacto + conversación + mensaje inicial (formulario / landing).
 * Autenticación: `CAPTURE_API_SECRET` global (opcional) y/o API key por tenant `kp_*` (F3-E2).
 */
import { NextRequest, NextResponse } from "next/server";
import { createLeadCapture } from "@/domains/capture/services/create-lead-capture";
import { resolveCaptureAccountFromBody } from "@/domains/capture/services/resolve-capture-account";
import {
  captureAuthConfiguredForAccount,
  extractCaptureToken,
  verifyGlobalCaptureSecret,
  verifyTenantCaptureKey,
} from "@/domains/capture/services/verify-capture-auth";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { logStructured } from "@/lib/structured-log";

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

    const {
      accountSlug,
      accountId: bodyAccountId,
      email,
      phone,
      name,
      channel,
      message,
    } = body as Record<string, unknown>;

    const result = await createLeadCapture({
      accountSlug: typeof accountSlug === "string" ? accountSlug : undefined,
      accountId: typeof bodyAccountId === "string" ? bodyAccountId : undefined,
      email: typeof email === "string" ? email : undefined,
      phone: typeof phone === "string" ? phone : undefined,
      name: typeof name === "string" ? name : undefined,
      channel: typeof channel === "string" ? channel : undefined,
      message: typeof message === "string" ? message : undefined,
      source: "api",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    logStructured("lead_capture_api_ok", {
      contactId: result.contactId,
      conversationId: result.conversationId,
    });

    return NextResponse.json({
      contactId: result.contactId,
      conversationId: result.conversationId,
    });
  } catch (error) {
    console.error("Error creando contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
