import IORedis from "ioredis";

let shared: IORedis | null | undefined;

export function getRedisConnection(): IORedis | null {
  if (shared !== undefined) return shared;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    shared = null;
    return null;
  }
  shared = new IORedis(url, {
    maxRetriesPerRequest: null,
  });
  return shared;
}
