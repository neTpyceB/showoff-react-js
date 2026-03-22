import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskComposer } from './TaskComposer.tsx'

describe('TaskComposer', () => {
  it('submits a valid task payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <TaskComposer
        users={[
          {
            id: 'alice',
            name: 'Alice Johnson',
            title: 'Lead',
            email: 'alice@showoff.dev',
          },
        ]}
        disabled={false}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('Task title'), 'Ship drag-and-drop')
    await user.type(
      screen.getByLabelText('Task description'),
      'Implement sortable task movement with optimistic updates.',
    )
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Ship drag-and-drop',
      description: 'Implement sortable task movement with optimistic updates.',
      assigneeId: 'alice',
      priority: 'medium',
      status: 'todo',
    })
  })
})
