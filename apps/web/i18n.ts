import { getRequestConfig } from 'next-intl/server';
import hu from './messages/hu.json';
import en from './messages/en.json';
import { supportedLocales } from './src/lib/i18n/locales';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = supportedLocales.includes(
    locale as (typeof supportedLocales)[number]
  )
    ? locale
    : supportedLocales[0];

  const messages = resolvedLocale === 'en' ? en : hu;

  return {
    locale: resolvedLocale,
    messages
  };
});
