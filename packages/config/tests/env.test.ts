import { describe, expect, it } from 'vitest';

import { parseEnv } from '../src';

type BaseEnv = Omit<ReturnType<typeof parseEnv>, 'REDIS_URL' | 'ALLOW_PUBLIC_REGISTRATION'> & {
  REDIS_URL?: string | undefined;
  ALLOW_PUBLIC_REGISTRATION?: string | boolean;
};

const baseEnv: BaseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  APP_BASE_URL: 'http://localhost:3000',
  FILE_STORAGE_ROOT: '/tmp/files',
  SMTP_HOST: 'localhost',
  SMTP_PORT: 1025,
  SESSION_SECRET: 'x'.repeat(32),
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 15,
  SESSION_COOKIE_NAME: 'portal_session',
  SESSION_TTL_SECONDS: 604800,
  BRANDING_NAME: 'Portal',
  BRANDING_PRIMARY_COLOR: '#0f172a'
};

describe('parseEnv', () => {
  it('normalizes missing or empty REDIS_URL to undefined', () => {
    const parsed = parseEnv({ ...baseEnv });
    expect(parsed.REDIS_URL).toBeUndefined();

    const parsedEmpty = parseEnv({ ...baseEnv, REDIS_URL: '' });
    expect(parsedEmpty.REDIS_URL).toBeUndefined();
  });

  it('accepts a valid REDIS_URL when provided', () => {
    const parsed = parseEnv({ ...baseEnv, REDIS_URL: 'redis://localhost:6379' });
    expect(parsed.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('coerces ALLOW_PUBLIC_REGISTRATION values', () => {
    const parsedTrue = parseEnv({ ...baseEnv, ALLOW_PUBLIC_REGISTRATION: 'true' });
    expect(parsedTrue.ALLOW_PUBLIC_REGISTRATION).toBe(true);

    const parsedFalse = parseEnv({ ...baseEnv, ALLOW_PUBLIC_REGISTRATION: 'false' });
    expect(parsedFalse.ALLOW_PUBLIC_REGISTRATION).toBe(false);

    const parsedDefault = parseEnv({ ...baseEnv });
    expect(parsedDefault.ALLOW_PUBLIC_REGISTRATION).toBe(false);
  });
});
