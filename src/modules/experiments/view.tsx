import { unstable_cache } from 'next/cache'
import type { ScopeContext } from '@/lib/platform-types'
import { pauseExperimentAction, rolloutExperimentAction } from '@/server/actions'
import { platformStore } from '@/server/platform-store'
import { makeScopeTag } from '@/server/tags'

async function loadExperiments(scope: ScopeContext) {
  return unstable_cache(
    async () => platformStore.getExperiments(scope),
    [makeScopeTag(scope, 'experiments')],
    { tags: [makeScopeTag(scope, 'experiments')] },
  )()
}

export async function ExperimentsView({ scope }: { scope: ScopeContext }) {
  const experiments = await loadExperiments(scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Experimentation</p>
        <h2>A/B tests</h2>
        <p className="muted-copy">Rollout controls stay tied to guardrails and platform events rather than a fake analytics-only surface.</p>
      </header>

      <div className="stack-list">
        {experiments.map((experiment) => (
          <article key={experiment.id} className="surface-card">
            <div className="inline-row">
              <strong>{experiment.name}</strong>
              <span className="pill">{experiment.status}</span>
            </div>
            <p>{experiment.metric} · Guardrail: {experiment.guardrail}</p>
            <small className="muted-copy">Owner: {experiment.owner}</small>
            <div className="inline-row">
              <form action={rolloutExperimentAction}>
                <input type="hidden" name="experimentId" value={experiment.id} />
                <button className="button button-primary button-sm" type="submit">
                  Start rollout
                </button>
              </form>
              <form action={pauseExperimentAction}>
                <input type="hidden" name="experimentId" value={experiment.id} />
                <button className="button button-secondary button-sm" type="submit">
                  Pause experiment
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
