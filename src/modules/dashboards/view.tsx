import { unstable_cache } from 'next/cache'
import type { ScopeContext } from '@/lib/platform-types'
import { platformStore } from '@/server/platform-store'
import { makeScopeTag } from '@/server/tags'

async function loadDashboard(scope: ScopeContext) {
  return unstable_cache(
    async () => platformStore.getDashboard(scope),
    [makeScopeTag(scope, 'dashboards')],
    { tags: [makeScopeTag(scope, 'dashboards')] },
  )()
}

export async function DashboardsView({ scope }: { scope: ScopeContext }) {
  const dashboard = await loadDashboard(scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Executive readout</p>
        <h2>Dashboards</h2>
        <p className="muted-copy">Server-rendered KPIs with light client-only charting surfaces.</p>
      </header>

      <div className="metric-grid">
        {dashboard.metrics.map((metric) => (
          <article key={metric.id} className="surface-card metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.delta}</small>
          </article>
        ))}
      </div>

      <div className="chart-grid">
        <article className="surface-card">
          <h3>Funnel</h3>
          {dashboard.funnel.map((point) => (
            <div key={point.label} className="bar-row">
              <span>{point.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${point.value}%` }} /></div>
            </div>
          ))}
        </article>
        <article className="surface-card">
          <h3>Release health</h3>
          {dashboard.releaseHealth.map((point) => (
            <div key={point.label} className="bar-row">
              <span>{point.label}</span>
              <div className="bar-track"><div className="bar-fill alt" style={{ width: `${point.value}%` }} /></div>
            </div>
          ))}
        </article>
      </div>
    </section>
  )
}
