/**
 * API pública: crear contacto + conversación + mensaje inicial (formulario / landing).
 * Requiere CAPTURE_API_SECRET y resolución de tenant por slug (recomendado) o accountId (legacy).
 */
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createLeadCapture } from "@/domains/capture/services/create-lead-capture";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { logStructured } from "@/lib/structured-log";

function verifyCaptureSecret(request: NextRequest): boolean {
  const secret = process.env.CAPTURE_API_SECRET?.trim();
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const token = bearer.slice(7).trim();
    return safeEqualStrings(token, secret);
  }

  const headerSecret = request.headers.get("x-capture-secret")?.trim();
  if (headerSecret) {
    return safeEqualStrings(headerSecret, secret);
  }

  return false;
}

function safeEqualStrings(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CAPTURE_API_SECRET?.trim()) {
      return NextResponse.json(
        {
          error:
            "Captura deshabilitada: define CAPTURE_API_SECRET en .env (ver docs/setup-local.md)",
        },
        { status: 503 },
      );
    }

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

    if (!verifyCaptureSecret(request)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
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
