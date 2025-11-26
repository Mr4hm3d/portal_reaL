import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { getBillingRequestById, startBillingRequestPayment } from '@billing';
import { parseEnv } from '@config';
import { BillingStaffActions } from '@/components/billing-actions';

export default async function BillingDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  const t = useTranslations('billing');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const billingRequest = await getBillingRequestById(user, params.id);

  if (!billingRequest) {
    notFound();
  }

  async function startPaymentAction() {
    'use server';
    const env = parseEnv();
    const { redirectUrl } = await startBillingRequestPayment(
      user,
      params.id,
      {
        locale: params.locale === 'en' ? 'en-US' : 'hu-HU',
        successUrl: `${env.APP_BASE_URL}/${params.locale}/billing/success`,
        failureUrl: `${env.APP_BASE_URL}/${params.locale}/billing/failure`,
        customerEmail: user.email ?? undefined
      },
      env.APP_BASE_URL
    );

    redirect(redirectUrl);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <Link className="text-blue-700 hover:text-blue-800" href={`/${params.locale}/billing`}>
          ← {t('title')}
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
          {t(`status.${billingRequest.status}`)}
        </span>
      </div>

      <header className="space-y-1">
        <p className="text-sm text-slate-600">{t('detailsTitle')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{billingRequest.id}</h1>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm text-slate-800">
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <dt className="font-semibold text-slate-900">{t('amountLabel')}</dt>
          <dd>{`${billingRequest.amount} ${billingRequest.currency}`}</dd>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <dt className="font-semibold text-slate-900">{t('serviceLabel')}</dt>
          <dd>{billingRequest.service?.title ?? '—'}</dd>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <dt className="font-semibold text-slate-900">{t('dueDateLabel')}</dt>
          <dd>
            {billingRequest.dueDate
              ? new Date(billingRequest.dueDate).toLocaleDateString(params.locale)
              : '—'}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <dt className="font-semibold text-slate-900">{t('statusLabel')}</dt>
          <dd>{t(`status.${billingRequest.status}`)}</dd>
        </div>
      </dl>

      {billingRequest.notes ? (
        <div className="rounded-lg bg-white p-4 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">{t('notesLabel')}</p>
          <p className="mt-1 whitespace-pre-wrap">{billingRequest.notes}</p>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-700">{t('paymentInstructions')}</p>
        {billingRequest.billingoInvoiceId ? (
          <Link
            className="inline-flex w-fit items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            href={`/api/v1/integrations/billingo/invoices/${billingRequest.billingoInvoiceId}/pdf`}
          >
            {t('invoice')}
          </Link>
        ) : null}
        {billingRequest.status !== 'PAID' ? (
          <form action={startPaymentAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {t('pay')}
            </button>
          </form>
        ) : (
          <p className="text-sm font-medium text-green-700">{t('paid')}</p>
        )}
      </div>

      {(user.roles.includes('ADMIN') || user.roles.includes('BILLING')) && (
        <BillingStaffActions
          billingRequestId={billingRequest.id}
          status={billingRequest.status}
          hasProForma={Boolean(billingRequest.pdfRelativePath)}
          hasInvoice={Boolean(billingRequest.billingoInvoiceId)}
        />
      )}
    </section>
  );
}
