import crypto from 'node:crypto';

import { prisma } from '@portal/core-domain/prisma';
import type { Role } from '@portal/core-domain/prisma';
import type { SupportedLanguage } from '@portal/core-domain/prisma';
import { parseEnv } from '@portal/config/index';

import { createSessionToken } from './session';
import { hashPassword, verifyPassword } from './password';
import {
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  profileUpdateSchema,
  type LoginInput,
  type RegistrationInput,
  type PasswordResetRequestInput,
  type PasswordResetConfirmInput,
  type ProfileUpdateInput
} from './schemas';
import { renderPasswordResetEmail, sendEmail } from '@portal/email/service';
import { enqueueEmail } from '@portal/jobs/index';
import { baseUserSelect } from './current-user';

export { loginSchema, registrationSchema };

export async function registerUser(input: RegistrationInput) {
  const env = parseEnv();

  if (!env.ALLOW_PUBLIC_REGISTRATION) {
    throw new Error('Registration is disabled');
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      preferredLanguage: (input.preferredLanguage ?? 'hu') as SupportedLanguage,
      roles: ['CLIENT']
    }
  });

  const sessionToken = await createSessionToken({
    sub: user.id,
    roles: user.roles as Role[],
    preferredLanguage: user.preferredLanguage
  });

  return { user, sessionToken };
}

export async function authenticateUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const sessionToken = await createSessionToken({
    sub: user.id,
    roles: user.roles as Role[],
    preferredLanguage: user.preferredLanguage
  });

  return { user, sessionToken };
}

export async function requestPasswordReset(input: PasswordResetRequestInput, baseUrl: string) {
  const parsed = passwordResetRequestSchema.safeParse(input);
  if (!parsed.success) {
    const err = new Error('Invalid payload');
    (err as NodeJS.ErrnoException).code = 'BAD_REQUEST';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    // Avoid leaking user existence
    return;
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null }
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await hashPassword(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt
    }
  });

  const language = user.preferredLanguage === 'en' ? 'en' : 'hu';
  const env = parseEnv();
  const link = `${baseUrl}/password-reset/confirm?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  const copy = renderPasswordResetEmail(language, env.BRANDING_NAME, link);

  try {
    await enqueueEmail({
      to: user.email,
      subject: copy.subject,
      text: copy.text
    });
  } catch (err) {
    await sendEmail({
      to: user.email,
      subject: copy.subject,
      text: copy.text
    });
  }
}

export async function confirmPasswordReset(input: PasswordResetConfirmInput) {
  const parsed = passwordResetConfirmSchema.safeParse(input);
  if (!parsed.success) {
    const err = new Error('Invalid payload');
    (err as NodeJS.ErrnoException).code = 'BAD_REQUEST';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    const err = new Error('Invalid or expired token');
    (err as NodeJS.ErrnoException).code = 'INVALID_TOKEN';
    throw err;
  }

  const tokens = await prisma.passwordResetToken.findMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  let matchedTokenId: string | null = null;
  for (const token of tokens) {
    const matches = await verifyPassword(parsed.data.token, token.tokenHash);
    if (matches) {
      matchedTokenId = token.id;
      break;
    }
  }

  if (!matchedTokenId) {
    const err = new Error('Invalid or expired token');
    (err as NodeJS.ErrnoException).code = 'INVALID_TOKEN';
    throw err;
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } }),
    prisma.passwordResetToken.update({ where: { id: matchedTokenId }, data: { usedAt: new Date() } })
  ]);
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const err = new Error('Invalid payload');
    (err as NodeJS.ErrnoException).code = 'BAD_REQUEST';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  const data: Partial<{ name: string; preferredLanguage: SupportedLanguage; passwordHash: string }> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.preferredLanguage) data.preferredLanguage = parsed.data.preferredLanguage as SupportedLanguage;

  if (parsed.data.newPassword) {
    const valid = await verifyPassword(parsed.data.currentPassword ?? '', user.passwordHash);
    if (!valid) {
      const err = new Error('Invalid current password');
      (err as NodeJS.ErrnoException).code = 'INVALID_PASSWORD';
      throw err;
    }
    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data, select: baseUserSelect });
  return updated;
}
