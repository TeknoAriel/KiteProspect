import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";
import { getRedisConnection } from "@/jobs/redis-connection";
import { QUEUE_NAMES } from "@/jobs/queue-names";

/**
 * GET — conteos por cola BullMQ (pendientes, activos, fallidos, etc.).
 */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const redis = getRedisConnection();
  if (!redis) {
    return NextResponse.json({
      redis: false,
      message: "Sin REDIS_URL no hay colas BullMQ en este proceso.",
    });
  }

  const queues: Record<string, Record<string, number>> = {};
  for (const name of Object.values(QUEUE_NAMES)) {
    const q = new Queue(name, { connection: redis });
    const c = await q.getJobCounts();
    queues[name] = c as unknown as Record<string, number>;
    await q.close();
  }

  return NextResponse.json({ redis: true, queues });
}
