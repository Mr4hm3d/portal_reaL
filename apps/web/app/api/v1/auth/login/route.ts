import { NextResponse } from 'next/server';

import { authenticateUser, loginSchema, setSessionCookie } from '@portal/auth';
import { defaultRateLimitConfig, rateLimitHeaders, rateLimitRequest } from '@portal/security/rate-limit';

export async function POST(request: Request) {
  const rate = await rateLimitRequest(request, 'auth:login', defaultRateLimitConfig);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait before retrying.' }, {
      status: 429,
      headers: rateLimitHeaders(rate)
    });
  }

  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const { user, sessionToken } = await authenticateUser(parsed.data);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
        roles: user.roles
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
