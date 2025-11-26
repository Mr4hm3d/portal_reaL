import { Prisma, Visibility, prisma, type Role } from '@core-domain/prisma';

import type { CurrentUser } from '@auth/current-user';

import type {
  CreateArticleInput,
  UpdateArticleInput,
  WikiFilterInput
} from './schemas';

function isStaff(user: CurrentUser) {
  return user.roles.includes('ADMIN' as Role) || user.roles.includes('SUPPORT' as Role);
}

const wikiSelect = {
  id: true,
  title: true,
  contentMarkdown: true,
  serviceId: true,
  service: { select: { title: true } },
  visibility: true,
  language: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.WikiArticleSelect;

export async function listWikiArticles(currentUser: CurrentUser, filters: WikiFilterInput) {
  const where: Prisma.WikiArticleWhereInput = {};

  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.visibility) where.visibility = filters.visibility as Visibility;
  if (filters.language) where.language = filters.language;

  if (!isStaff(currentUser)) {
    where.visibility = filters.visibility ?? { in: [Visibility.PUBLIC, Visibility.CLIENT_ONLY] };
    where.AND = [
      {
        OR: [
          { service: { clientId: currentUser.id } },
          { serviceId: null }
        ]
      }
    ];
  }

  return prisma.wikiArticle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: wikiSelect
  });
}

export async function getWikiArticle(currentUser: CurrentUser, id: string) {
  const where: Prisma.WikiArticleWhereInput = { id };

  if (!isStaff(currentUser)) {
    where.visibility = { in: [Visibility.PUBLIC, Visibility.CLIENT_ONLY] };
    where.AND = [
      {
        OR: [
          { service: { clientId: currentUser.id } },
          { serviceId: null }
        ]
      }
    ];
  }

  return prisma.wikiArticle.findFirst({ where, select: wikiSelect });
}

export async function createWikiArticle(currentUser: CurrentUser, input: CreateArticleInput) {
  if (!isStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  return prisma.wikiArticle.create({
    data: {
      title: input.title,
      contentMarkdown: input.contentMarkdown,
      serviceId: input.serviceId,
      visibility: (input.visibility ?? Visibility.PUBLIC) as Visibility,
      language: input.language ?? 'hu'
    },
    select: wikiSelect
  });
}

export async function updateWikiArticle(
  currentUser: CurrentUser,
  id: string,
  input: UpdateArticleInput
) {
  if (!isStaff(currentUser)) {
    const err = new Error('Forbidden');
    (err as NodeJS.ErrnoException).code = 'FORBIDDEN';
    throw err;
  }

  try {
    return await prisma.wikiArticle.update({
      where: { id },
      data: {
        ...('title' in input ? { title: input.title } : {}),
        ...('contentMarkdown' in input ? { contentMarkdown: input.contentMarkdown } : {}),
        ...('serviceId' in input ? { serviceId: input.serviceId } : {}),
        ...('visibility' in input ? { visibility: input.visibility as Visibility } : {}),
        ...('language' in input ? { language: input.language } : {})
      },
      select: wikiSelect
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
