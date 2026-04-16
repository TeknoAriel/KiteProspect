import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";
import { getRedisConnection } from "@/jobs/redis-connection";
import { QUEUE_NAMES } from "@/jobs/queue-names";

/**
 * POST — reintenta jobs fallidos de una cola (por defecto integration-outbound).
 * Body: `{ "queue": "integration-outbound", "limit": 10 }`
 */
export async function POST(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const redis = getRedisConnection();
  if (!redis) {
    return NextResponse.json({ error: "REDIS_URL no configurada" }, { status: 503 });
  }

  let body: { queue?: string; limit?: number };
  try {
    body = (await request.json()) as { queue?: string; limit?: number };
  } catch {
    body = {};
  }

  const queueName =
    typeof body.queue === "string" && body.queue.trim()
      ? body.queue.trim()
      : QUEUE_NAMES.integrationOutbound;
  const limit = Math.min(50, Math.max(1, body.limit ?? 10));

  const q = new Queue(queueName, { connection: redis });
  const failed = await q.getJobs(["failed"], 0, limit - 1);
  let retried = 0;
  for (const job of failed) {
    try {
      await job.retry();
      retried++;
    } catch {
      /* siguiente */
    }
  }
  await q.close();

  return NextResponse.json({ queue: queueName, examined: failed.length, retried });
}
