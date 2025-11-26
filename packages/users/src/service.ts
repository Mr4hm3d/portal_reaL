import { prisma } from '@portal/core-domain/prisma';

import { hashPassword } from '@portal/auth/password';

import { baseUserFields, type CreateUserInput, type UpdateUserInput } from './schemas';

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: baseUserFields
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: baseUserFields });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      preferredLanguage: input.preferredLanguage,
      roles: input.roles
    },
    select: baseUserFields
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const data: Partial<CreateUserInput> & { passwordHash?: string } = {};

  if (input.email) data.email = input.email;
  if (input.name) data.name = input.name;
  if (input.preferredLanguage) data.preferredLanguage = input.preferredLanguage;
  if (input.roles) data.roles = input.roles;

  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
  }

  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: baseUserFields
    });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'P2025') {
      throw new Error('User not found');
    }
    if (err.code === 'P2002') {
      throw new Error('Email already in use');
    }
    throw error;
  }
}
