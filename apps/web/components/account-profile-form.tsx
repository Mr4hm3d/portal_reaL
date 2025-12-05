'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { SupportedLanguage } from '@portal/core-domain/prisma';

type ProfileFormValues = {
  name: string;
  preferredLanguage: SupportedLanguage;
};

export function AccountProfileForm({
  name,
  email,
  preferredLanguage
}: {
  name: string;
  email: string;
  preferredLanguage: SupportedLanguage;
}) {
  const t = useTranslations('account');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<ProfileFormValues>({
    defaultValues: {
      name,
      preferredLanguage
    }
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setError(null);
    setSuccess(null);

    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('unknownError'));
      return;
    }

    setSuccess(t('profileSuccess'));
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="name">
          {t('nameLabel')}
        </label>
        <input
          id="name"
          type="text"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          required
          {...register('name')}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="preferredLanguage">
          {t('languageLabel')}
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
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {t('saveProfile')}
        </button>
        <p className="text-xs text-slate-500">{t('subtitle')}</p>
      </div>
    </form>
  );
}
