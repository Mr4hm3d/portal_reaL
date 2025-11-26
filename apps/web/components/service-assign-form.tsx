'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export type ClientOption = { id: string; email: string; name: string | null; roles: string[] };
export type TemplateOption = { id: string; title: string };

export function ServiceAssignForm({
  templates,
  clients,
  locale
}: {
  templates: TemplateOption[];
  clients: ClientOption[];
  locale: string;
}) {
  const t = useTranslations('services');
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const defaultClientId = clients.find((client) => client.roles.includes('CLIENT'))?.id ?? '';
  const [clientId, setClientId] = useState(defaultClientId);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientOptions = useMemo(() => clients.filter((client) => client.roles.includes('CLIENT')), [clients]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!templateId || !clientId) {
      setError(t('assign.missingSelection'));
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/v1/services/${templateId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('assign.error'));
      setLoading(false);
      return;
    }

    router.refresh();
    router.push(`/${locale}/services`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="template">
          {t('assign.template')}
        </label>
        <select
          id="template"
          name="template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          {templates.length === 0 ? (
            <option value="">{t('assign.noTemplates')}</option>
          ) : (
            templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="client">
          {t('assign.client')}
        </label>
        <select
          id="client"
          name="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          {clientOptions.length === 0 ? (
            <option value="">{t('assign.noClients')}</option>
          ) : (
            clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name || client.email}
              </option>
            ))
          )}
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || templates.length === 0 || clientOptions.length === 0}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-70"
      >
        {loading ? t('assign.submitting') : t('assign.submit')}
      </button>
    </form>
  );
}
