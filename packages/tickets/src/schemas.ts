import { z } from 'zod';

import { TicketStatus } from '@portal/core-domain/prisma';

export const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  serviceId: z.string().optional(),
  priority: z.number().int().min(0).max(5).optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const ticketFilterSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  serviceId: z.string().optional(),
  clientId: z.string().optional(),
  priority: z.number().int().min(0).max(5).optional()
});

export type TicketFilterInput = z.infer<typeof ticketFilterSchema>;

export const ticketMessageSchema = z.object({
  content: z.string().min(1)
});

export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;

export const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  assignedToId: z.string().optional()
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
