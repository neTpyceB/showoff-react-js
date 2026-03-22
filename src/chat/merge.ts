import type { InfiniteData } from '@tanstack/react-query'
import type { Attachment, Channel, ChatMessage, ThreadReply } from './model.ts'

export type MessageRecord = ChatMessage & {
  optimistic?: boolean
}

export type ReplyRecord = ThreadReply & {
  optimistic?: boolean
}

export type CursorPage<T> = {
  items: T[]
  nextCursor: string | null
}

const messageSort = (left: MessageRecord, right: MessageRecord) =>
  left.version - right.version || left.createdAt.localeCompare(right.createdAt)

const replySort = (left: ReplyRecord, right: ReplyRecord) =>
  left.version - right.version || left.createdAt.localeCompare(right.createdAt)

const dedupeMessages = (items: MessageRecord[]) => {
  const next = new Map<string, MessageRecord>()

  for (const item of items) {
    const existing = [...next.values()].find(
      (candidate) => candidate.id === item.id || candidate.clientId === item.clientId,
    )

    if (existing) {
      next.delete(existing.id)
    }

    next.set(item.id, item)
  }

  return [...next.values()].sort(messageSort)
}

const dedupeReplies = (items: ReplyRecord[]) => {
  const next = new Map<string, ReplyRecord>()

  for (const item of items) {
    const existing = [...next.values()].find(
      (candidate) => candidate.id === item.id || candidate.clientId === item.clientId,
    )

    if (existing) {
      next.delete(existing.id)
    }

    next.set(item.id, item)
  }

  return [...next.values()].sort(replySort)
}

export const mergeMessageIntoPages = (
  current: InfiniteData<CursorPage<MessageRecord>, string | null> | undefined,
  message: MessageRecord,
) => {
  if (!current) {
    return {
      pageParams: [null],
      pages: [
        {
          items: [message],
          nextCursor: null,
        },
      ],
    } satisfies InfiniteData<CursorPage<MessageRecord>, string | null>
  }

  const pages = current.pages.map((page, index) =>
    index === current.pages.length - 1
      ? {
          ...page,
          items: dedupeMessages([...page.items, message]),
        }
      : page,
  )

  return {
    ...current,
    pages,
  }
}

export const mergeReplyIntoPages = (
  current: InfiniteData<CursorPage<ReplyRecord>, string | null> | undefined,
  reply: ReplyRecord,
) => {
  if (!current) {
    return {
      pageParams: [null],
      pages: [
        {
          items: [reply],
          nextCursor: null,
        },
      ],
    } satisfies InfiniteData<CursorPage<ReplyRecord>, string | null>
  }

  const pages = current.pages.map((page, index) =>
    index === current.pages.length - 1
      ? {
          ...page,
          items: dedupeReplies([...page.items, reply]),
        }
      : page,
  )

  return {
    ...current,
    pages,
  }
}

export const prependOlderMessagePage = (
  current: InfiniteData<CursorPage<MessageRecord>, string | null> | undefined,
  olderPage: CursorPage<MessageRecord>,
  pageParam: string | null,
) => {
  if (!current) {
    return {
      pageParams: [pageParam],
      pages: [olderPage],
    } satisfies InfiniteData<CursorPage<MessageRecord>, string | null>
  }

  return {
    pageParams: [pageParam, ...current.pageParams],
    pages: [
      {
        ...olderPage,
        items: dedupeMessages([
          ...olderPage.items,
          ...current.pages.flatMap((page) => page.items),
        ]).filter((item) =>
          olderPage.items.some(
            (candidate) => candidate.id === item.id || candidate.clientId === item.clientId,
          ),
        ),
      },
      ...current.pages,
    ],
  }
}

export const prependOlderReplyPage = (
  current: InfiniteData<CursorPage<ReplyRecord>, string | null> | undefined,
  olderPage: CursorPage<ReplyRecord>,
  pageParam: string | null,
) => {
  if (!current) {
    return {
      pageParams: [pageParam],
      pages: [olderPage],
    } satisfies InfiniteData<CursorPage<ReplyRecord>, string | null>
  }

  return {
    pageParams: [pageParam, ...current.pageParams],
    pages: [
      {
        ...olderPage,
        items: dedupeReplies([
          ...olderPage.items,
          ...current.pages.flatMap((page) => page.items),
        ]).filter((item) =>
          olderPage.items.some(
            (candidate) => candidate.id === item.id || candidate.clientId === item.clientId,
          ),
        ),
      },
      ...current.pages,
    ],
  }
}

export const updateMessageMeta = (
  current: InfiniteData<CursorPage<MessageRecord>, string | null> | undefined,
  messageId: string,
  updates: Partial<Pick<MessageRecord, 'replyCount' | 'threadUnreadCount'>>,
) => {
  if (!current) {
    return current
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === messageId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    })),
  }
}

export const replaceChannelSummary = (channels: Channel[], nextChannel: Channel) =>
  channels.map((channel) => (channel.id === nextChannel.id ? nextChannel : channel))

export const flattenPages = <T>(pages: CursorPage<T>[] | undefined) =>
  pages?.flatMap((page) => page.items) ?? []

export const createOptimisticMessage = (input: {
  clientId: string
  channelId: string
  authorId: string
  body: string
  attachments: Attachment[]
  createdAt: string
}): MessageRecord => ({
  id: `optimistic:${input.clientId}`,
  clientId: input.clientId,
  channelId: input.channelId,
  authorId: input.authorId,
  body: input.body,
  attachments: input.attachments,
  createdAt: input.createdAt,
  version: Number.MAX_SAFE_INTEGER,
  replyCount: 0,
  threadUnreadCount: 0,
  optimistic: true,
})

export const createOptimisticReply = (input: {
  clientId: string
  messageId: string
  authorId: string
  body: string
  createdAt: string
}): ReplyRecord => ({
  id: `optimistic:${input.clientId}`,
  clientId: input.clientId,
  messageId: input.messageId,
  authorId: input.authorId,
  body: input.body,
  createdAt: input.createdAt,
  version: Number.MAX_SAFE_INTEGER,
  optimistic: true,
})
