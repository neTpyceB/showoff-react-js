import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { usePersistentReducer } from './usePersistentReducer.ts'

type CounterAction = { type: 'increment' }

const counterSchema = z.object({
  count: z.number(),
})

const CounterHarness = () => {
  const [state, dispatch] = usePersistentReducer({
    reducer: (current: { count: number }, action: CounterAction) =>
      action.type === 'increment' ? { count: current.count + 1 } : current,
    initialState: { count: 1 },
    storageKey: 'counter.test',
    schema: counterSchema,
  })

  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>
}

describe('usePersistentReducer', () => {
  it('hydrates from localStorage and persists updates', async () => {
    window.localStorage.setItem('counter.test', JSON.stringify({ count: 4 }))
    const user = userEvent.setup()

    render(<CounterHarness />)
    expect(screen.getByRole('button', { name: '4' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: '4' }))
    expect(window.localStorage.getItem('counter.test')).toContain('"count":5')
  })
})
