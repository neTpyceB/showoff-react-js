import { NextResponse } from 'next/server'
import { platformStore } from '../../../../src/server/platform-store'
import { sessionCookieName } from '../../../../src/server/auth'
import { toRouteErrorResponse } from '../../../../src/server/route-response'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  let userId = ''
  let locale = 'en'

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { userId?: string; locale?: string }
    userId = body.userId ?? ''
    locale = body.locale ?? 'en'
  } else {
    const formData = await request.formData()
    userId = String(formData.get('userId') ?? '')
    locale = String(formData.get('locale') ?? 'en')
  }

  let sessionId = ''
  let session = null

  try {
    sessionId = platformStore.createSession(userId)
    session = platformStore.getSession(sessionId)
  } catch (error) {
    return toRouteErrorResponse(error)
  }

  if (!session) {
    return NextResponse.json({ message: 'Unable to create session.' }, { status: 400 })
  }

  const response = contentType.includes('application/json')
    ? NextResponse.json(session, { status: 201 })
    : new NextResponse(null, {
        status: 303,
        headers: {
          location: `/${locale}`,
        },
      })

  response.cookies.set(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })
  return response
}
