import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LoginPage from './page'

describe('Login page smoke', () => {
  it('renders the login route SSR surface', async () => {
    render(await LoginPage({ params: Promise.resolve({ locale: 'en' }) }))

    expect(await screen.findByRole('heading', { name: /Atlas Product Platform/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /Sign in as Alina/i })).toBeVisible()
  })
})
