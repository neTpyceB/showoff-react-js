'use client'

import { useState } from 'react'

type QueryItem = {
  id: string
  title?: string
  detail?: string
  operation?: string
  latencyMs?: number
  status?: string
  createdAt?: string
  startedAt?: string
}

export function ObservabilityQueryPanel() {
  const [kind, setKind] = useState<'alerts' | 'traces' | 'incidents'>('alerts')
  const [results, setResults] = useState<QueryItem[]>([])

  return (
    <article className="surface-card">
      <div className="inline-row">
        <h3>Query console</h3>
        <select
          aria-label="Observability query type"
          value={kind}
          onChange={(event) => setKind(event.currentTarget.value as typeof kind)}
        >
          <option value="alerts">Alerts</option>
          <option value="traces">Traces</option>
          <option value="incidents">Incidents</option>
        </select>
        <button
          className="button button-secondary button-sm"
          type="button"
          onClick={async () => {
            const response = await fetch(`/api/observability/query?kind=${kind}`)
            if (!response.ok) {
              return
            }
            const data = (await response.json()) as { results: QueryItem[] }
            setResults(data.results)
          }}
        >
          Run query
        </button>
      </div>
      <div className="stack-list compact">
        {results.map((result) => (
          <div key={result.id} className="surface-soft">
            <strong>{result.title ?? result.operation}</strong>
            <p>{result.detail ?? result.status}</p>
          </div>
        ))}
      </div>
    </article>
  )
}
