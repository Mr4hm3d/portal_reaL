import {
  PrismaClient,
  Prisma,
  Role,
  TicketStatus,
  ServiceType,
  BillingStatus,
  Visibility,
  Language,
  PaymentStatus,
  PaymentProvider
} from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client to be shared across packages and app routes.
 */
export const prisma = globalThis.prisma ?? new PrismaClient({});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { Prisma, Role, TicketStatus, ServiceType, BillingStatus, Visibility, Language, PaymentStatus, PaymentProvider };
