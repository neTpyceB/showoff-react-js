import type { ReactNode } from 'react'
import { getDictionary, isLocale } from '../../../../../../../src/lib/i18n'
import type { Locale } from '../../../../../../../src/lib/platform-types'
import { requireScopedSession } from '../../../../../../../src/server/auth'
import { PlatformShell } from '../../../../../../../src/modules/shell/platform-shell'

export default async function ScopeLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{
    locale: string
    orgSlug: string
    workspaceSlug: string
    productSlug: string
    environmentSlug: string
  }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  const resolvedLocale: Locale = isLocale(locale) ? locale : 'en'
  const dictionary = await getDictionary(resolvedLocale)
  const { session, membership } = await requireScopedSession(resolvedLocale, {
    orgSlug,
    workspaceSlug,
    productSlug,
    environmentSlug,
  })

  return (
    <PlatformShell locale={resolvedLocale} dictionary={dictionary} session={session} membership={membership}>
      {children}
    </PlatformShell>
  )
}
