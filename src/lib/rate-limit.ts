import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_TOKEN;

const redis = UPSTASH_URL && UPSTASH_TOKEN
  ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
  : null;

const fallbackMap = new Map<string, { count: number; resetAt: number }>();
let fallbackTimer: ReturnType<typeof setInterval> | undefined;

function startFallbackCleanup() {
  if (typeof setInterval !== "undefined" && !fallbackTimer) {
    fallbackTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of fallbackMap) {
        if (now > entry.resetAt) fallbackMap.delete(key);
      }
    }, 60000);
  }
}

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (redis) {
    const windowKey = `rl:${key}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const redisKey = `${windowKey}:${windowStart}`;

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetAt: windowStart + windowMs,
    };
  }

  startFallbackCleanup();
  const now = Date.now();
  const entry = fallbackMap.get(key);

  if (!entry || now > entry.resetAt) {
    fallbackMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}
