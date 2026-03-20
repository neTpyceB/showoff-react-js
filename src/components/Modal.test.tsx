import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal.tsx'

describe('Modal', () => {
  it('closes on escape', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Example"
        description="Body"
      >
        <p>Content</p>
      </Modal>,
    )

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders an accessible dialog', () => {
    render(
      <Modal
        open
        onOpenChange={vi.fn()}
        title="Example"
        description="Body"
      >
        <p>Content</p>
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'Example' })).toBeVisible()
  })
})
