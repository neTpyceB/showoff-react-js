import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dropdown } from './Dropdown.tsx'

describe('Dropdown', () => {
  it('opens and selects an item', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <Dropdown
        label="Quick actions"
        items={[
          {
            id: 'publish',
            label: 'Publish preview',
            description: 'Deploy the preview.',
            onSelect,
          },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Quick actions' }))
    await user.click(screen.getByRole('menuitem', { name: /publish preview/i }))

    expect(onSelect).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
