import { requireModuleSession } from '../../../../../../../../src/server/auth'
import { CollaborationView } from '../../../../../../../../src/modules/collaboration/view'

export default async function CollaborationPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  const { session } = await requireModuleSession(
    locale,
    { orgSlug, workspaceSlug, productSlug, environmentSlug },
    'collaboration',
  )
  return (
    <CollaborationView
      session={session}
      scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }}
    />
  )
}
