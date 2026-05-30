import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

export function isRateLimitEnabled(): boolean {
  return getRedis() !== null;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(
  prefix: string,
  limit: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${prefix}:${limit}:${window}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix,
      analytics: true,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

async function runLimit(
  prefix: string,
  identifier: string,
  limit: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Promise<RateLimitResult> {
  const limiter = getLimiter(prefix, limit, window);
  if (!limiter) {
    return { success: true, limit, remaining: limit, reset: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/** Anonymous Chao: per-IP daily cap (on top of cookie message limit). */
export function rateLimitChaoAnonIp(ip: string) {
  return runLimit("rl:chao:anon:ip", ip, 20, "1 d");
}

/** Community scholarship submission: per-IP hourly cap. */
export function rateLimitScholarshipSubmit(ip: string) {
  return runLimit("rl:submit:scholarship", ip, 10, "1 h");
}
