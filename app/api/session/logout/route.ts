import { NextResponse } from 'next/server'
import { getSessionCookieValue, sessionCookieName } from '../../../../src/server/auth'
import { platformStore } from '../../../../src/server/platform-store'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const locale = contentType.includes('application/json')
    ? (((await request.json()) as { locale?: string }).locale ?? 'en')
    : String((await request.formData()).get('locale') ?? 'en')

  platformStore.destroySession((await getSessionCookieValue()) ?? undefined)
  const response = contentType.includes('application/json')
    ? NextResponse.json({ ok: true })
    : new NextResponse(null, {
        status: 303,
        headers: {
          location: `/${locale}/login`,
        },
      })
  response.cookies.set(sessionCookieName, '', { expires: new Date(0), path: '/' })
  return response
}
