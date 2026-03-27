import { DashboardsView } from '../../../../../../../../src/modules/dashboards/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function DashboardsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'dashboards')
  return <DashboardsView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} />
}
