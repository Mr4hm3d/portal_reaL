export const supportedLocales = ['hu', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
