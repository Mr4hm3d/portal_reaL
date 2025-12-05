import { beforeEach, describe, expect, it, vi } from 'vitest';

type BaseEnv = Record<string, string>;

const baseEnv: BaseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
  APP_BASE_URL: 'http://localhost:3000',
  FILE_STORAGE_ROOT: '/tmp/files',
  SMTP_HOST: 'smtp.local',
  SMTP_PORT: '1025',
  SESSION_SECRET: 'x'.repeat(32),
  BRANDING_NAME: 'Portal',
  BRANDING_PRIMARY_COLOR: '#000000',
  REDIS_URL: ''
};

function setEnv(overrides: Partial<BaseEnv> = {}) {
  process.env = { ...process.env, ...baseEnv, ...overrides };
}

async function loadRateLimit() {
  vi.resetModules();
  const module = await import('../src/rate-limit');
  return module;
}

describe('rate limiting without redis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnv({ REDIS_URL: '' });
  });

  it('falls back to in-memory counters and blocks after max attempts', async () => {
    const { enforceRateLimit } = await loadRateLimit();
    const config = { windowMs: 1000, max: 2, prefix: 'test' };

    const first = await enforceRateLimit('ip:1', config);
    expect(first.allowed).toBe(true);
    expect(first.count).toBe(1);
    expect(first.remaining).toBe(1);

    const second = await enforceRateLimit('ip:1', config);
    expect(second.allowed).toBe(true);
    expect(second.count).toBe(2);
    expect(second.remaining).toBe(0);

    const third = await enforceRateLimit('ip:1', config);
    expect(third.allowed).toBe(false);
    expect(third.count).toBe(3);
    expect(third.remaining).toBe(0);
  });

  it('derives identifiers from request IP headers', async () => {
    const { rateLimitRequest } = await loadRateLimit();
    const request = new Request('http://example.test/login', {
      headers: {
        'x-forwarded-for': '203.0.113.5, 198.51.100.7'
      }
    });

    const result = await rateLimitRequest(request, 'login', { windowMs: 5000, max: 1, prefix: 'rl' });
    expect(result.allowed).toBe(true);

    const blocked = await rateLimitRequest(request, 'login', { windowMs: 5000, max: 1, prefix: 'rl' });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

describe('rate limit headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnv({ REDIS_URL: '' });
  });

  it('exposes rate limit metadata as strings', async () => {
    const { rateLimitHeaders } = await loadRateLimit();
    const headers = rateLimitHeaders({ allowed: false, count: 5, limit: 5, remaining: 0, resetIn: 2000 });

    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBe('2');
  });
});
