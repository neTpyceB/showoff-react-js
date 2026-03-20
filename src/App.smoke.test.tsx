import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'

describe('App smoke', () => {
  it('renders the playground shell', () => {
    render(
      <ToastProvider>
        <App />
      </ToastProvider>,
    )

    expect(
      screen.getByRole('heading', { name: /component playground/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /open modal/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /quick actions/i })).toBeVisible()
  })
})
