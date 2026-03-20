import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ContactForm } from './ContactForm.tsx'

describe('ContactForm', () => {
  it('validates and submits data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ContactForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Send request' }))
    expect(screen.getByText('Enter at least 2 characters.')).toBeVisible()

    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Company'), 'Analytical Engines')
    await user.type(
      screen.getByLabelText('Project brief'),
      'Build a production-ready component system for a demanding product team.',
    )
    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engines',
      plan: 'Growth',
      message:
        'Build a production-ready component system for a demanding product team.',
    })
  })
})
