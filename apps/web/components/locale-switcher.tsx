'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const locales = [
  { code: 'hu', labelKey: 'locale.hu' },
  { code: 'en', labelKey: 'locale.en' }
];

function buildHref(pathname: string, targetLocale: string) {
  const segments = pathname.split('/');
  // Expect pathname like /{locale}/...; remove the first two empty+locale segments
  const rest = segments.slice(2).join('/');
  const suffix = rest ? `/${rest}` : '';
  return `/${targetLocale}${suffix}`;
}

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const t = useTranslations('common');
  const router = useRouter();

  if (!pathname) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-700">{t('localeLabel')}</span>
      <div className="flex rounded border border-slate-200 bg-white shadow-sm">
        {locales.map((locale) => {
          const href = buildHref(pathname, locale.code);
          const isActive = locale.code === currentLocale;
          const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            document.cookie = `lang=${locale.code}; path=/; SameSite=Lax`;
            router.push(href);
          };
          return (
            <a
              key={locale.code}
              href={href}
              onClick={handleClick}
              className={`px-3 py-1 transition hover:bg-slate-50 ${
                isActive ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'
              }`}
            >
              {t(locale.labelKey)}
            </a>
          );
        })}
      </div>
    </div>
  );
}
