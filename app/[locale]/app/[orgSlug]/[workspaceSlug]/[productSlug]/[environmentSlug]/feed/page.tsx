import { FeedView } from '../../../../../../../../src/modules/feed/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'feed')
  return <FeedView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} />
}
