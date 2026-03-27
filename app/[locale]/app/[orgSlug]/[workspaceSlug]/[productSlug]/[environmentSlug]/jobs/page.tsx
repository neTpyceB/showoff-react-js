import { JobsView } from '../../../../../../../../src/modules/jobs/view'
import { requireModuleSession } from '../../../../../../../../src/server/auth'

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  await requireModuleSession(locale, { orgSlug, workspaceSlug, productSlug, environmentSlug }, 'jobs')
  return <JobsView scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }} />
}
