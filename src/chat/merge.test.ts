import { describe, expect, it } from 'vitest'
import {
  createOptimisticMessage,
  mergeMessageIntoPages,
  updateMessageMeta,
  type CursorPage,
  type MessageRecord,
} from './merge.ts'

describe('chat merge helpers', () => {
  it('reconciles an optimistic message using the shared client id', () => {
    const optimistic = createOptimisticMessage({
      clientId: 'client-1',
      channelId: 'general',
      authorId: 'alice',
      body: 'Pending',
      attachments: [],
      createdAt: '2026-03-22T08:00:00.000Z',
    })

    const merged = mergeMessageIntoPages(
      {
        pageParams: [null],
        pages: [
          {
            items: [optimistic],
            nextCursor: null,
          },
        ],
      },
      {
        ...optimistic,
        id: 'message-9',
        body: 'Delivered',
        createdAt: '2026-03-22T08:00:05.000Z',
        version: 9,
        optimistic: false,
      },
    )

    expect(merged.pages[0]?.items).toEqual([
      expect.objectContaining({
        id: 'message-9',
        clientId: 'client-1',
        body: 'Delivered',
      }),
    ])
  })

  it('updates thread counters for a parent message', () => {
    const current = {
      pageParams: [null],
      pages: [
        {
          items: [
            {
              id: 'message-1',
              clientId: 'client-1',
              channelId: 'general',
              authorId: 'alice',
              body: 'Thread root',
              attachments: [],
              createdAt: '2026-03-22T08:00:00.000Z',
              version: 1,
              replyCount: 0,
              threadUnreadCount: 0,
            } satisfies MessageRecord,
          ],
          nextCursor: null,
        } satisfies CursorPage<MessageRecord>,
      ],
    }

    const updated = updateMessageMeta(current, 'message-1', {
      replyCount: 3,
      threadUnreadCount: 2,
    })

    expect(updated?.pages[0]?.items[0]).toEqual(
      expect.objectContaining({
        replyCount: 3,
        threadUnreadCount: 2,
      }),
    )
  })
})
