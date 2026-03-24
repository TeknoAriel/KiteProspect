/**
 * Cron: procesa FollowUpSequence con nextAttemptAt vencido.
 * Auth: Authorization: Bearer CRON_SECRET, o cabecera Vercel `x-vercel-cron: 1` (solo invocación cron).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyCronBearer } from "@/lib/cron-auth";
import { processDueFollowUps } from "@/domains/followups/services/process-due-follow-ups";

function defaultBatchLimit(): number {
  const raw = process.env.FOLLOW_UP_CRON_BATCH_LIMIT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 25;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 25;
}

function authorize(request: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, message: "CRON_SECRET no configurado (ver .env.example)" };
  }

  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const bearerOk = verifyCronBearer(request.headers.get("authorization"), secret);

  if (!isVercelCron && !bearerOk) {
    return { ok: false, status: 401, message: "No autorizado" };
  }

  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const result = await processDueFollowUps({ batchLimit: defaultBatchLimit() });
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
