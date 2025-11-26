import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';

import { TicketForm } from '../../../../components/ticket-form';

export default async function NewTicketPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('tickets');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="text-sm text-slate-600">{t('newIntro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('newTitle')}</h1>
      </div>
      <TicketForm locale={params.locale} />
    </section>
  );
}
