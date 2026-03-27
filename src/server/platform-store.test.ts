import { describe, expect, it } from 'vitest'
import { platformStore } from './platform-store'

describe('platformStore', () => {
  it('creates seeded sessions and switches context only within memberships', () => {
    const sessionId = platformStore.createSession('user-alina')
    const session = platformStore.getSession(sessionId)

    expect(session?.currentContext.orgSlug).toBe('northstar')
    platformStore.switchContext(sessionId, {
      orgSlug: 'solstice',
      workspaceSlug: 'core',
      productSlug: 'solstice-app',
      environmentSlug: 'production',
    })

    expect(platformStore.getSession(sessionId)?.currentContext.orgSlug).toBe('solstice')
    expect(() =>
      platformStore.switchContext(sessionId, {
        orgSlug: 'northstar',
        workspaceSlug: 'unknown',
        productSlug: 'atlas-cloud',
        environmentSlug: 'production',
      }),
    ).toThrow(/Scope not permitted/i)
  })

  it('searches across multiple entity types in the active scope', () => {
    const sessionId = platformStore.createSession('user-emil')
    const session = platformStore.getSession(sessionId)

    if (!session) {
      throw new Error('Expected seeded session.')
    }

    const results = platformStore.search(session.currentContext, 'latency')
    expect(results.some((entry) => entry.type === 'feed')).toBe(true)
    expect(results.some((entry) => entry.type === 'incident')).toBe(true)
  })

  it('retries failed jobs and completes them on runtime tick', () => {
    const sessionId = platformStore.createSession('user-marta')
    const session = platformStore.getSession(sessionId)

    if (!session) {
      throw new Error('Expected seeded session.')
    }

    const failedJob = platformStore.getJobs(session.currentContext).find((entry) => entry.status === 'failed')
    if (!failedJob) {
      throw new Error('Expected failed job.')
    }

    platformStore.retryJob(session, failedJob.id)
    expect(platformStore.getJobs(session.currentContext).find((entry) => entry.id === failedJob.id)?.status).toBe('retrying')
    platformStore.tickJobs()
    platformStore.tickJobs()
    expect(platformStore.getJobs(session.currentContext).find((entry) => entry.id === failedJob.id)?.status).toBe('completed')
  })

  it('blocks experiments for roles outside the module policy', () => {
    const sessionId = platformStore.createSession('user-felix')
    const session = platformStore.getSession(sessionId)

    if (!session) {
      throw new Error('Expected seeded session.')
    }

    const experiment = platformStore.getExperiments(session.currentContext)[0]
    if (!experiment) {
      throw new Error('Expected experiment.')
    }

    expect(() => platformStore.rolloutExperiment(session, experiment.id)).toThrow(/permitted/i)
  })
})
