import { NextResponse } from 'next/server';

import { registrationSchema, registerUser, setSessionCookie } from '@portal/auth';
import { defaultRateLimitConfig, rateLimitHeaders, rateLimitRequest } from '@portal/security/rate-limit';

export async function POST(request: Request) {
  const rate = await rateLimitRequest(request, 'auth:register', defaultRateLimitConfig);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, {
      status: 429,
      headers: rateLimitHeaders(rate)
    });
  }

  const json = await request.json();
  const parseResult = registrationSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
  }

  try {
    const { user, sessionToken } = await registerUser(parseResult.data);
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
    const message = (error as Error).message;
    const status = message === 'Registration is disabled' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
