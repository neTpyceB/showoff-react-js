import { unstable_cache } from 'next/cache'
import type { ScopeContext } from '@/lib/platform-types'
import { platformStore } from '@/server/platform-store'
import { makeScopeTag } from '@/server/tags'
import { ObservabilityQueryPanel } from './query-panel'

async function loadObservability(scope: ScopeContext) {
  return unstable_cache(
    async () => platformStore.getObservability(scope),
    [makeScopeTag(scope, 'observability')],
    { tags: [makeScopeTag(scope, 'observability')] },
  )()
}

export async function ObservabilityView({ scope }: { scope: ScopeContext }) {
  const observability = await loadObservability(scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Reliability</p>
        <h2>Observability</h2>
        <p className="muted-copy">Metrics, alerts, incidents, and traces stay in the same operational context as feed and jobs.</p>
      </header>

      <div className="metric-grid">
        <article className="surface-card metric-card">
          <span>Error budget</span>
          <strong>{observability.errorBudget}%</strong>
        </article>
        <article className="surface-card metric-card">
          <span>Active alerts</span>
          <strong>{observability.alerts.length}</strong>
        </article>
        <article className="surface-card metric-card">
          <span>Incidents</span>
          <strong>{observability.incidents.length}</strong>
        </article>
      </div>

      <div className="chart-grid">
        <article className="surface-card">
          <h3>Alerts</h3>
          <div className="stack-list compact">
            {observability.alerts.map((alert) => (
              <div key={alert.id} className="surface-soft">
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>
        <ObservabilityQueryPanel />
      </div>
    </section>
  )
}
