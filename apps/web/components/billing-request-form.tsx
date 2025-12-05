'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type ClientOption = {
  id: string;
  name: string | null;
  email: string;
};

type ServiceOption = {
  id: string;
  title: string;
  clientId: string | null;
};

export function BillingRequestForm({
  clients,
  services
}: {
  clients: ClientOption[];
  services: ServiceOption[];
}) {
  const t = useTranslations('billing');
  const router = useRouter();

  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [serviceId, setServiceId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('HUF');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredServices = useMemo(
    () => services.filter((service) => !clientId || service.clientId === clientId),
    [clientId, services]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload: Record<string, unknown> = {
      clientId,
      amount: Number(amount),
      currency,
      dueDate: dueDate || undefined,
      notes: notes || undefined
    };

    if (serviceId) {
      payload.serviceId = serviceId;
    }

    const res = await fetch('/api/v1/billing/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('errorGeneric'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setAmount('');
    setCurrency('HUF');
    setDueDate('');
    setNotes('');
    setServiceId('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="clientId">
          {t('form.client')}
        </label>
        <select
          id="clientId"
          name="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>
            {t('form.clientPlaceholder')}
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name ? `${client.name} (${client.email})` : client.email}
            </option>
          ))}
        </select>
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
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          <option value="">{t('form.noService')}</option>
          {filteredServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="amount">
            {t('form.amount')}
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900" htmlFor="currency">
            {t('form.currency')}
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="HUF">HUF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="dueDate">
          {t('form.dueDate')}
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900" htmlFor="notes">
          {t('form.notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{t('form.success')}</p> : null}

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
