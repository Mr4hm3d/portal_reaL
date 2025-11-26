'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Visibility } from '@portal/core-domain/prisma';

interface ServiceOption {
  id: string;
  title: string;
}

interface WikiFormProps {
  locale: string;
  services: ServiceOption[];
}

export function WikiForm({ locale, services }: WikiFormProps) {
  const t = useTranslations('wiki.form');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.PUBLIC);
  const [language, setLanguage] = useState(locale === 'en' ? 'en' : 'hu');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/v1/wiki', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          contentMarkdown: content,
          serviceId: serviceId || undefined,
          visibility,
          language
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      setTitle('');
      setContent('');
      setServiceId('');
      setVisibility(Visibility.PUBLIC);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">{t('label')}</p>
        <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          {t('fields.title')}
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          {t('fields.service')}
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">{t('placeholders.service')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        {t('fields.content')}
        <textarea
          className="min-h-[120px] rounded border border-slate-300 px-3 py-2 text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          {t('fields.visibility')}
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
          >
            <option value={Visibility.PUBLIC}>{t('visibility.PUBLIC')}</option>
            <option value={Visibility.CLIENT_ONLY}>{t('visibility.CLIENT_ONLY')}</option>
            <option value={Visibility.INTERNAL}>{t('visibility.INTERNAL')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          {t('fields.language')}
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="hu">{t('languages.hu')}</option>
            <option value="en">{t('languages.en')}</option>
          </select>
        </label>
        <div className="flex items-end justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={submitting}
          >
            {submitting ? t('actions.submitting') : t('actions.submit')}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{t('success')}</p>}
    </form>
  );
}

