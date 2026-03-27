import type { PlatformSession, ScopeContext } from '@/lib/platform-types'
import { acknowledgeNotificationAction } from '@/server/actions'
import { platformStore } from '@/server/platform-store'

export async function NotificationsView({
  session,
  scope,
}: {
  session: PlatformSession
  scope: ScopeContext
}) {
  const notifications = platformStore.getNotifications(session, scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Inbox</p>
        <h2>Notifications</h2>
        <p className="muted-copy">Unread state is personalized, but the stream stays strictly scoped to the active environment.</p>
      </header>

      <div className="stack-list">
        {notifications.map((notification) => (
          <article key={notification.id} className="surface-card">
            <div className="inline-row">
              <strong>{notification.title}</strong>
              <span className={`pill ${notification.read ? 'pill-muted' : ''}`}>{notification.kind}</span>
            </div>
            <p>{notification.body}</p>
            <small className="muted-copy">{new Date(notification.createdAt).toLocaleString()}</small>
            {!notification.read ? (
              <form action={acknowledgeNotificationAction}>
                <input type="hidden" name="notificationId" value={notification.id} />
                <button className="button button-secondary button-sm" type="submit">
                  Acknowledge
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
