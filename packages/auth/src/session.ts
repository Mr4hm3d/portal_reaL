import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import type { Role } from '@core-domain/prisma';
import { parseEnv } from '@config/index';

export type SessionPayload = {
  sub: string;
  roles: Role[];
  preferredLanguage?: string;
};

function getSecret() {
  const env = parseEnv();
  return {
    secret: new TextEncoder().encode(env.SESSION_SECRET),
    cookieName: env.SESSION_COOKIE_NAME,
    maxAge: env.SESSION_TTL_SECONDS
  };
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const { secret, maxAge } = getSecret();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .setIssuedAt()
    .sign(secret);
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  const { secret } = getSecret();
  try {
    const result = await jwtVerify(token, secret);
    return result.payload as SessionPayload;
  } catch (err) {
    console.warn('Invalid session token', err);
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const { cookieName, maxAge } = getSecret();
  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge
  });
}

export function clearSessionCookie(): void {
  const { cookieName } = getSecret();
  cookies().set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const { cookieName } = getSecret();
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  return readSessionToken(token);
}
