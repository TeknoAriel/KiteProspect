/**
 * Receptor mock para handoff lead.qualified (desarrollo local).
 * Verifica cabecera X-Kite-Signature (HMAC-SHA256 del cuerpo).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  const expectedPrefix = "sha256=";
  if (!header?.startsWith(expectedPrefix)) return false;
  const got = Buffer.from(header.slice(expectedPrefix.length), "hex");
  const h = createHmac("sha256", secret);
  h.update(rawBody);
  const want = h.digest();
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const { resolveHandoffSigningSecret } = await import(
    "@/domains/activation/handoff-webhook"
  );
  const secret = resolveHandoffSigningSecret();

  const sig = request.headers.get("X-Kite-Signature");
  if (!verifySignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  console.log("[mock kiteprop handoff]", JSON.stringify(parsed, null, 2));

  return NextResponse.json({
    received: true,
    idempotency_note: "mock: dedupe por dedupe_key en receptor real",
  });
}
