import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import type { Role } from '@core-domain/prisma';
import { getCurrentUser } from '@auth';
import { listServices } from '@services/service';
import { listWikiArticles } from '@wiki/service';

import { WikiForm } from '../../../components/wiki-form';

export default async function WikiPage({
  params
}: {
  params: { locale: string };
}) {
  const t = useTranslations('wiki');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const articles = await listWikiArticles(user, {
    language: params.locale === 'en' ? 'en' : 'hu'
  });

  const isStaff = user.roles.includes('ADMIN' as Role) || user.roles.includes('SUPPORT' as Role);
  const services = isStaff
    ? (await listServices(user, {})).map((service) => ({ id: service.id, title: service.title }))
    : [];

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-sm text-slate-600">{t('intro')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      </header>

      {isStaff && <WikiForm locale={params.locale} services={services} />}

      {articles.length === 0 ? (
        <p className="text-sm text-slate-600">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{article.service?.title ?? '—'}</span>
                <span>{t(`visibility.${article.visibility}`)}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{article.title}</h2>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">
                {article.contentMarkdown}
              </p>
              <div className="mt-3 flex justify-end">
                <Link
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  href={`/${params.locale}/wiki/${article.id}`}
                >
                  {t('view')} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
