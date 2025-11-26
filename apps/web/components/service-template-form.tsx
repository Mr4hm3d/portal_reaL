'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import type { ServiceType } from '@core-domain/prisma';

export function ServiceTemplateForm({ locale }: { locale: string }) {
  const t = useTranslations('services');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ServiceType>('ONE_TIME');
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let metadataValue: Record<string, unknown> | undefined;
    if (metadata.trim()) {
      try {
        metadataValue = JSON.parse(metadata);
      } catch (err) {
        setError(t('form.invalidMetadata'));
        setLoading(false);
        return;
      }
    }

    const payload = {
      title,
      description,
      type,
      price: Number(price) || 0,
      ...(metadataValue ? { metadata: metadataValue } : {})
    };

    const res = await fetch('/api/v1/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('form.error'));
      setLoading(false);
      return;
    }

    setTitle('');
    setDescription('');
    setPrice('');
    setMetadata('');
    router.refresh();
    router.push(`/${locale}/services`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="title">
          {t('form.title')}
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="description">
          {t('form.description')}
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="type">
            {t('form.type')}
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ServiceType)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="MONTHLY">{t('form.types.MONTHLY')}</option>
            <option value="ONE_TIME">{t('form.types.ONE_TIME')}</option>
            <option value="CUSTOM">{t('form.types.CUSTOM')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="price">
            {t('form.price')}
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="metadata">
          {t('form.metadata')}
        </label>
        <textarea
          id="metadata"
          name="metadata"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          rows={3}
          placeholder="{\n  \"note\": \"optional metadata\"\n}"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-70"
      >
        {loading ? t('form.submitting') : t('form.submit')}
      </button>
    </form>
  );
}
