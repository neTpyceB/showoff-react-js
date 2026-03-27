import { ExperimentsView } from '../../../../../../../../src/modules/experiments/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function ExperimentsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'experiments')
  return <ExperimentsView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} />
}
