import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { parseEnv } from '@config/index';

import { LogoutButton } from './logout-button';

export async function AuthNav({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const user = await getCurrentUser();
  let allowPublicRegistration = true;
  try {
    const env = parseEnv();
    allowPublicRegistration = env.ALLOW_PUBLIC_REGISTRATION;
  } catch (error) {
    console.warn('Env not fully configured when rendering AuthNav', error);
  }

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm">
      {user ? (
        <>
          <span className="text-slate-700">{t('signedInAs', { name: user.name })}</span>
          <Link
            className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
            href={`/${locale}/dashboard`}
          >
            {t('dashboardLink')}
          </Link>
          <LogoutButton locale={locale} label={t('logout')} />
        </>
      ) : (
        <>
          <Link
            className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-800 hover:bg-slate-50"
            href={`/${locale}/login`}
          >
            {t('login')}
          </Link>
          {allowPublicRegistration ? (
            <Link
              className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800"
              href={`/${locale}/register`}
            >
              {t('register')}
            </Link>
          ) : null}
        </>
      )}
    </nav>
  );
}
