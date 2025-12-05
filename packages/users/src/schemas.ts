import { z } from 'zod';

import type { Role, SupportedLanguage } from '@portal/core-domain/prisma';

export const baseUserFields = {
  id: true,
  email: true,
  name: true,
  preferredLanguage: true,
  roles: true,
  createdAt: true,
  updatedAt: true
} as const;

const roleEnum = z.enum(['ADMIN', 'SUPPORT', 'BILLING', 'CLIENT'] satisfies Role[]);

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  preferredLanguage: z.enum(['hu', 'en'] satisfies SupportedLanguage[]).default('hu'),
  roles: z.array(roleEnum).min(1).default(['CLIENT'])
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    preferredLanguage: z.enum(['hu', 'en'] satisfies SupportedLanguage[]).optional(),
    roles: z.array(roleEnum).min(1).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided to update' });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
