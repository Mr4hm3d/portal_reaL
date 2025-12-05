import { Visibility, Language } from '@portal/core-domain/prisma';
import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1),
  contentMarkdown: z.string().min(1),
  serviceId: z.string().cuid().optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  language: z.nativeEnum(Language).optional()
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = createArticleSchema.partial();
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const wikiFilterSchema = z.object({
  serviceId: z.string().cuid().optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  language: z.nativeEnum(Language).optional()
});

export type WikiFilterInput = z.infer<typeof wikiFilterSchema>;
