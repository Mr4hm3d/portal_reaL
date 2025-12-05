import { z } from 'zod';

import type { ServiceType } from '@portal/core-domain/prisma';

const serviceTypeEnum = z.enum(['MONTHLY', 'ONE_TIME', 'CUSTOM'] satisfies ServiceType[]);

export const createServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: serviceTypeEnum,
  price: z.number().nonnegative(),
  metadata: z.record(z.any()).optional()
});

export const updateServiceSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    type: serviceTypeEnum.optional(),
    price: z.number().nonnegative().optional(),
    metadata: z.record(z.any()).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided to update' });

export const assignServiceSchema = z.object({
  clientId: z.string().min(1)
});

export const serviceFilterSchema = z.object({
  clientId: z.string().min(1).optional(),
  type: serviceTypeEnum.optional()
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type AssignServiceInput = z.infer<typeof assignServiceSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
