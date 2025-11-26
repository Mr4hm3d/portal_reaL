import { z } from 'zod';

import { Visibility } from '@core-domain/prisma';

export const uploadFileMetadataSchema = z.object({
  ticketId: z.string().optional(),
  serviceId: z.string().optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE)
});

export type UploadFileMetadata = z.infer<typeof uploadFileMetadataSchema>;

export const fileFilterSchema = z.object({
  ticketId: z.string().optional(),
  serviceId: z.string().optional()
});

export type FileFilterInput = z.infer<typeof fileFilterSchema>;
