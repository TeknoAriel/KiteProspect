import { Queue } from "bullmq";
import { getRedisConnection } from "./redis-connection";
import { QUEUE_NAMES } from "./queue-names";
import type {
  IngestionJobPayload,
  IntegrationOutboundJobPayload,
  OrchestrationJobPayload,
  ScoringJobPayload,
} from "./job-payloads";

const defaultJobOpts = {
  attempts: 6,
  backoff: {
    type: "exponential" as const,
    delay: 60_000,
  },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 200 },
};

const queueCache = new Map<string, Queue>();

function getQueue(name: string): Queue | null {
  const conn = getRedisConnection();
  if (!conn) return null;
  let q = queueCache.get(name);
  if (!q) {
    q = new Queue(name, { connection: conn });
    queueCache.set(name, q);
  }
  return q;
}

export async function dispatchLeadCreated(payload: IngestionJobPayload): Promise<void> {
  const q = getQueue(QUEUE_NAMES.ingestion);
  if (!q) {
    const { processIngestionJob } = await import("./processors/ingestion-processor");
    await processIngestionJob(payload);
    return;
  }
  await q.add("lead.created", payload, defaultJobOpts);
}

export async function dispatchScoring(payload: ScoringJobPayload): Promise<void> {
  const q = getQueue(QUEUE_NAMES.scoring);
  if (!q) {
    const { processScoringJob } = await import("./processors/scoring-processor");
    await processScoringJob(payload);
    return;
  }
  await q.add("scoring", payload, defaultJobOpts);
}

export async function dispatchOrchestration(
  payload: OrchestrationJobPayload,
): Promise<void> {
  const q = getQueue(QUEUE_NAMES.orchestration);
  if (!q) {
    const { processOrchestrationJob } = await import(
      "./processors/orchestration-processor"
    );
    await processOrchestrationJob(payload);
    return;
  }
  await q.add("orchestration", payload, defaultJobOpts);
}

export type DispatchIntegrationOutboundOptions = {
  /**
   * Por defecto el jobId es estable por lead (idempotencia BullMQ).
   * En replay operativo, usar `true` para forzar un jobId nuevo (reintento tras fallo o 422 resuelto).
   */
  replay?: boolean;
};

export async function dispatchIntegrationOutbound(
  payload: IntegrationOutboundJobPayload,
  opts?: DispatchIntegrationOutboundOptions,
): Promise<void> {
  const q = getQueue(QUEUE_NAMES.integrationOutbound);
  if (!q) {
    const { processIntegrationOutboundJob } = await import(
      "./processors/integration-outbound-processor"
    );
    await processIntegrationOutboundJob(payload);
    return;
  }
  const jobId = opts?.replay
    ? `handoff:${payload.accountId}:${payload.leadId}:replay:${Date.now()}`
    : `handoff:${payload.accountId}:${payload.leadId}`;
  await q.add("handoff", payload, {
    ...defaultJobOpts,
    jobId,
  });
}
