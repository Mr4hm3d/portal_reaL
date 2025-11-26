import Redis from 'ioredis';

import { parseEnv } from '@portal/config/index';

const env = parseEnv();

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false
});

export type RateLimitConfig = {
  windowMs: number;
  max: number;
  prefix?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetIn: number;
};

export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS ?? 60_000,
  max: env.RATE_LIMIT_MAX_REQUESTS ?? 15,
  prefix: 'rl'
};

function getRedisKey(key: string, config: RateLimitConfig) {
  const window = Math.floor(Date.now() / config.windowMs);
  return `${config.prefix ?? 'rl'}:${key}:${window}`;
}

export async function enforceRateLimit(key: string, config: RateLimitConfig = defaultRateLimitConfig): Promise<RateLimitResult> {
  const redisKey = getRedisKey(key, config);

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, config.windowMs);
    }

    const remaining = Math.max(config.max - count, 0);
    const resetIn = config.windowMs - (Date.now() % config.windowMs);

    return {
      allowed: count <= config.max,
      count,
      limit: config.max,
      remaining,
      resetIn
    };
  } catch (error) {
    console.warn('Rate limit skipped due to Redis error', error);
    return {
      allowed: true,
      count: 0,
      limit: config.max,
      remaining: config.max,
      resetIn: config.windowMs
    };
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(result.remaining, 0).toString(),
    'Retry-After': Math.ceil(result.resetIn / 1000).toString()
  };
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim());
    if (parts.length > 0) return parts[0];
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function rateLimitRequest(
  request: Request,
  identifier: string,
  config: RateLimitConfig = defaultRateLimitConfig
): Promise<RateLimitResult> {
  const ip = requestIp(request);
  const key = `${identifier}:${ip}`;
  return enforceRateLimit(key, config);
}
