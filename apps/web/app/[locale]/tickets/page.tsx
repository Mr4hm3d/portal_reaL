import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { TicketStatus } from '@core-domain/prisma';
import { listServices } from '@services/service';
import { listTickets } from '@tickets/service';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TicketsPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: SearchParams;
}) {
  const t = useTranslations('tickets');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const sp = searchParams ?? {};
  const rawStatus = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const statusFilter =
    rawStatus && Object.values(TicketStatus).includes(rawStatus as TicketStatus)
      ? (rawStatus as TicketStatus)
      : undefined;
  const serviceId = Array.isArray(sp.serviceId) ? sp.serviceId[0] : sp.serviceId;
  const priorityParam = Array.isArray(sp.priority) ? sp.priority[0] : sp.priority;
  const parsedPriority = priorityParam ? Number(priorityParam) : undefined;
  const priorityFilter = Number.isFinite(parsedPriority) ? parsedPriority : undefined;

  const [tickets, services] = await Promise.all([
    listTickets(user, {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(typeof priorityFilter === 'number' ? { priority: priorityFilter } : {})
    }),
    listServices(user, {})
  ]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{t('intro')}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        </div>
        <Link
          href={`/${params.locale}/tickets/new`}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          {t('newTicket')}
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        action={`/${params.locale}/tickets`}
        method="get"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            {t('filters.status')}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ''}
            className="min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">{t('filters.all')}</option>
            {Object.values(TicketStatus).map((status) => (
              <option key={status} value={status}>
                {t(`statuses.${status}` as const)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="serviceId">
            {t('filters.service')}
          </label>
          <select
            id="serviceId"
            name="serviceId"
            defaultValue={serviceId ?? ''}
            className="min-w-[220px] rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">{t('filters.all')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="priority">
            {t('filters.priority')}
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={typeof priorityFilter === 'number' ? String(priorityFilter) : ''}
            className="min-w-[160px] rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">{t('filters.all')}</option>
            {[0, 1, 2, 3, 4, 5].map((priority) => (
              <option key={priority} value={priority}>
                {t(`priorities.${priority}` as const)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            {t('filters.apply')}
          </button>
          <Link
            href={`/${params.locale}/tickets`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {t('filters.clear')}
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.title')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.status')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.priority')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.service')}</th>
              <th className="px-4 py-3 font-semibold text-slate-900">{t('table.updated')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-600">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/${params.locale}/tickets/${ticket.id}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t(`statuses.${ticket.status}` as const)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {t(`priorities.${ticket.priority}` as const)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ticket.service?.title ?? t('table.noService')}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(ticket.updatedAt).toLocaleString(params.locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
