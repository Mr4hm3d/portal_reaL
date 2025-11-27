import { NextRequest, NextResponse } from 'next/server';

const supportedLocales = ['hu', 'en'] as const;
const defaultLocale = supportedLocales[0];

function extractPathLocale(pathname: string) {
  const [, maybeLocale] = pathname.split('/');
  return supportedLocales.includes(maybeLocale as (typeof supportedLocales)[number]) ? maybeLocale : null;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip API, assets, and Next internals.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get('lang')?.value;
  const pathLocale = extractPathLocale(pathname);
  const effectiveLocale = pathLocale || (supportedLocales.includes(cookieLocale as (typeof supportedLocales)[number]) ? cookieLocale : defaultLocale);

  // If the path is missing a locale prefix, redirect to the effective locale while preserving the rest of the path and query.
  if (!pathLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${effectiveLocale}${pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Sync the cookie to the locale in the path for subsequent requests.
  const response = NextResponse.next();
  if (effectiveLocale && cookieLocale !== effectiveLocale) {
    response.cookies.set('lang', effectiveLocale, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|api|.*\..*).*)']
};
