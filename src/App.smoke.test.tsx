import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { createPlatformTestState } from './test/platformTestState.ts'

describe('App smoke', () => {
  it('renders the multi-tenant overview route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            orgId: 'org-acme',
            activeUsers: 18,
            automationRuns: 142,
            apiRequests: 904320,
            openIncidents: 1,
            storageUsedGb: 284,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/orgs/org-acme/overview']}>
          <ToastProvider>
            <App initialState={createPlatformTestState()} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: /acme cloud overview/i })).toBeVisible()
    expect(screen.getByText(/tenant health, usage, and platform posture/i)).toBeVisible()
  })
})
