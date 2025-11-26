import { getRequestConfig, requestLocale } from 'next-intl/server';

import en from './messages/en.json';
import hu from './messages/hu.json';
import { supportedLocales } from './src/lib/i18n/locales';

export default getRequestConfig(async () => {
  const detected = await requestLocale();
  const normalizedLocale = supportedLocales.includes(detected as (typeof supportedLocales)[number])
    ? detected
    : supportedLocales[0];

  const messages = normalizedLocale === 'en' ? en : hu;

  return {
    locale: normalizedLocale,
    messages
  };
});
