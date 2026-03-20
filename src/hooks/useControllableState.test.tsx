import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useControllableState } from './useControllableState.ts'

const Harness = ({
  value,
  onChange,
}: {
  value?: string
  onChange?: (value: string) => void
}) => {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: 'initial',
    onChange,
  })

  return <button onClick={() => setCurrent('next')}>{current}</button>
}

describe('useControllableState', () => {
  it('updates internal state when uncontrolled', async () => {
    const user = userEvent.setup()

    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'initial' }))

    expect(screen.getByRole('button', { name: 'next' })).toBeVisible()
  })

  it('only notifies changes when controlled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<Harness value="controlled" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'controlled' }))

    expect(screen.getByRole('button', { name: 'controlled' })).toBeVisible()
    expect(onChange).toHaveBeenCalledWith('next')
  })
})
