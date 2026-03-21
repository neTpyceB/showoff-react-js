import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'

describe('App smoke', () => {
  it('renders the finance dashboard shell', () => {
    render(
      <ToastProvider>
        <App />
      </ToastProvider>,
    )

    expect(
      screen.getByRole('heading', { name: /personal finance tracker/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /save transaction/i })).toBeVisible()
    expect(screen.getByRole('heading', { name: /transactions/i })).toBeVisible()
  })
})
