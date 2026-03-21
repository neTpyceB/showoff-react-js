import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TransactionForm } from './TransactionForm.tsx'

describe('TransactionForm', () => {
  it('validates and submits the payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<TransactionForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Save transaction' }))
    expect(screen.getByText('Enter at least 2 characters.')).toBeVisible()

    await user.type(screen.getByLabelText('Title'), 'Gym membership')
    await user.clear(screen.getByLabelText('Amount'))
    await user.type(screen.getByLabelText('Amount'), '62.5')
    await user.selectOptions(screen.getByLabelText('Transaction category'), 'health')
    await user.type(screen.getByLabelText('Note'), 'Quarterly wellness plan.')
    await user.click(screen.getByRole('button', { name: 'Save transaction' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Gym membership',
      amount: 62.5,
      kind: 'expense',
      categoryId: 'health',
      date: '2026-03-20',
      note: 'Quarterly wellness plan.',
    })
  })
})
