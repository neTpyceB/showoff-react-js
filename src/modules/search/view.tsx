import type { ScopeContext, SearchDocument } from '@/lib/platform-types'
import { platformStore } from '@/server/platform-store'
import { SearchBox } from './search-box'

export async function SearchView({
  scope,
  query,
}: {
  scope: ScopeContext
  query: string
}) {
  const results: SearchDocument[] = platformStore.search(scope, query)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Global knowledge</p>
        <h2>Search</h2>
        <p className="muted-copy">Cross-entity search across feed items, jobs, incidents, experiments, and decision threads.</p>
      </header>

      <form className="surface-card search-panel">
        <SearchBox initialQuery={query} />
      </form>

      <div className="stack-list">
        {results.map((result) => (
          <a key={result.id} className="surface-card result-card" href={result.href}>
            <div className="inline-row">
              <strong>{result.title}</strong>
              <span className="pill">{result.type}</span>
            </div>
            <p>{result.snippet}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
