import { NextResponse } from 'next/server';

import { confirmPasswordReset, passwordResetConfirmSchema } from '@auth';
import { defaultRateLimitConfig, rateLimitHeaders, rateLimitRequest } from '@security/rate-limit';

export async function POST(request: Request) {
  const rate = await rateLimitRequest(request, 'auth:password-reset-confirm', defaultRateLimitConfig);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait before retrying.' }, {
      status: 429,
      headers: rateLimitHeaders(rate)
    });
  }

  const payload = await request.json();
  const parsed = passwordResetConfirmSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    await confirmPasswordReset(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error & { code?: string };
    const status = err.code === 'INVALID_TOKEN' ? 400 : err.code === 'BAD_REQUEST' ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
