/**
 * Proceso worker: Redis + BullMQ. Ejecutar en paralelo a Next (`npm run worker -w @kite-prospect/web`).
 */
import { Queue, Worker } from "bullmq";
import type { Job } from "bullmq";
import { getRedisConnection } from "./redis-connection";
import { QUEUE_NAMES } from "./queue-names";
import type {
  FollowupJobPayload,
  IngestionJobPayload,
  IntegrationOutboundJobPayload,
  OrchestrationJobPayload,
  ScoringJobPayload,
} from "./job-payloads";
import { processIngestionJob } from "./processors/ingestion-processor";
import { processScoringJob } from "./processors/scoring-processor";
import { processOrchestrationJob } from "./processors/orchestration-processor";
import { processIntegrationOutboundJob } from "./processors/integration-outbound-processor";
import { processFollowupJob } from "./processors/followup-processor";

const conn = getRedisConnection();
if (!conn) {
  console.error("[worker] Definí REDIS_URL (p. ej. redis://127.0.0.1:6379)");
  process.exit(1);
}

const workerOpts = { connection: conn, concurrency: 5 };

const workers: Worker[] = [];

workers.push(
  new Worker<IngestionJobPayload>(
    QUEUE_NAMES.ingestion,
    async (job: Job<IngestionJobPayload>) => processIngestionJob(job.data),
    workerOpts,
  ),
);

workers.push(
  new Worker<ScoringJobPayload>(
    QUEUE_NAMES.scoring,
    async (job: Job<ScoringJobPayload>) => processScoringJob(job.data),
    workerOpts,
  ),
);

workers.push(
  new Worker<OrchestrationJobPayload>(
    QUEUE_NAMES.orchestration,
    async (job: Job<OrchestrationJobPayload>) =>
      processOrchestrationJob(job.data),
    workerOpts,
  ),
);

const integrationWorker = new Worker<IntegrationOutboundJobPayload>(
  QUEUE_NAMES.integrationOutbound,
  async (job: Job<IntegrationOutboundJobPayload>) =>
    processIntegrationOutboundJob(job.data),
  workerOpts,
);

integrationWorker.on("failed", async (...args: unknown[]) => {
  const job = args[0] as Job<IntegrationOutboundJobPayload> | undefined;
  const err = args[1];
  const max = job?.opts.attempts ?? 6;
  if (job && max > 0 && job.attemptsMade >= max) {
    const dlq = new Queue(QUEUE_NAMES.dlq, { connection: conn });
    await dlq.add(
      "dead-letter",
      {
        source: "integration-outbound",
        payload: job.data,
        error: String(err),
      },
      { removeOnComplete: 50 },
    );
  }
});

workers.push(integrationWorker);

workers.push(
  new Worker<FollowupJobPayload>(
    QUEUE_NAMES.followup,
    async (job: Job<FollowupJobPayload>) => processFollowupJob(job.data),
    workerOpts,
  ),
);

workers.push(
  new Worker(
    QUEUE_NAMES.dlq,
    async (job: Job<unknown>) => {
      console.error("[DLQ]", job.name, JSON.stringify(job.data).slice(0, 2000));
    },
    { connection: conn, concurrency: 2 },
  ),
);

console.log(
  "[worker] Colas activas:",
  Object.values(QUEUE_NAMES).join(", "),
);

function shutdown() {
  void Promise.all(workers.map((w) => w.close())).then(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
