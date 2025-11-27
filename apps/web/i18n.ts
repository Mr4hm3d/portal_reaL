import { getRequestConfig } from 'next-intl/server';

import en from './messages/en.json';
import hu from './messages/hu.json';
import { supportedLocales } from './src/lib/i18n/locales';

export default getRequestConfig(({ locale }) => {
  const normalizedLocale = supportedLocales.includes(locale as (typeof supportedLocales)[number])
    ? locale
    : supportedLocales[0];

  const messages = normalizedLocale === 'en' ? en : hu;

  return {
    locale: normalizedLocale,
    messages
  };
});
