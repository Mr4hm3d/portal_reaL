import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function BillingFailurePage({ params }: { params: { locale: string } }) {
  const t = useTranslations('billing');

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-slate-600">{t('failure')}</p>
      <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      <Link
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        href={`/${params.locale}/billing`}
      >
        {t('title')}
      </Link>
    </div>
  );
}
