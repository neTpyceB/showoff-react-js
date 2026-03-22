import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { chatApi } from './api.ts'
import {
  clearDraft,
  getDraft,
  listPending,
  queuePending,
  removePending,
  setDraft,
  isNetworkFailure,
  type PendingEnvelope,
} from './outbox.ts'
import {
  createOptimisticMessage,
  createOptimisticReply,
  flattenPages,
  mergeMessageIntoPages,
  mergeReplyIntoPages,
  updateMessageMeta,
  type CursorPage,
  type MessageRecord,
  type ReplyRecord,
} from './merge.ts'
import type { Attachment, SendMessageInput, SendReplyInput } from './model.ts'

export const queryKeys = {
  session: ['session'] as const,
  bootstrap: ['bootstrap'] as const,
  channelMessages: (channelId: string) => ['channel-messages', channelId] as const,
  threadReplies: (messageId: string) => ['thread-replies', messageId] as const,
}

export const useSessionQuery = () =>
  useQuery({
    queryKey: queryKeys.session,
    queryFn: () => chatApi.getSession(),
    staleTime: 10_000,
    select: (payload) => payload.user,
  })

export const useLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => chatApi.login(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap })
    },
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => chatApi.logout(),
    onSuccess: async () => {
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
    },
  })
}

export const useBootstrapQuery = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: () => chatApi.getBootstrap(),
    enabled,
    staleTime: 5_000,
  })

export const useChannelMessagesQuery = (channelId: string | undefined, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: channelId ? queryKeys.channelMessages(channelId) : ['channel-messages', 'idle'],
    queryFn: async ({ pageParam }) => {
      const page = await chatApi.getChannelMessages(channelId!, pageParam)
      return {
        ...page,
        items: page.items.map((item) => ({ ...item } satisfies MessageRecord)),
      }
    },
    enabled: Boolean(channelId && enabled),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })

export const useThreadRepliesQuery = (messageId: string | undefined, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: messageId ? queryKeys.threadReplies(messageId) : ['thread-replies', 'idle'],
    queryFn: async ({ pageParam }) => {
      const page = await chatApi.getThreadReplies(messageId!, pageParam)
      return {
        ...page,
        items: page.items.map((item) => ({ ...item } satisfies ReplyRecord)),
      }
    },
    enabled: Boolean(messageId && enabled),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })

export const useUploadMutation = () =>
  useMutation({
    mutationFn: async (file: File) => {
      if (!navigator.onLine) {
        throw new Error('Attachments require an active connection.')
      }

      return chatApi.uploadAttachment(file)
    },
  })

const nowIso = () => new Date().toISOString()

const createPendingMessageEnvelope = (input: {
  userId: string
  targetId: string
  body: string
  attachmentIds: string[]
}): PendingEnvelope => ({
  clientId: crypto.randomUUID(),
  userId: input.userId,
  kind: 'message',
  targetId: input.targetId,
  body: input.body,
  attachmentIds: input.attachmentIds,
  createdAt: nowIso(),
})

const createPendingReplyEnvelope = (input: {
  userId: string
  targetId: string
  body: string
}): PendingEnvelope => ({
  clientId: crypto.randomUUID(),
  userId: input.userId,
  kind: 'reply',
  targetId: input.targetId,
  body: input.body,
  attachmentIds: [],
  createdAt: nowIso(),
})

export const useSendMessageMutation = (userId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      channelId: string
      body: string
      attachments: Attachment[]
    }) => {
      if (!userId) {
        throw new Error('User session is required.')
      }

      const envelope = createPendingMessageEnvelope({
        userId,
        targetId: input.channelId,
        body: input.body,
        attachmentIds: input.attachments.map((attachment) => attachment.id),
      })

      await queuePending(envelope)

      queryClient.setQueryData<
        InfiniteData<CursorPage<MessageRecord>, string | null> | undefined
      >(queryKeys.channelMessages(input.channelId), (current) =>
        mergeMessageIntoPages(
          current,
          createOptimisticMessage({
            clientId: envelope.clientId,
            channelId: input.channelId,
            authorId: userId,
            body: input.body,
            attachments: input.attachments,
            createdAt: envelope.createdAt,
          }),
        ),
      )

      try {
        await chatApi.sendMessage(input.channelId, {
          clientId: envelope.clientId,
          body: input.body,
          attachmentIds: envelope.attachmentIds,
        } satisfies SendMessageInput)
      } catch (error) {
        if (!isNetworkFailure(error)) {
          await removePending(envelope.clientId)
          throw error
        }
      }

      return envelope
    },
  })
}

