import { describe, expect, it } from 'vitest'
import { createSeedDatabase } from './model.ts'
import { getAdjacentStatus, moveTaskCollection } from './board.ts'

describe('moveTaskCollection', () => {
  it('moves a task across columns while preserving ordered groups', () => {
    const tasks = createSeedDatabase().spaces[0]!.tasks
    const moved = moveTaskCollection(tasks, 'task-2', 'in-progress', 1)

    const inProgress = moved.filter((task) => task.status === 'in-progress')
    expect(inProgress.map((task) => task.id)).toEqual(['task-3', 'task-2'])
  })
})

describe('getAdjacentStatus', () => {
  it('returns the next column when moving right', () => {
    expect(getAdjacentStatus('todo', 'right')).toBe('in-progress')
  })

  it('returns null when moving beyond the board edge', () => {
    expect(getAdjacentStatus('done', 'right')).toBeNull()
  })
})
