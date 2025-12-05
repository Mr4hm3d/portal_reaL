'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

export function AccountPasswordForm() {
  const t = useTranslations('account');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState, reset } = useForm<PasswordFormValues>();

  const onSubmit = async (values: PasswordFormValues) => {
    setError(null);
    setSuccess(null);

    if (!values.currentPassword || !values.newPassword || values.newPassword.length < 8) {
      setError(t('passwordError'));
      return;
    }

    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t('passwordError'));
      return;
    }

    setSuccess(t('passwordSuccess'));
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="currentPassword">
          {t('currentPassword')}
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('currentPassword')}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="newPassword">
          {t('newPassword')}
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
          {...register('newPassword')}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
      >
        {t('savePassword')}
      </button>
    </form>
  );
}
