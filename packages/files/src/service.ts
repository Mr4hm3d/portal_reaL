import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { CurrentUser } from '@auth/current-user';
import { parseEnv } from '@config/index';
import { Prisma, prisma, Visibility, type Role } from '@core-domain/prisma';

import type { FileFilterInput, UploadFileMetadata } from './schemas';

const staffRoles: Role[] = ['ADMIN', 'SUPPORT', 'BILLING'];

function isStaff(user: CurrentUser) {
  return user.roles.some((role) => staffRoles.includes(role as Role));
}

const fileSelect = {
  id: true,
  filename: true,
  mimeType: true,
  size: true,
  visibility: true,
  ticketId: true,
  serviceId: true,
  owner: { select: { id: true, email: true, name: true } },
  createdAt: true
} satisfies Prisma.FileSelect;

const fileWithRelationsSelect = {
  id: true,
  filename: true,
  mimeType: true,
  size: true,
  visibility: true,
  relativePath: true,
  ownerId: true,
  ticket: { select: { createdById: true } },
  service: { select: { clientId: true } }
} satisfies Prisma.FileSelect;

type FileWithRelations = Prisma.FileGetPayload<{ select: typeof fileWithRelationsSelect }>;

function storageRoot() {
  const env = parseEnv();
  return env.FILE_STORAGE_ROOT;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function canAccessFile(user: CurrentUser, file: FileWithRelations) {
  if (isStaff(user)) return true;

  if (file.ownerId === user.id) return true;
  if (file.visibility === Visibility.INTERNAL) return false;
  if (file.visibility === Visibility.PRIVATE) return false;

  if (file.ticket && file.ticket.createdById === user.id) return true;
  if (file.service && file.service.clientId === user.id) return true;

  return file.visibility === Visibility.PUBLIC;
}

async function ensureAssociations(currentUser: CurrentUser, metadata: UploadFileMetadata) {
  if (metadata.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: metadata.ticketId },
      select: { createdById: true }
    });

    if (!ticket) {
      const err = new Error('Ticket not found');
      (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
      throw err;
    }

    if (!isStaff(currentUser) && ticket.createdById !== currentUser.id) {
      const err = new Error('Forbidden');
      (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
      throw err;
    }
  }

  if (metadata.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: metadata.serviceId },
      select: { clientId: true }
    });

    if (!service) {
      const err = new Error('Service not found');
      (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
      throw err;
    }

    if (!isStaff(currentUser) && service.clientId !== currentUser.id) {
      const err = new Error('Forbidden');
      (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
      throw err;
    }
  }
}

export async function saveUploadedFile(currentUser: CurrentUser, file: File, metadata: UploadFileMetadata) {
  await ensureAssociations(currentUser, metadata);

  const root = storageRoot();
  const filename = sanitizeFilename(file.name) || 'upload';
  const relativePath = path.join(currentUser.id, `${Date.now()}-${randomUUID()}-${filename}`);
  const absolutePath = path.join(root, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  const created = await prisma.file.create({
    data: {
      filename,
      relativePath,
      mimeType: file.type || 'application/octet-stream',
      size: buffer.byteLength,
      ownerId: currentUser.id,
      visibility: metadata.visibility,
      ticketId: metadata.ticketId,
      serviceId: metadata.serviceId
    },
    select: fileSelect
  });

  return created;
}

export async function listFiles(currentUser: CurrentUser, filters: FileFilterInput) {
  const where: Prisma.FileWhereInput = {};

  if (filters.ticketId) where.ticketId = filters.ticketId;
  if (filters.serviceId) where.serviceId = filters.serviceId;

  if (!isStaff(currentUser)) {
    where.AND = [
      { visibility: { not: Visibility.INTERNAL } },
      {
        OR: [
          { ownerId: currentUser.id },
          { ticket: { createdById: currentUser.id } },
          { service: { clientId: currentUser.id } }
        ]
      }
    ];
  }

  return prisma.file.findMany({ where, orderBy: { createdAt: 'desc' }, select: fileSelect });
}

async function getFileWithAccess(currentUser: CurrentUser, id: string) {
  const file = await prisma.file.findUnique({ where: { id }, select: fileWithRelationsSelect });
  if (!file) {
    const err = new Error('Not found');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  if (!canAccessFile(currentUser, file)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  return file;
}

export async function getFilePathForDownload(currentUser: CurrentUser, id: string) {
  const file = await getFileWithAccess(currentUser, id);
  return { file, absolutePath: path.join(storageRoot(), file.relativePath) };
}

export async function deleteFile(currentUser: CurrentUser, id: string) {
  const file = await getFileWithAccess(currentUser, id);

  if (!isStaff(currentUser) && file.ownerId !== currentUser.id) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  const absolutePath = path.join(storageRoot(), file.relativePath);
  await prisma.file.delete({ where: { id } });
  await fs.rm(absolutePath, { force: true });
}
