import { Prisma, prisma, type Role, ServiceType } from '@portal/core-domain/prisma';

import type { CurrentUser } from '@portal/auth/current-user';

import type {
  AssignServiceInput,
  CreateServiceInput,
  ServiceFilterInput,
  UpdateServiceInput
} from './schemas';

function isAdmin(user: CurrentUser) {
  return user.roles.includes('ADMIN' as Role);
}

function isStaff(user: CurrentUser) {
  return (
    user.roles.includes('ADMIN' as Role) ||
    user.roles.includes('SUPPORT' as Role) ||
    user.roles.includes('BILLING' as Role)
  );
}

const serviceSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  price: true,
  metadata: true,
  client: { select: { id: true, email: true, name: true } },
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ServiceSelect;

export async function listServices(currentUser: CurrentUser, filters: ServiceFilterInput) {
  const where: Prisma.ServiceWhereInput = {};

  if (!isStaff(currentUser)) {
    where.clientId = currentUser.id;
  } else if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.type) where.type = filters.type as ServiceType;

  return prisma.service.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: serviceSelect
  });
}

export async function getServiceById(currentUser: CurrentUser, id: string) {
  const where: Prisma.ServiceWhereInput = { id };

  if (!isStaff(currentUser)) {
    where.clientId = currentUser.id;
  }

  return prisma.service.findFirst({ where, select: serviceSelect });
}

export async function createServiceTemplate(currentUser: CurrentUser, input: CreateServiceInput) {
  if (!isAdmin(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  return prisma.service.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type as ServiceType,
      price: new Prisma.Decimal(input.price),
      metadata: input.metadata
    },
    select: serviceSelect
  });
}

export async function updateService(currentUser: CurrentUser, id: string, input: UpdateServiceInput) {
  if (!isAdmin(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  try {
    return await prisma.service.update({
      where: { id },
      data: {
        ...('title' in input ? { title: input.title } : {}),
        ...('description' in input ? { description: input.description } : {}),
        ...('type' in input ? { type: input.type as ServiceType } : {}),
        ...('price' in input ? { price: new Prisma.Decimal(input.price!) } : {}),
        ...('metadata' in input ? { metadata: input.metadata } : {})
      },
      select: serviceSelect
    });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'P2025') {
      const notFound = new Error('Not found');
      (notFound as NodeJS.ErrnoException).code = 'NOT_FOUND';
      throw notFound;
    }
    throw error;
  }
}

export async function assignServiceToClient(
  currentUser: CurrentUser,
  serviceId: string,
  input: AssignServiceInput
) {
  if (!isAdmin(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  const template = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      title: true,
      description: true,
      type: true,
      price: true,
      metadata: true
    }
  });

  if (!template) {
    const notFound = new Error('Not found');
    (notFound as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw notFound;
  }

  return prisma.service.create({
    data: {
      title: template.title,
      description: template.description,
      type: template.type,
      price: template.price,
      metadata: template.metadata,
      clientId: input.clientId
    },
    select: serviceSelect
  });
}
