import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionCookieValue = vi.fn()

vi.mock('../../../src/server/auth', () => ({
  getSessionCookieValue,
}))

describe('search route', () => {
  beforeEach(() => {
    getSessionCookieValue.mockReset()
  })

  it('rejects anonymous access', async () => {
    getSessionCookieValue.mockResolvedValue(null)
    const { GET } = await import('./route')
    const response = await GET(new Request('http://localhost:3000/api/search?q=latency'))

    expect(response.status).toBe(401)
  })

  it('returns scoped results for an authenticated session', async () => {
    const { platformStore } = await import('../../../src/server/platform-store')
    const sessionId = platformStore.createSession('user-emil')
    getSessionCookieValue.mockResolvedValue(sessionId)
    const { GET } = await import('./route')
    const response = await GET(new Request('http://localhost:3000/api/search?q=latency'))
    const payload = (await response.json()) as { results: Array<{ title: string }> }

    expect(response.status).toBe(200)
    expect(payload.results.length).toBeGreaterThan(0)
  })
})
