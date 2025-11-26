import { createRequestConfig } from 'next-intl/server';

import { supportedLocales } from './locales';

export default createRequestConfig(({ request }) => {
  const headerLocale = request.headers.get('x-portal-locale') ?? undefined;
  const locale =
    headerLocale && supportedLocales.includes(headerLocale as (typeof supportedLocales)[number])
      ? headerLocale
      : undefined;

  return {
    locales: supportedLocales,
    defaultLocale: supportedLocales[0],
    locale
  };
});
