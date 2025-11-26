import type { Role, User } from '@core-domain/prisma';
import { prisma } from '@core-domain/prisma';

import { getSessionFromCookies } from './session';

export type CurrentUser = Pick<User, 'id' | 'email' | 'name' | 'preferredLanguage' | 'roles' | 'createdAt'>;

export const baseUserSelect: { [K in keyof CurrentUser]: true } = {
  id: true,
  email: true,
  name: true,
  preferredLanguage: true,
  roles: true,
  createdAt: true
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: baseUserSelect
  });

  return user;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error('Unauthorized');
    (err as NodeJS.ErrnoException).code = 'UNAUTHORIZED';
    throw err;
  }
  return user;
}

export async function requireRole(allowedRoles: Array<Role | string>): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  const hasRole = allowedRoles.some((role) => user.roles.includes(role as Role));
  if (!hasRole) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }
  return user;
}
