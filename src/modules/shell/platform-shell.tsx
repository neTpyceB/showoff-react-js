import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale, Membership, PlatformSession, ScopeContext } from '@/lib/platform-types'
import type { getDictionary } from '@/lib/i18n'
import { getLocalizedPath } from '@/lib/i18n'
import { getVisibleModules, type ModuleKey } from '@/lib/permissions'
import { platformStore, scopeKey } from '@/server/platform-store'
import { LiveClient } from './live-client'
import { ContextSwitcher } from './context-switcher'
import { LocaleSwitcher } from './locale-switcher'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

const buildModuleHref = (locale: Locale, scope: ScopeContext, module: string) =>
  getLocalizedPath(
    locale,
    `/app/${scope.orgSlug}/${scope.workspaceSlug}/${scope.productSlug}/${scope.environmentSlug}/${module}`,
  )

export function PlatformShell({
  locale,
  dictionary,
  session,
  membership,
  children,
}: {
  locale: Locale
  dictionary: Dictionary
  session: PlatformSession
  membership: Membership
  children: ReactNode
}) {
  const notifications = platformStore.getNotifications(session, session.currentContext)
  const visibleModuleKeys = getVisibleModules(membership)
  const moduleLabels: Record<ModuleKey, string> = {
    feed: dictionary.nav.feed,
    dashboards: dictionary.nav.dashboards,
    search: dictionary.nav.search,
    notifications: dictionary.nav.notifications,
    collaboration: dictionary.nav.collaboration,
    jobs: dictionary.nav.jobs,
    observability: dictionary.nav.observability,
    experiments: dictionary.nav.experiments,
  }

  return (
    <div className="platform-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">A</span>
          <div>
            <strong>{dictionary.appName}</strong>
            <small>{membership.orgName} · {membership.environmentName}</small>
          </div>
        </div>

        <div className="topbar-actions">
          <ContextSwitcher
            locale={locale}
            memberships={session.memberships}
            currentContext={session.currentContext}
            submitLabel={dictionary.chrome.updateContext}
          />

          <LocaleSwitcher locale={locale} />

          <Link className="button button-ghost button-sm" href={buildModuleHref(locale, session.currentContext, 'notifications')}>
            {dictionary.chrome.notifications}
          </Link>

          <form action="/api/session/logout" method="post">
            <input type="hidden" name="locale" value={locale} />
            <button className="button button-ghost button-sm" type="submit">
              {dictionary.chrome.logout}
            </button>
          </form>
        </div>
      </header>

      <div className="platform-body">
        <aside className="sidebar">
          <div className="surface-card scope-card">
            <p className="eyebrow">{dictionary.chrome.kicker}</p>
            <h1>{membership.productName}</h1>
            <p className="muted-copy">
              {membership.workspaceName} · {membership.environmentName} · {membership.role.replace('_', ' ')}
            </p>
            <p className="muted-copy">Risk: {membership.environmentRisk}</p>
          </div>

          <nav className="surface-card nav-card">
            {visibleModuleKeys.map((key) => (
              <Link key={key} className="nav-link" href={buildModuleHref(locale, session.currentContext, key)}>
                {moduleLabels[key]}
              </Link>
            ))}
          </nav>

          <LiveClient
            scopeKey={scopeKey(session.currentContext)}
            initialNotifications={notifications}
            locale={locale}
            labels={dictionary.chrome}
          />
        </aside>

        <div className="page-column">{children}</div>
      </div>
    </div>
  )
}
