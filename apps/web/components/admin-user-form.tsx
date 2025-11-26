'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createUserSchema } from '@portal/users/schemas';

const roleOptions = ['ADMIN', 'SUPPORT', 'BILLING', 'CLIENT'] as const;

type RoleOption = (typeof roleOptions)[number];

export function AdminUserForm() {
  const t = useTranslations('adminUsers');
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset
  } = useForm<{
    name: string;
    email: string;
    password: string;
    preferredLanguage: 'hu' | 'en';
    roles: RoleOption[];
  }>({
    defaultValues: {
      preferredLanguage: (locale === 'en' ? 'en' : 'hu') as 'hu' | 'en',
      roles: ['CLIENT']
    }
  });

  const onSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    preferredLanguage: 'hu' | 'en';
    roles: RoleOption[];
  }) => {
    setError(null);
    setSuccess(null);

    const parsed = createUserSchema.safeParse(values);
    if (!parsed.success) {
      setError(t('errorGeneric'));
      return;
    }

    const res = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('errorGeneric'));
      return;
    }

    setSuccess(t('createSuccess'));
    reset({
      name: '',
      email: '',
      password: '',
      preferredLanguage: (locale === 'en' ? 'en' : 'hu') as 'hu' | 'en',
      roles: ['CLIENT']
    });
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="name">
          {t('fields.name')}
        </label>
        <input
          id="name"
          type="text"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('name')}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          {t('fields.email')}
        </label>
        <input
          id="email"
          type="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('email')}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          {t('fields.password')}
        </label>
        <input
          id="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('password')}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="preferredLanguage">
          {t('fields.language')}
        </label>
        <select
          id="preferredLanguage"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('preferredLanguage')}
        >
          <option value="hu">{t('languages.hu')}</option>
          <option value="en">{t('languages.en')}</option>
        </select>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">{t('fields.roles')}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-800 sm:grid-cols-4">
          {roleOptions.map((role) => (
            <label key={role} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 shadow-sm">
              <input type="checkbox" value={role} {...register('roles')} />
              <span>{t(`roles.${role}`)}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-600">{t('roleHint')}</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-70"
      >
        {isSubmitting ? t('creating') : t('createCta')}
      </button>
    </form>
  );
}
