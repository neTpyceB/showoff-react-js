import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ScopeContext } from '../lib/platform-types'
import type { ModuleKey } from '../lib/permissions'
import { canAccessModule } from '../lib/permissions'
import { platformStore } from './platform-store'

export const sessionCookieName = 'product_platform_session'

export const getSessionCookieValue = async () => {
  const cookieStore = await cookies()
  return cookieStore.get(sessionCookieName)?.value ?? null
}

export const resolveSessionOrNull = async () => {
  const sessionId = await getSessionCookieValue()
  return platformStore.getSession(sessionId)
}

export const requireSession = async (locale: string) => {
  const session = await resolveSessionOrNull()
  if (!session) {
    redirect(`/${locale}/login`)
  }
  return session
}

export const requireScopedSession = async (locale: string, scope: ScopeContext) => {
  const session = await requireSession(locale)
  const membership = session.memberships.find(
    (entry) =>
      entry.orgSlug === scope.orgSlug &&
      entry.workspaceSlug === scope.workspaceSlug &&
      entry.productSlug === scope.productSlug &&
      entry.environmentSlug === scope.environmentSlug,
  )

  if (!membership) {
    redirect(`/${locale}/forbidden`)
  }

  return { session, membership }
}

export const requireModuleSession = async (
  locale: string,
  scope: ScopeContext,
  moduleKey: ModuleKey,
) => {
  const { session, membership } = await requireScopedSession(locale, scope)

  if (!canAccessModule(membership.role, moduleKey)) {
    redirect(`/${locale}/forbidden`)
  }

  return { session, membership }
}
