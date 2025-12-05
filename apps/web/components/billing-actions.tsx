'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function BillingStaffActions({
  billingRequestId,
  status,
  hasProForma,
  hasInvoice
}: {
  billingRequestId: string;
  status: string;
  hasProForma: boolean;
  hasInvoice: boolean;
}) {
  const t = useTranslations('billing');
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function postAction(url: string, options?: RequestInit) {
    setLoading(true);
    setMessage(null);
    setError(null);
    const res = await fetch(url, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('errorGeneric'));
      setLoading(false);
      return false;
    }
    setLoading(false);
    router.refresh();
    return true;
  }

  async function handleSend() {
    const ok = await postAction(`/api/v1/billing/requests/${billingRequestId}/send`, { method: 'POST' });
    if (ok) setMessage(t('manage.sent'));
  }

  async function handleMarkPaid() {
    const ok = await postAction(`/api/v1/billing/requests/${billingRequestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' })
    });
    if (ok) setMessage(t('manage.markedPaid'));
  }

  async function handleInvoice() {
    const ok = await postAction('/api/v1/integrations/billingo/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingRequestId })
    });
    if (ok) setMessage(t('manage.invoiced'));
  }

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-900">{t('manage.title')}</p>
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-70"
        >
          {loading ? t('manage.working') : hasProForma ? t('manage.resend') : t('manage.send')}
        </button>
        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={loading || status === 'PAID'}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-70"
        >
          {status === 'PAID' ? t('manage.alreadyPaid') : t('manage.markPaid')}
        </button>
        <button
          type="button"
          onClick={handleInvoice}
          disabled={loading || hasInvoice || status !== 'PAID'}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-70"
        >
          {hasInvoice ? t('manage.hasInvoice') : t('manage.createInvoice')}
        </button>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
