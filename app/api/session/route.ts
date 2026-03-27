import { NextResponse } from 'next/server'
import { getSessionCookieValue } from '../../../src/server/auth'
import { platformStore } from '../../../src/server/platform-store'

export async function GET() {
  const session = platformStore.getSession(await getSessionCookieValue())
  return NextResponse.json(session)
}
