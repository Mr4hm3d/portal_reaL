import { getRequestConfig } from 'next-intl/server';
import hu from './messages/hu.json';
import en from './messages/en.json';
import { supportedLocales } from './src/lib/i18n/locales';

export default getRequestConfig(async ({ locale }) => {
  if (!supportedLocales.includes(locale as (typeof supportedLocales)[number])) {
    throw new Error(`Unsupported locale ${locale}`);
  }

  const messages = locale === 'en' ? en : hu;

  return {
    locale,
    messages
  };
});
