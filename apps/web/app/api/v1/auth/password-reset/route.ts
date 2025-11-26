import { NextResponse } from 'next/server';

import { parseEnv } from '@portal/config/index';
import { passwordResetRequestSchema, requestPasswordReset } from '@portal/auth';
import { defaultRateLimitConfig, rateLimitHeaders, rateLimitRequest } from '@portal/security/rate-limit';

export async function POST(request: Request) {
  const rate = await rateLimitRequest(request, 'auth:password-reset-request', defaultRateLimitConfig);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many password reset requests. Please try again later.' }, {
      status: 429,
      headers: rateLimitHeaders(rate)
    });
  }

  const payload = await request.json();
  const parsed = passwordResetRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const env = parseEnv();
    await requestPasswordReset(parsed.data, env.APP_BASE_URL);
  } catch (error) {
    const err = error as Error & { code?: string };
    const status = err.code === 'BAD_REQUEST' ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
