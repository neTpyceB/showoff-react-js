import { unstable_cache } from 'next/cache'
import type { ScopeContext } from '@/lib/platform-types'
import { retryJobAction } from '@/server/actions'
import { platformStore, scopeKey } from '@/server/platform-store'
import { makeScopeTag } from '@/server/tags'
import { LiveJobs } from './live-jobs'

async function loadJobs(scope: ScopeContext) {
  return unstable_cache(
    async () => platformStore.getJobs(scope),
    [makeScopeTag(scope, 'jobs')],
    { tags: [makeScopeTag(scope, 'jobs')] },
  )()
}

export async function JobsView({ scope }: { scope: ScopeContext }) {
  const jobs = await loadJobs(scope)

  return (
    <section className="page-grid">
      <header className="page-hero surface-card">
        <p className="eyebrow">Background control plane</p>
        <h2>Jobs</h2>
        <p className="muted-copy">Queued, failed, retrying, and completed jobs stay visible with explicit retry controls.</p>
      </header>

      <LiveJobs scopeKey={scopeKey(scope)} initialJobs={jobs} />

      <div className="stack-list">
        {jobs.map((job) => (
          <article key={job.id} className="surface-card">
            <div className="inline-row">
              <strong>{job.name}</strong>
              <span className="pill">{job.status}</span>
            </div>
            <p>{job.owner} · {job.schedule}</p>
            <small className="muted-copy">
              Last run {new Date(job.lastRunAt).toLocaleString()} · Next run {new Date(job.nextRunAt).toLocaleString()}
            </small>
            {job.lastError ? <p className="danger-copy">{job.lastError}</p> : null}
            {job.status === 'failed' ? (
              <form action={retryJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="button button-primary button-sm" type="submit">
                  Retry job
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
