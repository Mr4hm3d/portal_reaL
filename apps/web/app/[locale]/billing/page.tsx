import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@portal/auth';
import { listBillingRequests } from '@portal/billing';
import { type Role } from '@portal/core-domain/prisma';
import { listServices } from '@portal/services';
import { listUsers } from '@portal/users';
import { BillingRequestForm } from '@/components/billing-request-form';

export default async function BillingPage({
  params
}: {
  params: { locale: string };
}) {
  const t = useTranslations('billing');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const isBillingStaff = user.roles.includes('ADMIN' as Role) || user.roles.includes('BILLING' as Role);

  const [requests, clients, services] = await Promise.all([
    listBillingRequests(user, {}),
    isBillingStaff ? listUsers() : Promise.resolve([]),
    isBillingStaff ? listServices(user as any, {}) : Promise.resolve([])
  ]);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-sm text-slate-600">{t('intro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      </header>

      {isBillingStaff ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 shadow-sm">
          <div className="mb-3 space-y-1">
            <p className="text-sm font-semibold text-slate-900">{t('form.title')}</p>
            <p className="text-sm text-slate-700">{t('form.subtitle')}</p>
          </div>
          <BillingRequestForm
            clients={clients.map((client) => ({ id: client.id, name: client.name, email: client.email }))}
            services={services.map((service) => ({ id: service.id, title: service.title, clientId: service.client?.id ?? null }))}
          />
        </div>
      ) : null}

      {requests.length === 0 ? (
        <p className="text-sm text-slate-600">{t('empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('table.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.service')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.dueDate')}</th>
                <th className="px-4 py-3 font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3">{`${request.amount} ${request.currency}`}</td>
                  <td className="px-4 py-3">{t(`status.${request.status}`)}</td>
                  <td className="px-4 py-3">{request.service?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    {request.dueDate ? new Date(request.dueDate).toLocaleDateString(params.locale) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="text-blue-700 hover:text-blue-800"
                      href={`/${params.locale}/billing/${request.id}`}
                    >
                      {t('view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
