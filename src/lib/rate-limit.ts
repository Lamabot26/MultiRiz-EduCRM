// =====================================================================
// In-memory sliding-window rate limiter.
// Suitable for the single-node v1 deployment (no Redis allowed in MVP).
// For multi-instance deployments, swap the store — interface stays same.
// =====================================================================

type Bucket = { timestamps: number[] };

const globalForRL = globalThis as unknown as { __rateLimitStore?: Map<string, Bucket> };
const store: Map<string, Bucket> = globalForRL.__rateLimitStore ?? new Map();
globalForRL.__rateLimitStore = store;

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const bucket = store.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  const allowed = bucket.timestamps.length < limit;
  if (allowed) bucket.timestamps.push(now);
  store.set(key, bucket);
  const oldest = bucket.timestamps[0] ?? now;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterMs: allowed ? 0 : windowMs - (now - oldest),
  };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
