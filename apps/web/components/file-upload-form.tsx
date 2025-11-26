'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Visibility } from '@portal/core-domain/prisma';

interface Option {
  id: string;
  label: string;
}

interface FileUploadFormProps {
  locale: string;
  tickets: Option[];
  services: Option[];
}

export function FileUploadForm({ locale, tickets, services }: FileUploadFormProps) {
  const t = useTranslations('files');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [ticketId, setTicketId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.PRIVATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(t('errors.missingFile'));
      return;
    }

    setLoading(true);
    setError(null);

    const data = new FormData();
    data.set('file', file);
    if (ticketId) data.set('ticketId', ticketId);
    if (serviceId) data.set('serviceId', serviceId);
    data.set('visibility', visibility);

    const res = await fetch('/api/v1/files', {
      method: 'POST',
      body: data
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error || t('errors.generic'));
      setLoading(false);
      return;
    }

    setFile(null);
    setTicketId('');
    setServiceId('');
    setVisibility(Visibility.PRIVATE);
    router.refresh();
    router.push(`/${locale}/files`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="file">
          {t('form.file')}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="ticketId">
            {t('form.ticket')}
          </label>
          <select
            id="ticketId"
            name="ticketId"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="">{t('form.noTicket')}</option>
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600">{t('form.ticketHint')}</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="serviceId">
            {t('form.service')}
          </label>
          <select
            id="serviceId"
            name="serviceId"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="">{t('form.noService')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600">{t('form.serviceHint')}</p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="visibility">
          {t('form.visibility')}
        </label>
        <select
          id="visibility"
          name="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          {Object.values(Visibility).map((option) => (
            <option key={option} value={option}>
              {t(`visibility.${option}` as const)}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-600">{t('form.visibilityHint')}</p>
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
