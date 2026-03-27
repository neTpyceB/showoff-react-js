import type { PlatformSession, ScopeContext } from '@/lib/platform-types'
import { createCommentAction } from '@/server/actions'
import { platformStore, scopeKey } from '@/server/platform-store'
import { PresenceRoom } from './presence-room'

export function CollaborationView({
  session,
  scope,
}: {
  session: PlatformSession
  scope: ScopeContext
}) {
  const threads = platformStore.getThreads(scope)
  const activeUsers = platformStore.getPresence(scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Realtime collaboration</p>
        <h2>Launch room</h2>
        <p className="muted-copy">Threaded decisions, scoped presence, and explicit server-owned reconciliation.</p>
      </header>

      <PresenceRoom scopeKey={scopeKey(scope)} initial={activeUsers} />

      <div className="stack-list">
        {threads.map((thread) => (
          <article key={thread.id} className="surface-card">
            <h3>{thread.title}</h3>
            <div className="stack-list compact">
              {thread.comments.map((comment) => (
                <div key={comment.id} className="surface-soft">
                  <strong>{comment.author}</strong>
                  <p>{comment.body}</p>
                </div>
              ))}
            </div>
            <form action={createCommentAction} className="comment-form">
              <input type="hidden" name="threadId" value={thread.id} />
              <textarea name="body" rows={3} placeholder={`Comment as ${session.name}`} />
              <button className="button button-primary button-sm" type="submit">
                Add comment
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  )
}
