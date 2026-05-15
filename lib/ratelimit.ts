// In-memory sliding-window rate limiter, keyed by IP.
//
// Trade-off (documented in spec D4):
//   Per Vercel function instance. Multiple cold instances = multiple buckets,
//   so the practical cap is N × maxRequests/window. For v0 launch traffic
//   this is acceptable; v1 upgrades to Upstash Redis for a global counter.
//
// State machine per IP bucket:
//   incoming  →  drop timestamps older than now-windowMs
//             →  if len(remaining) ≥ maxRequests → block, return retry-after
//             →  else push now, allow
//
// Periodic cleanup every CLEANUP_EVERY ops drops buckets with no recent
// activity to keep memory bounded under DDoS-ish spray.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
let opsSinceCleanup = 0;
const CLEANUP_EVERY = 100;

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export const DEFAULT_OPTS: RateLimitOptions = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export function rateLimit(ip: string, opts: RateLimitOptions = DEFAULT_OPTS): RateLimitResult {
  const now = Date.now();
  const { maxRequests, windowMs } = opts;

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(ip, bucket);
  }

  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }

  bucket.timestamps.push(now);

  if (++opsSinceCleanup >= CLEANUP_EVERY) {
    opsSinceCleanup = 0;
    const staleCutoff = now - windowMs * 2;
    for (const [k, b] of buckets) {
      if (b.timestamps.length === 0 || b.timestamps.every((ts) => ts <= staleCutoff)) {
        buckets.delete(k);
      }
    }
  }

  return {
    ok: true,
    remaining: maxRequests - bucket.timestamps.length,
    retryAfterMs: 0,
  };
}

/** Test-only: clear all buckets. Not exported via index. */
export function _resetForTests(): void {
  buckets.clear();
  opsSinceCleanup = 0;
}
