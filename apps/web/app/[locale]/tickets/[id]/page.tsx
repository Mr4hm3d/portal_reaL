import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { useTranslations } from 'next-intl';

import { TicketStatus } from '@portal/core-domain/prisma';

import { getCurrentUser } from '@portal/auth';
import { listUsers } from '@portal/users/service';
import { addTicketMessage, getTicketById, listTicketMessages, updateTicket } from '@portal/tickets/service';

import { TicketReplyForm } from '../../../../../components/ticket-reply-form';

export default async function TicketDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  const t = useTranslations('tickets');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const ticket = await getTicketById(user, params.id);
  if (!ticket) {
    notFound();
  }

  const messages = await listTicketMessages(user, params.id);
  const isStaff = user.roles.includes('ADMIN') || user.roles.includes('SUPPORT');
  const staffUsers = isStaff
    ? (await listUsers()).filter((candidate) =>
        candidate.roles.includes('ADMIN') || candidate.roles.includes('SUPPORT')
      )
    : [];

  async function submitMessage(content: string) {
    'use server';
    await addTicketMessage(user, params.id, { content });
    revalidatePath(`/${params.locale}/tickets/${params.id}`);
  }

  async function updateTicketDetails(formData: FormData) {
    'use server';
    if (!isStaff) return;

    const status = formData.get('status') as TicketStatus | null;
    const assignedToId = (formData.get('assignedToId') as string | null) || undefined;

    if (!status) return;

    await updateTicket(user, params.id, { status, assignedToId });
    revalidatePath(`/${params.locale}/tickets/${params.id}`);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">{t('detailIntro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
        <p className="text-slate-700">{ticket.description}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <dt className="font-semibold text-slate-900">{t('table.status')}</dt>
            <dd>{t(`statuses.${ticket.status}`)}</dd>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <dt className="font-semibold text-slate-900">{t('table.priority')}</dt>
            <dd>{ticket.priority}</dd>
          </div>
          {ticket.assignedTo ? (
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="font-semibold text-slate-900">{t('assignedTo')}</dt>
              <dd>{ticket.assignedTo.name || ticket.assignedTo.email}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {isStaff ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('manage.title')}</h2>
          <p className="text-sm text-slate-600">{t('manage.help')}</p>
          <form action={updateTicketDetails} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900" htmlFor="status">
                {t('manage.status')}
              </label>
              <select
                id="status"
                name="status"
                defaultValue={ticket.status}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
              >
                {Object.values(TicketStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900" htmlFor="assignedToId">
                {t('manage.assignee')}
              </label>
              <select
                id="assignedToId"
                name="assignedToId"
                defaultValue={ticket.assignedTo?.id || ''}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">{t('manage.unassigned')}</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                {t('manage.save')}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('messages')}</h2>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-600">{t('messagesEmpty')}</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{message.author?.name || message.author?.email}</span>
                  <span>{new Date(message.createdAt).toLocaleString(params.locale)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-800">{message.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <TicketReplyForm submitMessage={submitMessage} />
    </section>
  );
}
