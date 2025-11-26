import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm text-slate-600">{t('tagline')}</p>
        <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
      </div>
      <p className="text-slate-700">{t('description')}</p>
      <div className="flex flex-wrap gap-3 text-sm text-slate-700">
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-white" href={`/${locale}/dashboard`}>
          {t('ctaDashboard')}
        </Link>
        <Link className="rounded-md border border-slate-900 px-4 py-2 text-slate-900" href={`/${locale}/login`}>
          {t('ctaLogin')}
        </Link>
      </div>
    </section>
  );
}
