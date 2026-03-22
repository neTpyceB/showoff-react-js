import { describe, expect, it } from 'vitest'
import {
  clearDraft,
  getDraft,
  listPending,
  queuePending,
  removePending,
  setDraft,
} from './outbox.ts'

describe('outbox persistence', () => {
  it('stores and clears drafts by user and scope', async () => {
    await setDraft('alice', 'channel:general', 'Queued draft')
    expect(await getDraft('alice', 'channel:general')).toBe('Queued draft')

    await clearDraft('alice', 'channel:general')
    expect(await getDraft('alice', 'channel:general')).toBe('')
  })

  it('lists queued sends in created order and removes acknowledgements', async () => {
    await queuePending({
      clientId: 'client-1',
      userId: 'alice',
      kind: 'message',
      targetId: 'general',
      body: 'First',
      attachmentIds: [],
      createdAt: '2026-03-22T08:00:00.000Z',
    })
    await queuePending({
      clientId: 'client-2',
      userId: 'alice',
      kind: 'reply',
      targetId: 'message-1',
      body: 'Second',
      attachmentIds: [],
      createdAt: '2026-03-22T08:01:00.000Z',
    })

    expect((await listPending('alice')).map((entry) => entry.clientId)).toEqual([
      'client-1',
      'client-2',
    ])

    await removePending('client-1')
    expect((await listPending('alice')).map((entry) => entry.clientId)).toEqual([
      'client-2',
    ])
  })
})
