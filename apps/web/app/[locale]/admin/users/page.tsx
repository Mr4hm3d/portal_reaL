import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { listUsers } from '@users';

import { AdminUserForm } from '@/components/admin-user-form';

export default async function AdminUsersPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('adminUsers');
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${params.locale}/login`);
  }

  if (!currentUser.roles.includes('ADMIN')) {
    redirect(`/${params.locale}/dashboard`);
  }

  const users = await listUsers();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <Link className="text-sm text-slate-600 hover:text-slate-900" href={`/${params.locale}/dashboard`}>
          {t('backToDashboard')}
        </Link>
        <div>
          <p className="text-sm text-slate-600">{t('intro')}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{t('listTitle')}</h2>
            <p className="text-sm text-slate-700">{t('listSubtitle')}</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">{t('table.name')}</th>
                  <th className="px-3 py-2">{t('table.email')}</th>
                  <th className="px-3 py-2">{t('table.roles')}</th>
                  <th className="px-3 py-2">{t('table.language')}</th>
                  <th className="px-3 py-2">{t('table.created')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-slate-600" colSpan={5}>
                      {t('empty')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-900">{user.name}</td>
                      <td className="px-3 py-3">{user.email}</td>
                      <td className="px-3 py-3">{user.roles.join(', ')}</td>
                      <td className="px-3 py-3 uppercase">{user.preferredLanguage}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {new Intl.DateTimeFormat(params.locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }).format(new Date(user.createdAt))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{t('createTitle')}</h2>
            <p className="text-sm text-slate-700">{t('createSubtitle')}</p>
          </div>
          <div className="mt-4">
            <AdminUserForm />
          </div>
        </div>
      </div>
    </section>
  );
}
