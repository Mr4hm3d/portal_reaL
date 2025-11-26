import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const t = useTranslations('dashboard');

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-slate-600">{t('welcome', { name: user.name })}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-slate-700">{t('description')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('nextSteps')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{t('todoTickets')}</li>
            <li>{t('todoServices')}</li>
            <li>{t('todoBilling')}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('account')}</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt>{t('nameLabel')}</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('emailLabel')}</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('rolesLabel')}</dt>
              <dd className="font-medium">{user.roles.join(', ')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