export const useSendReplyMutation = (userId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { messageId: string; body: string }) => {
      if (!userId) {
        throw new Error('User session is required.')
      }

      const envelope = createPendingReplyEnvelope({
        userId,
        targetId: input.messageId,
        body: input.body,
      })

      await queuePending(envelope)
      queryClient.setQueryData<
        InfiniteData<CursorPage<ReplyRecord>, string | null> | undefined
      >(queryKeys.threadReplies(input.messageId), (current) =>
        mergeReplyIntoPages(
          current,
          createOptimisticReply({
            clientId: envelope.clientId,
            messageId: input.messageId,
            authorId: userId,
            body: input.body,
            createdAt: envelope.createdAt,
          }),
        ),
      )
      queryClient.setQueriesData<
        InfiniteData<CursorPage<MessageRecord>, string | null> | undefined
      >({ queryKey: ['channel-messages'] }, (current) =>
        updateMessageMeta(current, input.messageId, {
          replyCount:
            (flattenPages(current?.pages).find((entry) => entry.id === input.messageId)
              ?.replyCount ?? 0) + 1,
        }),
      )

      try {
        await chatApi.sendReply(input.messageId, {
          clientId: envelope.clientId,
          body: input.body,
        } satisfies SendReplyInput)
      } catch (error) {
        if (!isNetworkFailure(error)) {
          await removePending(envelope.clientId)
          throw error
        }
      }

      return envelope
    },
  })
}

export const useMarkChannelReadMutation = () =>
  useMutation({
    mutationFn: (channelId: string) => chatApi.markChannelRead(channelId),
  })

export const useMarkThreadReadMutation = () =>
  useMutation({
    mutationFn: (messageId: string) => chatApi.markThreadRead(messageId),
  })

export const usePersistedDraft = (userId: string | undefined, scope: string) => {
  const [value, setValueState] = useState('')
  const [isReady, setIsReady] = useState(true)
  const lastPersisted = useRef('')

  useEffect(() => {
    let active = true

    void Promise.resolve(userId ? getDraft(userId, scope) : '').then((draft) => {
      if (!active) {
        return
      }

      setValueState(draft)
      lastPersisted.current = draft
      setIsReady(true)
    })

    return () => {
      active = false
    }
  }, [scope, userId])

  useEffect(() => {
    if (!userId || !isReady || value === lastPersisted.current) {
      return
    }

    const timeout = window.setTimeout(() => {
      lastPersisted.current = value

      if (value.trim().length === 0) {
        void clearDraft(userId, scope)
        return
      }

      void setDraft(userId, scope, value)
    }, 160)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [isReady, scope, userId, value])

  return {
    value,
    isReady,
    setValue: setValueState,
    clear: async () => {
      setValueState('')

      if (userId) {
        lastPersisted.current = ''
        await clearDraft(userId, scope)
      }
    },
  }
}

export const useFlushPending = (userId: string | undefined) => {
  return useCallback(async () => {
    if (!userId) {
      return
    }

    const pending = await listPending(userId)

    for (const entry of pending) {
      try {
        if (entry.kind === 'message') {
          await chatApi.sendMessage(entry.targetId, {
            clientId: entry.clientId,
            body: entry.body,
            attachmentIds: entry.attachmentIds,
          })
        } else {
          await chatApi.sendReply(entry.targetId, {
            clientId: entry.clientId,
            body: entry.body,
          })
        }
      } catch (error) {
        if (isNetworkFailure(error)) {
          return
        }

        await removePending(entry.clientId)
      }
    }
  }, [userId])
}
