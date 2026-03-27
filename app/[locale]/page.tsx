import { redirect } from 'next/navigation'
import { resolveSessionOrNull } from '../../src/server/auth'
import { getLocalizedPath, isLocale } from '../../src/lib/i18n'
import type { Locale } from '../../src/lib/platform-types'

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const resolvedLocale: Locale = isLocale(locale) ? locale : 'en'
  const session = await resolveSessionOrNull()

  if (!session) {
    redirect(getLocalizedPath(resolvedLocale, '/login'))
  }

  const context = session.currentContext
  redirect(
    getLocalizedPath(
      resolvedLocale,
      `/app/${context.orgSlug}/${context.workspaceSlug}/${context.productSlug}/${context.environmentSlug}/feed`,
    ),
  )
}
