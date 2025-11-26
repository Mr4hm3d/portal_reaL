import { z } from 'zod';

import { BillingStatus } from '@portal/core-domain/prisma';

export const createBillingRequestSchema = z.object({
  clientId: z.string(),
  serviceId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('HUF'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
});

export type CreateBillingRequestInput = z.infer<typeof createBillingRequestSchema>;

export const billingRequestFilterSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.nativeEnum(BillingStatus).optional()
});

export type BillingRequestFilterInput = z.infer<typeof billingRequestFilterSchema>;

export const updateBillingRequestSchema = z.object({
  status: z.nativeEnum(BillingStatus).optional(),
  pdfRelativePath: z.string().optional(),
  billingoInvoiceId: z.string().optional(),
  invoicePdfRelativePath: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
});

export type UpdateBillingRequestInput = z.infer<typeof updateBillingRequestSchema>;

export const startPaymentSchema = z.object({
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
  locale: z.enum(['hu-HU', 'en-US']).optional(),
  customerEmail: z.string().email().optional()
});

export type StartPaymentInput = z.infer<typeof startPaymentSchema>;

export const createInvoiceSchema = z.object({
  billingRequestId: z.string()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
