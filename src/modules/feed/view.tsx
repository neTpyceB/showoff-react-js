import { unstable_cache } from 'next/cache'
import type { ScopeContext } from '@/lib/platform-types'
import { pinFeedNoteAction } from '@/server/actions'
import { platformStore, scopeKey } from '@/server/platform-store'
import { makeScopeTag } from '@/server/tags'
import { LiveFeed } from './live-feed'

async function loadFeed(scope: ScopeContext) {
  return unstable_cache(
    async () => platformStore.getFeed(scope),
    [makeScopeTag(scope, 'feed')],
    { tags: [makeScopeTag(scope, 'feed')] },
  )()
}

export async function FeedView({ scope }: { scope: ScopeContext }) {
  const items = (await loadFeed(scope)) as Awaited<ReturnType<typeof loadFeed>>

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Live operations</p>
        <h2>Operational feed</h2>
        <p className="muted-copy">Rollouts, incidents, experiments, and pinned decisions stream into one timeline.</p>
      </header>

      <LiveFeed scopeKey={scopeKey(scope)} initialItems={items} />

      <div className="stack-list">
        {items.map((item) => (
          <article key={item.id} className="surface-card timeline-item">
            <div className="inline-row">
              <strong>{item.title}</strong>
              <span className="pill">{item.kind}</span>
            </div>
            <p>{item.body}</p>
            <small className="muted-copy">{item.actor} · {new Date(item.createdAt).toLocaleString()}</small>
            <form action={pinFeedNoteAction}>
              <input type="hidden" name="feedId" value={item.id} />
              <button className="button button-secondary button-sm" type="submit">
                {item.pinned ? 'Unpin note' : 'Pin note'}
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  )
}
