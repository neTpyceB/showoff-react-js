import { beforeEach, describe, expect, it } from 'vitest'
import { kanbanApi } from './api.ts'
import { createSeedDatabase, databaseStorageKey, sessionStorageKey } from './model.ts'

describe('kanbanApi', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      databaseStorageKey,
      JSON.stringify(createSeedDatabase()),
    )
    window.localStorage.removeItem(sessionStorageKey)
  })

  it('logs users in and returns accessible spaces', async () => {
    const user = await kanbanApi.login('alice')
    const spaces = await kanbanApi.getSpaces(user.id)

    expect(user.name).toBe('Alice Johnson')
    expect(spaces).toHaveLength(2)
  })

  it('rejects task creation for viewers', async () => {
    await expect(
      kanbanApi.createTask('platform', 'casey', {
        title: 'Blocked task',
        description: 'Should fail.',
        assigneeId: 'casey',
        priority: 'low',
        status: 'todo',
      }),
    ).rejects.toThrow(/does not allow creating tasks/i)
  })
})
