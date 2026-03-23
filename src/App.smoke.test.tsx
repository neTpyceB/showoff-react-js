import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { createCommerceTestState } from './test/commerceTestState.ts'

describe('App smoke', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)

        if (url.includes('/api/cart')) {
          return new Response(
            JSON.stringify({
              lines: [],
              promoCode: null,
              subtotalCents: 0,
              discountCents: 0,
              shippingCents: 0,
              totalCents: 0,
              itemCount: 0,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        return new Response(JSON.stringify({ accepted: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )
  })

  it('renders the storefront home route', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <App initialState={createCommerceTestState()} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: /build-worthy electronics retail/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /explore catalog/i })).toBeVisible()
  })
})
