/**
 * POST: sincronización inbound por lotes (CRM o middleware → Kite). F3-E1+ / L22b.
 * Auth: sesión admin/coordinador o misma captura que `POST /api/contacts/create`.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveCaptureAccountFromBody } from "@/domains/capture/services/resolve-capture-account";
import {
  captureAuthConfiguredForAccount,
  extractCaptureToken,
  verifyGlobalCaptureSecret,
  verifyTenantCaptureKey,
} from "@/domains/capture/services/verify-capture-auth";
import {
  CRM_BATCH_SYNC_MAX_ITEMS,
  applyCrmBatchSyncItem,
  parseCrmBatchSyncItem,
  type CrmBatchSyncActor,
  type ParsedCrmBatchSyncItem,
} from "@/domains/crm-leads/crm-batch-sync";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { logStructured } from "@/lib/structured-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  if (!allowRateLimit(`crm-batch-sync:${ip}`)) {
    const { windowMs } = getCaptureRateLimitConfig();
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  const rawItems = body.items;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: "Se requiere items (array)" }, { status: 400 });
  }
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "items no puede estar vacío" }, { status: 400 });
  }
  if (rawItems.length > CRM_BATCH_SYNC_MAX_ITEMS) {
    return NextResponse.json(
      { error: `Máximo ${CRM_BATCH_SYNC_MAX_ITEMS} ítems por solicitud` },
      { status: 400 },
    );
  }

  const session = await auth();
  let accountId: string | null = null;
  let actor: CrmBatchSyncActor | null = null;

  if (session?.user?.accountId && session.user.role && MUTATE_ROLES.has(session.user.role)) {
    accountId = session.user.accountId;
    actor = { type: "user", userId: session.user.id };
  } else {
    const resolved = await resolveCaptureAccountFromBody(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    accountId = resolved.accountId;

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

    if (okGlobal) {
      const aid = typeof body.accountId === "string" ? body.accountId.trim() : "";
      if (!aid || aid !== accountId) {
        return NextResponse.json(
          {
            error:
              "Con secreto global, incluí accountId en el cuerpo (UUID de la cuenta) y que coincida con accountSlug/accountId resuelto.",
          },
          { status: 401 },
        );
      }
    }

    actor = { type: "integration" };
  }

  if (!accountId || !actor) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed: ParsedCrmBatchSyncItem[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const one = parseCrmBatchSyncItem(rawItems[i]);
    if (!one.ok) {
      return NextResponse.json({ error: `Ítem ${i}: ${one.error}` }, { status: 400 });
    }
    parsed.push(one.value);
  }

  const results = [];
  for (const item of parsed) {
    const r = await applyCrmBatchSyncItem({
      accountId,
      item,
      actor,
    });
    results.push(r);
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  logStructured("crm_batch_sync_done", {
    accountId,
    via: actor.type === "user" ? "session" : "capture_auth",
    okCount,
    errorCount,
  });

  return NextResponse.json({
    ok: true,
    accountId,
    results,
    summary: { ok: okCount, error: errorCount },
  });
}
