import type { Context, Next } from 'hono';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(name: string, options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const now = Date.now();
    const key = `${name}:${getClientKey(c)}`;
    cleanupExpiredBuckets(now);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      await next();
      return;
    }

    if (bucket.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: 'Too many requests. Try again later.' }, 429);
    }

    bucket.count += 1;
    await next();
  };
}

function cleanupExpiredBuckets(now: number): void {
  if (buckets.size < 1000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientKey(c: Context): string {
  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || c.req.header('x-real-ip') || 'unknown-client';
}
