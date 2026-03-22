import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'

describe('App smoke', () => {
  it('renders the login route for anonymous users', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: /kanban task manager/i }),
    ).toBeVisible()
    expect(await screen.findByRole('button', { name: /sign in as alice/i })).toBeVisible()
  })
})
