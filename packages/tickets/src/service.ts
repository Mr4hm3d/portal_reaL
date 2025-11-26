import { Prisma, prisma, TicketStatus, type Role } from '@core-domain/prisma';

import { type CurrentUser } from '@auth/current-user';

import { parseEnv } from '@config/index';
import {
  renderTicketCreatedEmail,
  renderTicketReplyEmail,
  renderTicketStatusEmail,
  sendEmail
} from '@email/service';
import { enqueueEmail } from '@jobs/index';

import {
  type CreateTicketInput,
  type TicketFilterInput,
  type TicketMessageInput,
  type UpdateTicketInput
} from './schemas';

function isStaff(user: CurrentUser) {
  return user.roles.includes('ADMIN' as Role) || user.roles.includes('SUPPORT' as Role);
}

const ticketSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, email: true, name: true, preferredLanguage: true } },
  assignedTo: { select: { id: true, email: true, name: true, preferredLanguage: true } },
  service: { select: { id: true, title: true } }
} satisfies Prisma.TicketSelect;

const messageSelect = {
  id: true,
  ticketId: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, email: true, name: true, preferredLanguage: true } }
} satisfies Prisma.TicketMessageSelect;

function toLanguage(preferred?: string | null) {
  return preferred === 'en' ? 'en' : 'hu';
}

function ticketLink(language: string, ticketId: string) {
  const env = parseEnv();
  const base = env.APP_BASE_URL.replace(/\/$/, '');
  return `${base}/${language}/tickets/${ticketId}`;
}

async function notifyTicketCreated(ticket: Prisma.TicketGetPayload<{ select: typeof ticketSelect }>) {
  const env = parseEnv();
  const recipients = [ticket.createdBy, ticket.assignedTo].filter(Boolean) as typeof ticket.createdBy[];
  const seen = new Set<string>();

  await Promise.all(
    recipients.map((recipient) => {
      if (seen.has(recipient.email)) return;
      seen.add(recipient.email);
      const language = toLanguage(recipient.preferredLanguage);
      const copy = renderTicketCreatedEmail(language, env.BRANDING_NAME, ticket.title, ticketLink(language, ticket.id));
      return enqueueEmail({ to: recipient.email, subject: copy.subject, text: copy.text }).catch(() =>
        sendEmail({ to: recipient.email, subject: copy.subject, text: copy.text })
      );
    })
  );
}

async function notifyTicketReply(
  ticket: Prisma.TicketGetPayload<{ select: typeof ticketSelect }>,
  message: Prisma.TicketMessageGetPayload<{ select: typeof messageSelect }>
) {
  const env = parseEnv();
  const participants = [ticket.createdBy, ticket.assignedTo].filter(Boolean) as typeof ticket.createdBy[];
  const seen = new Set<string>();

  await Promise.all(
    participants.map((recipient) => {
      if (recipient.email === message.author.email) return;
      if (seen.has(recipient.email)) return;
      seen.add(recipient.email);
      const language = toLanguage(recipient.preferredLanguage);
      const copy = renderTicketReplyEmail(
        language,
        env.BRANDING_NAME,
        ticket.title,
        message.author.name ?? message.author.email,
        ticketLink(language, ticket.id)
      );
      return enqueueEmail({ to: recipient.email, subject: copy.subject, text: copy.text }).catch(() =>
        sendEmail({ to: recipient.email, subject: copy.subject, text: copy.text })
      );
    })
  );
}

async function notifyTicketStatus(ticket: Prisma.TicketGetPayload<{ select: typeof ticketSelect }>) {
  const env = parseEnv();
  const recipients = [ticket.createdBy, ticket.assignedTo].filter(Boolean) as typeof ticket.createdBy[];
  const seen = new Set<string>();

  await Promise.all(
    recipients.map((recipient) => {
      if (seen.has(recipient.email)) return;
      seen.add(recipient.email);
      const language = toLanguage(recipient.preferredLanguage);
      const copy = renderTicketStatusEmail(
        language,
        env.BRANDING_NAME,
        ticket.title,
        ticket.status,
        ticketLink(language, ticket.id)
      );
      return enqueueEmail({ to: recipient.email, subject: copy.subject, text: copy.text }).catch(() =>
        sendEmail({ to: recipient.email, subject: copy.subject, text: copy.text })
      );
    })
  );
}

export async function listTickets(currentUser: CurrentUser, filters: TicketFilterInput) {
  const where: Prisma.TicketWhereInput = {};

  if (!isStaff(currentUser)) {
    where.createdById = currentUser.id;
  } else {
    if (filters.clientId) where.createdById = filters.clientId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (typeof filters.priority === 'number') where.priority = filters.priority;

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: ticketSelect
  });
}

export async function createTicket(currentUser: CurrentUser, input: CreateTicketInput) {
  if (input.serviceId && !isStaff(currentUser)) {
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { clientId: true }
    });
    if (!service || service.clientId !== currentUser.id) {
      throw new Error('Forbidden');
    }
  }

  return prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority ?? 0,
      serviceId: input.serviceId,
      createdById: currentUser.id,
      status: TicketStatus.OPEN
    },
    select: ticketSelect
  }).then(async (ticket) => {
    await notifyTicketCreated(ticket);
    return ticket;
  });
}

export async function getTicketById(currentUser: CurrentUser, id: string) {
  const where: Prisma.TicketWhereInput = { id };

  if (!isStaff(currentUser)) {
    where.createdById = currentUser.id;
  }

  return prisma.ticket.findFirst({ where, select: ticketSelect });
}

export async function addTicketMessage(currentUser: CurrentUser, ticketId: string, input: TicketMessageInput) {
  const ticket = await getTicketById(currentUser, ticketId);
  if (!ticket) {
    throw new Error('Not found');
  }

  return prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId: currentUser.id,
      content: input.content
    },
    select: messageSelect
  }).then(async (message) => {
    await notifyTicketReply(ticket, message);
    return message;
  });
}

export async function updateTicket(currentUser: CurrentUser, id: string, input: UpdateTicketInput) {
  if (!isStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  try {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: input.status,
        assignedToId: input.assignedToId
      },
      select: ticketSelect
    });

    await notifyTicketStatus(updated);
    return updated;
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

export async function listTicketMessages(currentUser: CurrentUser, ticketId: string) {
  const ticket = await getTicketById(currentUser, ticketId);
  if (!ticket) {
    throw new Error('Not found');
  }

  return prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    select: messageSelect
  });
}
