import { requireModuleSession } from '../../../../../../../../src/server/auth'
import { NotificationsView } from '../../../../../../../../src/modules/notifications/view'

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string; workspaceSlug: string; productSlug: string; environmentSlug: string }>
}) {
  const { locale, orgSlug, workspaceSlug, productSlug, environmentSlug } = await params
  const { session } = await requireModuleSession(
    locale,
    { orgSlug, workspaceSlug, productSlug, environmentSlug },
    'notifications',
  )
  return (
    <NotificationsView
      session={session}
      scope={{ orgSlug, workspaceSlug, productSlug, environmentSlug }}
    />
  )
}
