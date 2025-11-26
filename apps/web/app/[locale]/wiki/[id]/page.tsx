import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getCurrentUser } from '@auth';
import { getWikiArticle } from '@wiki/service';

export default async function WikiDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  const t = useTranslations('wiki');
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const article = await getWikiArticle(user, params.id);

  if (!article) {
    notFound();
  }

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <Link
          className="text-blue-700 hover:text-blue-800"
          href={`/${params.locale}/wiki`}
        >
          ← {t('back')}
        </Link>
        <span>{t(`visibility.${article.visibility}`)}</span>
      </div>
      <header className="space-y-1">
        <p className="text-sm text-slate-600">{article.service?.title ?? '—'}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{article.title}</h1>
      </header>
      <div className="prose max-w-none whitespace-pre-wrap text-slate-800">
        {article.contentMarkdown}
      </div>
    </article>
  );
}
