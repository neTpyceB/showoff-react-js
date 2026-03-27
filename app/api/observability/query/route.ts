import { NextResponse } from 'next/server'
import { getSessionCookieValue } from '../../../../src/server/auth'
import { platformStore } from '../../../../src/server/platform-store'
import { canAccessModule } from '../../../../src/lib/permissions'

export async function GET(request: Request) {
  const session = platformStore.getSession(await getSessionCookieValue())
  if (!session) {
    return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 })
  }

  const membership = session.memberships.find((entry) => entry.orgSlug === session.currentContext.orgSlug
    && entry.workspaceSlug === session.currentContext.workspaceSlug
    && entry.productSlug === session.currentContext.productSlug
    && entry.environmentSlug === session.currentContext.environmentSlug)

  if (!membership || !canAccessModule(membership.role, 'observability')) {
    return NextResponse.json({ message: 'Action not permitted.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const kind = (searchParams.get('kind') ?? 'alerts') as 'alerts' | 'traces' | 'incidents'
  const results = platformStore.queryObservability(session.currentContext, kind)
  return NextResponse.json({ results })
}
