'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginSchema } from '@portal/auth/schemas';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<{ email: string; password: string }>({
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: ''
    }
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    setError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(t('validationError'));
      return;
    }

    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('unknownError'));
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{t('loginTitle')}</h1>
        <p className="text-sm text-slate-600">{t('loginSubtitle')}</p>
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
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="password">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder="••••••••"
            minLength={8}
            required
            {...register('password')}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {t('loginCta')}
        </button>
      </form>
      <div className="flex flex-col space-y-1 text-sm text-slate-700">
        <p>
          {t('noAccount')}{' '}
          <Link className="font-semibold text-slate-900 hover:underline" href={`/${locale}/register`}>
            {t('register')}
          </Link>
        </p>
        <p>
          <Link className="font-semibold text-slate-900 hover:underline" href={`/${locale}/password-reset`}>
            {t('forgotPassword')}
          </Link>
        </p>
      </div>
    </section>
  );
}
