import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';

import { AccountProfileForm } from '@/components/account-profile-form';
import { AccountPasswordForm } from '@/components/account-password-form';

export default async function AccountPage({ params }: { params: { locale: string } }) {
  const user = await getCurrentUser();
  const t = useTranslations('account');

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-slate-600">{t('subtitle')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('profileHeading')}</h2>
            <p className="text-sm text-slate-600">{t('profileDescription')}</p>
          </div>
          <AccountProfileForm
            email={user.email}
            name={user.name ?? ''}
            preferredLanguage={(user.preferredLanguage ?? 'hu') as 'hu' | 'en'}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('passwordHeading')}</h2>
            <p className="text-sm text-slate-600">{t('passwordDescription')}</p>
          </div>
          <AccountPasswordForm />
        </div>
      </div>
    </section>
  );
}
