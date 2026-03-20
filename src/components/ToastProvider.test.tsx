import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './ToastProvider.tsx'

const Trigger = () => {
  const { pushToast } = useToast()

  return (
    <button onClick={() => pushToast({ title: 'Saved', description: 'Changes persisted.' })}>
      Trigger
    </button>
  )
}

describe('ToastProvider', () => {
  it('renders and dismisses notifications', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trigger' }))
    expect(screen.getByText('Saved')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /dismiss saved/i }))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('auto-dismisses notifications', () => {
    vi.useFakeTimers()

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    screen.getByRole('button', { name: 'Trigger' }).click()
    vi.runAllTimers()

    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
