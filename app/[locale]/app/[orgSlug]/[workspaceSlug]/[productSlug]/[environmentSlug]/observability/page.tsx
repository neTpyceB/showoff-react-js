import { ObservabilityView } from '../../../../../../../../src/modules/observability/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function ObservabilityPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'observability')
  return <ObservabilityView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} />
}
