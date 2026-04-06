/**
 * Webhook Meta Lead Ads (F2-E6): verificación GET + ingest POST.
 * Asocia `page_id` de Meta con `Integration` (`type=meta_lead_ads`, `config.pageId`).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { createLeadCapture } from "@/domains/capture/services/create-lead-capture";
import {
  metaFieldValue,
  tryParseMetaLeadWebhook,
} from "@/domains/capture/services/parse-meta-lead-webhook";
import { logStructured } from "@/lib/structured-log";
import { verifyMetaWebhookSignature256 } from "@/lib/verify-meta-webhook-signature";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_LEAD_WEBHOOK_VERIFY_TOKEN?.trim();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function resolveAccountIdByMetaPageId(pageId: string): Promise<string | null> {
  const rows = await prisma.integration.findMany({
    where: { type: "meta_lead_ads", status: "active" },
    select: { accountId: true, config: true },
  });
  for (const r of rows) {
    const cfg = r.config;
    if (cfg !== null && typeof cfg === "object" && !Array.isArray(cfg)) {
      const pid = (cfg as Record<string, unknown>).pageId;
      if (typeof pid === "string" && pid === pageId) {
        return r.accountId;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.META_LEAD_WEBHOOK_APP_SECRET?.trim();
  if (appSecret) {
    const sig = request.headers.get("x-hub-signature-256");
    if (!verifyMetaWebhookSignature256(rawBody, sig, appSecret)) {
      logStructured("meta_lead_webhook_signature_invalid", {});
      return NextResponse.json({ error: "Firma inválida" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = tryParseMetaLeadWebhook(body);
  if (!parsed) {
    logStructured("meta_lead_webhook_ignored", { reason: "unparsed_payload" });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const accountId = await resolveAccountIdByMetaPageId(parsed.pageId);
  if (!accountId) {
    logStructured("meta_lead_webhook_no_integration", { pageId: parsed.pageId });
    return NextResponse.json({ ok: true, ignored: true, reason: "no_integration" });
  }

  const acc = await prisma.account.findFirst({
    where: { id: accountId },
    select: { slug: true },
  });
  if (!acc?.slug) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_slug" });
  }

  const email = metaFieldValue(parsed.fieldData, "email");
  const phone = metaFieldValue(parsed.fieldData, "phone_number", "phone", "teléfono");
  const name = metaFieldValue(parsed.fieldData, "full_name", "nombre_completo", "first_name", "nombre");

  const msgParts = [`Lead Meta (leadgen ${parsed.leadgenId ?? "n/a"})`];
  if (parsed.fieldData.length > 0) {
    msgParts.push(
      parsed.fieldData.map((f) => `${f.name}: ${f.values.join(", ")}`).join(" | "),
    );
  }
  const message = msgParts.join("\n").slice(0, 8000);

  const result = await createLeadCapture({
    accountSlug: acc.slug,
    email,
    phone,
    name,
    channel: "meta_lead",
    message,
    source: "api",
  });

  if (!result.ok) {
    logStructured("meta_lead_webhook_capture_failed", {
      accountId,
      error: result.error,
      status: result.status,
    });
    return NextResponse.json({ ok: false, error: result.error, acknowledged: true }, { status: 200 });
  }

  logStructured("meta_lead_webhook_ingested", {
    accountId,
    contactId: result.contactId,
    pageId: parsed.pageId,
  });

  return NextResponse.json({ ok: true, contactId: result.contactId });
}
