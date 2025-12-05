'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function TicketForm({ locale }: { locale: string }) {
  const t = useTranslations('tickets');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/v1/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('errorGeneric'));
      setLoading(false);
      return;
    }

    const created = await res.json();
    router.push(`/${locale}/tickets/${created.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
          required
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="priority">
          {t('form.priority')}
        </label>
        <input
          id="priority"
          name="priority"
          type="number"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-70"
      >
        {loading ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
