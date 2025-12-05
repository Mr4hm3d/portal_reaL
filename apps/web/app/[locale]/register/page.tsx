import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { parseEnv } from '@portal/config/index';

import { RegisterForm } from '../../../components/register-form';

export default async function RegisterPage({ params }: { params: { locale: string } }) {
  let allowPublicRegistration = true;
  try {
    const env = parseEnv();
    allowPublicRegistration = env.ALLOW_PUBLIC_REGISTRATION;
  } catch (error) {
    console.warn('Environment not fully configured; defaulting to allow registration toggle handling.', error);
  }

  if (!allowPublicRegistration) {
    const t = await getTranslations({ locale: params.locale, namespace: 'auth' });
    return (
      <section className="mx-auto w-full max-w-2xl space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-8 text-amber-900">
        <h1 className="text-2xl font-semibold">{t('registrationDisabledTitle')}</h1>
        <p className="text-sm leading-relaxed text-amber-900">{t('registrationDisabledDescription')}</p>
        <Link
          href={`/${params.locale}/login`}
          className="inline-flex w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {t('backToLogin')}
        </Link>
      </section>
    );
  }

  return <RegisterForm />;
}
