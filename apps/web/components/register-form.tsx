'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { registrationSchema } from '@auth/schemas';

export function RegisterForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<{ name: string; email: string; password: string; preferredLanguage?: 'hu' | 'en' }>({
    defaultValues: {
      preferredLanguage: (locale === 'en' ? 'en' : 'hu') as 'hu' | 'en'
    }
  });

  const onSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: 'hu' | 'en';
  }) => {
    setError(null);
    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) {
      setError(t('validationError'));
      return;
    }

    const res = await fetch('/api/v1/auth/register', {
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
        <h1 className="text-2xl font-semibold text-slate-900">{t('registerTitle')}</h1>
        <p className="text-sm text-slate-600">{t('registerSubtitle')}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="name">
            {t('name')}
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder={t('namePlaceholder')}
            required
            {...register('name')}
          />
        </div>
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
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="preferredLanguage">
            {t('languagePreference')}
          </label>
          <select
            id="preferredLanguage"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            {...register('preferredLanguage')}
          >
            <option value="hu">{t('languageHu')}</option>
            <option value="en">{t('languageEn')}</option>
          </select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {t('registerCta')}
        </button>
      </form>
      <p className="text-sm text-slate-700">
        {t('haveAccount')}{' '}
        <Link className="font-semibold text-slate-900 hover:underline" href={`/${locale}/login`}>
          {t('login')}
        </Link>
      </p>
    </section>
  );
}
