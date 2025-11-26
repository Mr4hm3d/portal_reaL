import '../globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ReactNode } from 'react';

import { parseEnv } from '@portal/config/index';

import { AuthNav } from '../../components/auth-nav';
import { LocaleSwitcher } from '../../components/locale-switcher';
import { MainNav } from '../../components/main-nav';

export const metadata: Metadata = {
  title: 'Client Portal',
  description: 'Fehér címkés ügyfélportál alap'
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  let brandName = 'Portal';
  let brandColor = '#0f172a';

  try {
    const env = parseEnv();
    brandName = env.BRANDING_NAME;
    brandColor = env.BRANDING_PRIMARY_COLOR;
  } catch (error) {
    // Fall back to defaults if env vars are not yet configured during local preview.
    console.warn('Branding env not fully configured', error);
  }

  return (
    <html lang={params.locale}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href={`/${params.locale}`} className="flex items-center gap-2 text-lg font-semibold">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: brandColor }} />
                  <span>{brandName}</span>
                </Link>
                <div className="flex items-center gap-4">
                  <LocaleSwitcher currentLocale={params.locale} />
                  <AuthNav locale={params.locale} />
                </div>
              </div>
              <MainNav locale={params.locale} />
            </div>
          </header>
          <main className="mx-auto flex max-w-5xl flex-col px-6 pb-16 pt-10">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
