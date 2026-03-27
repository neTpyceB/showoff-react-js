'use client'

import { useEffect, useState } from 'react'
import type { Job } from '@/lib/platform-types'

export function LiveJobs({ scopeKey, initialJobs }: { scopeKey: string; initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs)

  useEffect(() => {
    const stream = new EventSource(`/api/stream?scopeKey=${encodeURIComponent(scopeKey)}`)
    stream.addEventListener('job', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as Job
      setJobs((current) => current.map((job) => (job.id === payload.id ? payload : job)))
    })
    return () => stream.close()
  }, [scopeKey])

  return (
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
        </article>
      ))}
    </div>
  )
}
