import { createRequestConfig } from 'next-intl/server';

export default createRequestConfig(({ request }) => {
  const locale = request.headers.get('x-portal-locale') ?? undefined;
  return {
    locales: ['hu', 'en'],
    defaultLocale: 'hu',
    locale: locale && ['hu', 'en'].includes(locale) ? locale : undefined
  };
});
