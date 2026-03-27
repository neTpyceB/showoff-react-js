import { NextResponse } from 'next/server'
import { getSessionCookieValue } from '../../../../../../src/server/auth'
import { platformStore } from '../../../../../../src/server/platform-store'
import { toRouteErrorResponse } from '../../../../../../src/server/route-response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = platformStore.getSession(await getSessionCookieValue())
  if (!session) {
    return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 })
  }

  const { threadId } = await params
  const contentType = request.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? String(((await request.json()) as { body?: string }).body ?? '')
    : String((await request.formData()).get('body') ?? '')
  let comment
  try {
    comment = platformStore.addComment(session, threadId, body)
  } catch (error) {
    return toRouteErrorResponse(error)
  }
  return NextResponse.json(comment, { status: 201 })
}
