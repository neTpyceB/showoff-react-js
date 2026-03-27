import { describe, expect, it } from 'vitest'
import { POST } from './route'

describe('session login route', () => {
  it('creates a session and redirects browser form posts', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-alina')
    formData.set('locale', 'en')

    const request = new Request('http://localhost:3000/api/session/login', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/en')
    expect(response.headers.get('set-cookie')).toContain('product_platform_session=')
  })
})
