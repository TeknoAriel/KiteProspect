/**
 * Rate limiting en memoria por clave (p. ej. IP + sufijo).
 * En serverless hay varias instancias: es un "freno suave", no un límite global.
 * Para producción estricta, usar Edge/KV (Upstash, Vercel KV), ver docs.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const PRUNE_EVERY = 200;
let pruneCounter = 0;

function prune(now: number, windowMs: number): void {
  const threshold = now - windowMs * 2;
  for (const [key, b] of store.entries()) {
    if (b.resetAt < threshold) store.delete(key);
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getCaptureRateLimitConfig(): { windowMs: number; max: number } {
  const windowSec = parsePositiveInt(process.env.CAPTURE_RATE_LIMIT_WINDOW_SEC, 60);
  const max = parsePositiveInt(process.env.CAPTURE_RATE_LIMIT_MAX, 30);
  return { windowMs: windowSec * 1000, max };
}

/**
 * @returns true si la solicitud puede continuar; false si se superó el límite.
 */
export function allowRateLimit(key: string): boolean {
  const { windowMs, max } = getCaptureRateLimitConfig();
  const now = Date.now();

  pruneCounter++;
  if (pruneCounter >= PRUNE_EVERY) {
    pruneCounter = 0;
    prune(now, windowMs);
  }

  let b = store.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    store.set(key, b);
  }

  if (b.count >= max) return false;
  b.count++;
  return true;
}
