/**
 * WhatsApp Cloud API (Meta) — verificación GET y eventos POST.
 * Multi-tenant vía WHATSAPP_ACCOUNT_SLUG (una cuenta por número / WABA en MVP).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { verifyMetaSignature256 } from "@/lib/meta-signature";
import { processWhatsAppWebhookBody } from "@/domains/integrations/whatsapp/process-webhook";
import { logStructured } from "@/lib/structured-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const verify = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && token && challenge && verify && token === verify) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();

  if (appSecret) {
    const sig = request.headers.get("x-hub-signature-256");
    if (!verifyMetaSignature256(raw, sig, appSecret)) {
      logStructured("whatsapp_webhook_signature_invalid", {
        httpStatus: 401,
        hasSignatureHeader: Boolean(sig?.trim()),
        bodyBytes: raw.length,
      });
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[whatsapp] WHATSAPP_APP_SECRET no definido: webhook sin verificación de firma");
  }

  const slug = process.env.WHATSAPP_ACCOUNT_SLUG?.trim();
  if (!slug) {
    logStructured("whatsapp_webhook_account_slug_missing", { httpStatus: 503 });
    return NextResponse.json(
      { error: "WHATSAPP_ACCOUNT_SLUG no configurado" },
      { status: 503 },
    );
  }

  const account = await prisma.account.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!account) {
    logStructured("whatsapp_webhook_account_not_found", {
      httpStatus: 404,
      accountSlug: slug,
    });
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  let body: unknown = {};
  if (raw.length > 0) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
  }

  try {
    const result = await processWhatsAppWebhookBody(account.id, body);
    if (result.processed === 0 && result.kind === "empty") {
      const root = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
      const objectField = typeof root?.object === "string" ? root.object : null;
      logStructured("whatsapp_webhook_no_inbound_extracted", {
        httpStatus: 200,
        accountId: account.id,
        kind: result.kind,
        objectField,
        bodyBytes: raw.length,
      });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[whatsapp] webhook error", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
