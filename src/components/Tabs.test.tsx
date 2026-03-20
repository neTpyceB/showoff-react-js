import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tabs } from './Tabs.tsx'

describe('Tabs', () => {
  it('supports keyboard navigation between triggers', async () => {
    const user = userEvent.setup()

    render(
      <Tabs defaultValue="first">
        <Tabs.List aria-label="Sample tabs">
          <Tabs.Trigger value="first">First</Tabs.Trigger>
          <Tabs.Trigger value="second">Second</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="first">First panel</Tabs.Panel>
        <Tabs.Panel value="second">Second panel</Tabs.Panel>
      </Tabs>,
    )

    const firstTab = screen.getByRole('tab', { name: 'First' })
    await user.click(firstTab)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Second panel')).toBeVisible()
  })
})
