import { describe, expect, it } from 'vitest'
import { ChatStore } from './store.ts'

describe('ChatStore', () => {
  it('derives unread counts per user and channel', () => {
    const store = new ChatStore()
    const generalSummary = store.getChannelSummary('casey', 'general')

    expect(generalSummary.unreadCount).toBeGreaterThan(0)
    expect(store.getChannelSummary('alice', 'support').unreadCount).toBe(0)
  })

  it('paginates channel messages from newest backwards', () => {
    const store = new ChatStore()
    const page = store.getMessages('alice', 'general', undefined)

    expect(page.items.at(-1)?.channelId).toBe('general')
    expect(page.nextCursor).toBe('7')
  })

  it('tracks idle presence from the last active timestamp', () => {
    const store = new ChatStore()
    store.updatePresence('alice', 'online')

    expect(store.getIdleUsers(1_000_000)).toEqual([])
  })

  it('increments thread reply counts and unread state for other users', () => {
    const store = new ChatStore()
    const parentMessage = store.getMessages('alice', 'general', undefined).items.at(-1)

    if (!parentMessage) {
      throw new Error('Expected a seeded parent message.')
    }

    store.createReply({
      userId: 'ben',
      messageId: parentMessage.id,
      clientId: 'reply-client-1',
      body: 'Thread follow-up',
    })

    expect(store.getThreadReplies('alice', parentMessage.id, undefined).items).toHaveLength(1)
    expect(store.getThreadUnreadCount('alice', parentMessage.id)).toBe(1)
    expect(store.getMessages('alice', 'general', undefined).items.at(-1)).toEqual(
      expect.objectContaining({
        id: parentMessage.id,
        replyCount: 1,
        threadUnreadCount: 1,
      }),
    )
  })
})
