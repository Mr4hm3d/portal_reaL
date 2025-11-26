import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .transform((value) => (!value ? undefined : value)),
  APP_BASE_URL: z.string().url(),
  FILE_STORAGE_ROOT: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  BILLINGO_API_KEY: z.string().optional(),
  BILLINGO_API_URL: z.string().url().optional(),
  BARION_POSKEY: z.string().optional(),
  BARION_API_URL: z.string().url().optional(),
  BARION_PAYEE: z.string().optional(),
  BARION_WEBHOOK_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('portal_session'),
  SESSION_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(15),
  ALLOW_PUBLIC_REGISTRATION: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === 'true' || v === true)
    .default(false),
  BRANDING_NAME: z.string().default('Portal'),
  BRANDING_PRIMARY_COLOR: z.string().default('#0f172a')
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input = process.env): Env {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  return result.data;
}
