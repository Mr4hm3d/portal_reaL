import { getRequestConfig, requestLocale } from 'next-intl/server';

import en from './messages/en.json';
import hu from './messages/hu.json';
import { supportedLocales } from './src/lib/i18n/locales';

export default getRequestConfig(async () => {
  const detectedLocale = await requestLocale();
  const locale = supportedLocales.includes(detectedLocale as (typeof supportedLocales)[number])
    ? detectedLocale
    : supportedLocales[0];

  const messages = locale === 'en' ? en : hu;

  return {
    locale,
    messages
  };
});
