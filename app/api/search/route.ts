import { NextResponse } from 'next/server'
import { getSessionCookieValue } from '../../../src/server/auth'
import { platformStore } from '../../../src/server/platform-store'

export async function GET(request: Request) {
  const session = platformStore.getSession(await getSessionCookieValue())
  if (!session) {
    return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const limit = Number(searchParams.get('limit') ?? '20')
  const results = platformStore.search(session.currentContext, q).slice(0, limit)
  return NextResponse.json({ results })
}
