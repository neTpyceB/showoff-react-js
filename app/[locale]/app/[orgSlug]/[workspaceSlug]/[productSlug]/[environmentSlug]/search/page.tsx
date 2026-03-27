import { SearchView } from '../../../../../../../../src/modules/search/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'search')
  const { q = '' } = await searchParams
  return <SearchView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} query={q} />
}
