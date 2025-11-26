import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';

export async function MainNav({ locale }: { locale: string }) {
  const user = await getCurrentUser();
  const t = useTranslations('navigation');

  if (!user) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-800">
      <Link className="hover:text-slate-900" href={`/${locale}/dashboard`}>
        {t('dashboard')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/tickets`}>
        {t('tickets')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/services`}>
        {t('services')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/wiki`}>
        {t('wiki')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/billing`}>
        {t('billing')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/files`}>
        {t('files')}
      </Link>
      <Link className="hover:text-slate-900" href={`/${locale}/account`}>
        {t('account')}
      </Link>
      {user.roles.includes('ADMIN') ? (
        <Link className="hover:text-slate-900" href={`/${locale}/admin/users`}>
          {t('users')}
        </Link>
      ) : null}
    </nav>
  );
}
