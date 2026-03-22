import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { queryKeys, useFlushPending } from './hooks.ts'
import { removePending } from './outbox.ts'
import {
  flattenPages,
  mergeMessageIntoPages,
  mergeReplyIntoPages,
  replaceChannelSummary,
  updateMessageMeta,
  type CursorPage,
  type MessageRecord,
  type ReplyRecord,
} from './merge.ts'
import {
  wsServerEventSchema,
  type BootstrapPayload,
  type TypingScope,
  type WsServerEvent,
} from './model.ts'

type ConnectionState = 'offline' | 'connecting' | 'online'

type TypingRecord = {
  scope: TypingScope
  targetId: string
  userId: string
}

type PendingTypingRecord = {
  scope: TypingScope
  targetId: string
}

type RealtimeContextValue = {
  connectionState: ConnectionState
  typing: TypingRecord[]
  sendTyping: (scope: TypingScope, targetId: string) => void
  stopTyping: (scope: TypingScope, targetId: string) => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

const websocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export const ChatRealtimeProvider = ({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) => {
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline')
  const [typing, setTyping] = useState<TypingRecord[]>([])
  const socketRef = useRef<WebSocket | null>(null)
  const flushPending = useFlushPending(userId ?? undefined)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const queuedTypingRef = useRef<Map<string, PendingTypingRecord>>(new Map())

  const flushQueuedTyping = useEffectEvent(() => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return
    }

    for (const entry of queuedTypingRef.current.values()) {
      socketRef.current.send(
        JSON.stringify({
          type: 'typing.start',
          scope: entry.scope,
          targetId: entry.targetId,
        }),
      )
    }
  })

  const syncOnOpen = useEffectEvent(() => {
    setTyping([])
    void queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap })
    void queryClient.refetchQueries({ queryKey: queryKeys.bootstrap, type: 'active' })
    void queryClient.refetchQueries({
      queryKey: ['channel-messages'],
      type: 'active',
    })
    void queryClient.refetchQueries({
      queryKey: ['thread-replies'],
      type: 'active',
    })
    flushQueuedTyping()
    void flushPending()
  })

  const handlePayload = useEffectEvent((payload: WsServerEvent) => {
    if (payload.type === 'message.acknowledged') {
      void removePending(payload.clientId)
      return
    }

    if (payload.type === 'message.created') {
      queryClient.setQueryData<
        InfiniteData<CursorPage<MessageRecord>, string | null> | undefined
      >(queryKeys.channelMessages(payload.message.channelId), (current) =>
        mergeMessageIntoPages(current, payload.message),
      )
      return
    }

    if (payload.type === 'reply.created') {
      queryClient.setQueryData<
        InfiniteData<CursorPage<ReplyRecord>, string | null> | undefined
      >(queryKeys.threadReplies(payload.messageId), (current) =>
        mergeReplyIntoPages(current, payload.reply),
      )
      queryClient.setQueryData<
        InfiniteData<CursorPage<MessageRecord>, string | null> | undefined
      >(queryKeys.channelMessages(payload.channelId), (current) =>
        updateMessageMeta(current, payload.messageId, {
          replyCount: payload.replyCount,
          threadUnreadCount:
            (flattenPages(current?.pages).find((entry) => entry.id === payload.messageId)
              ?.threadUnreadCount ?? 0) + (payload.reply.authorId === userId ? 0 : 1),
        }),
      )
      return
    }

    if (payload.type === 'channel.updated') {
      queryClient.setQueryData<BootstrapPayload | undefined>(
        queryKeys.bootstrap,
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            channels: replaceChannelSummary(current.channels, payload.channel),
          }
        },
      )
      return
    }

    if (payload.type === 'read.updated') {
      if (payload.scope === 'thread') {
        queryClient.setQueriesData<
          InfiniteData<CursorPage<MessageRecord>, string | null> | undefined
        >({ queryKey: ['channel-messages'] }, (current) =>
          updateMessageMeta(current, payload.targetId, {
            threadUnreadCount: payload.unreadCount,
          }),
        )
      }

      return
    }

    if (payload.type === 'presence.updated') {
      queryClient.setQueryData<BootstrapPayload | undefined>(
        queryKeys.bootstrap,
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            presence: current.presence.map((entry) =>
              entry.userId === payload.userId
                ? {
                    ...entry,
                    state: payload.state,
                    lastActiveAt: payload.lastActiveAt,
                  }
                : entry,
            ),
          }
        },
      )
      return
    }

    if (payload.type === 'typing.started') {
      setTyping((current) => [
        ...current.filter(
          (entry) =>
            !(
              entry.scope === payload.scope &&
              entry.targetId === payload.targetId &&
              entry.userId === payload.userId
            ),
        ),
        {
          scope: payload.scope,
          targetId: payload.targetId,
          userId: payload.userId,
        },
      ])
      return
    }

    setTyping((current) =>
      current.filter(
        (entry) =>
          !(
            entry.scope === payload.scope &&
            entry.targetId === payload.targetId &&
            entry.userId === payload.userId
          ),
      ),
    )
  })

  useEffect(() => {
    if (!userId) {
      socketRef.current?.close()
      socketRef.current = null
      queuedTypingRef.current.clear()
      const timeout = window.setTimeout(() => {
        setConnectionState('offline')
        setTyping([])
      }, 0)

      return () => {
        window.clearTimeout(timeout)
      }
    }

    let active = true

    const connect = () => {
      if (!active) {
        return
      }

      setConnectionState(navigator.onLine ? 'connecting' : 'offline')
      const socket = new WebSocket(websocketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        setConnectionState('online')
        heartbeatRef.current = window.setInterval(() => {
          socket.send(JSON.stringify({ type: 'heartbeat' }))
        }, 12_000)
        syncOnOpen()
      })

      socket.addEventListener('message', (event) => {
        const payload = wsServerEventSchema.parse(JSON.parse(String(event.data)))
        handlePayload(payload)
      })

      socket.addEventListener('close', () => {
        setConnectionState(navigator.onLine ? 'connecting' : 'offline')

        if (heartbeatRef.current) {
          window.clearInterval(heartbeatRef.current)
        }

        if (!active) {
          return
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect()
        }, 1_100)
      })
    }

    connect()

    const onOnline = () => {
      syncOnOpen()
      socketRef.current?.close()
    }

    const onOffline = () => {
      setConnectionState('offline')
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      active = false
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }

      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
      }

      socketRef.current?.close()
      socketRef.current = null
    }
  }, [userId])

  const value = useMemo<RealtimeContextValue>(
    () => ({
      connectionState,
      typing,
      sendTyping: (scope, targetId) => {
        const key = `${scope}:${targetId}`
        queuedTypingRef.current.set(key, { scope, targetId })

        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          return
        }

        socketRef.current.send(
          JSON.stringify({
            type: 'typing.start',
            scope,
            targetId,
          }),
        )
      },
      stopTyping: (scope, targetId) => {
        queuedTypingRef.current.delete(`${scope}:${targetId}`)

        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          return
        }

        socketRef.current.send(
          JSON.stringify({
            type: 'typing.stop',
            scope,
            targetId,
          }),
        )
      },
    }),
    [connectionState, typing],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext)

  if (!context) {
    throw new Error('useRealtime must be used within ChatRealtimeProvider.')
  }

  return context
}
