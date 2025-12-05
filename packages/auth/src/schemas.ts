import { z } from 'zod';

export const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  preferredLanguage: z.enum(['hu', 'en']).optional()
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(8)
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

export const profileUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    preferredLanguage: z.enum(['hu', 'en']).optional(),
    currentPassword: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional()
  })
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: 'Current password is required',
    path: ['currentPassword']
  })
  .refine((data) => !!data.name || !!data.preferredLanguage || !!data.newPassword, {
    message: 'No changes provided'
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
