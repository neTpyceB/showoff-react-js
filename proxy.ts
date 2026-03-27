import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'de'] as const
const sessionCookieName = 'product_platform_session'

const withLocale = (pathname: string, locale: string) => `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }

  const locale = locales.find((value) => pathname === `/${value}` || pathname.startsWith(`/${value}/`))
  if (!locale) {
    return NextResponse.redirect(new URL(withLocale(pathname, 'en'), request.url))
  }

  const isProtectedAppRoute = pathname.startsWith(`/${locale}/app`)
  if (isProtectedAppRoute && !request.cookies.get(sessionCookieName)?.value) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
