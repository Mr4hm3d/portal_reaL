'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { passwordResetRequestSchema } from '@portal/auth/schemas';

export default function PasswordResetRequestPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<{ email: string }>();

  const onSubmit = async (values: { email: string }) => {
    setMessage(null);
    setError(null);
    const parsed = passwordResetRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError(t('validationError'));
      return;
    }

    const res = await fetch('/api/v1/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('unknownError'));
      return;
    }

    setMessage(t('resetEmailSent'));
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('resetTitle')}</h1>
        <p className="text-sm text-slate-600">{t('resetSubtitle')}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="email">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder="you@example.com"
            required
            {...register('email')}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {t('resetCta')}
        </button>
      </form>
      <p className="text-sm text-slate-700">
        <button
          type="button"
          className="font-semibold text-slate-900 hover:underline"
          onClick={() => router.push(`/${locale}/login`)}
        >
          {t('backToLogin')}
        </button>
      </p>
    </section>
  );
}
