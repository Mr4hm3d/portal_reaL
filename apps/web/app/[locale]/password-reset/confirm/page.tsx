'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { passwordResetConfirmSchema } from '@portal/auth/schemas';

export default function PasswordResetConfirmPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const { register, handleSubmit, formState, reset } = useForm<{ email: string; token: string; newPassword: string }>( {
    defaultValues: { email, token, newPassword: '' }
  });

  const onSubmit = async (values: { email: string; token: string; newPassword: string }) => {
    setError(null);
    setMessage(null);
    const parsed = passwordResetConfirmSchema.safeParse(values);
    if (!parsed.success) {
      setError(t('validationError'));
      return;
    }

    const res = await fetch('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('unknownError'));
      return;
    }

    setMessage(t('resetSuccess'));
    reset({ email: parsed.data.email, token: parsed.data.token, newPassword: '' });
    setTimeout(() => router.push(`/${locale}/login`), 1500);
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('resetConfirmTitle')}</h1>
        <p className="text-sm text-slate-600">{t('resetConfirmSubtitle')}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('token')} />
        <input type="hidden" {...register('email')} />
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="newPassword">
            {t('newPassword')}
          </label>
          <input
            id="newPassword"
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder="••••••••"
            minLength={8}
            required
            {...register('newPassword')}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {t('resetConfirmCta')}
        </button>
      </form>
    </section>
  );
}
