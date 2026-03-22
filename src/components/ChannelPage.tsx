import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from './ToastProvider.tsx'
import {
  useBootstrapQuery,
  useChannelMessagesQuery,
  useMarkChannelReadMutation,
  useMarkThreadReadMutation,
  usePersistedDraft,
  useSendMessageMutation,
  useSendReplyMutation,
  useSessionQuery,
  useThreadRepliesQuery,
  useUploadMutation,
} from '../chat/hooks.ts'
import {
  flattenPages,
  type MessageRecord,
  type ReplyRecord,
} from '../chat/merge.ts'
import { useRealtime } from '../chat/socket.tsx'
import type { Attachment } from '../chat/model.ts'
import { Button } from './Button.tsx'

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

const TypingLabel = ({
  names,
}: {
  names: string[]
}) => {
  if (names.length === 0) {
    return null
  }

  return (
    <p className="typing-label">
      {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing…
    </p>
  )
}

const AttachmentCard = ({ attachment }: { attachment: Attachment }) => {
  if (attachment.kind === 'image') {
    return (
      <a className="attachment-card image" href={attachment.url} target="_blank" rel="noreferrer">
        <img alt={attachment.name} src={attachment.url} />
        <span>{attachment.name}</span>
      </a>
    )
  }

  return (
    <a className="attachment-card" href={attachment.url} target="_blank" rel="noreferrer">
      <strong>{attachment.name}</strong>
      <span>{Math.ceil(attachment.size / 1024)} KB</span>
    </a>
  )
}

const Composer = ({
  label,
  draft,
  onDraftChange,
  onSubmit,
  onTypingStart,
  onTypingStop,
  attachments,
  onFilesSelected,
  onRemoveAttachment,
  submitLabel,
  disabled,
}: {
  label: string
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => Promise<void>
  onTypingStart: () => void
  onTypingStop: () => void
  attachments: Attachment[]
  onFilesSelected?: (files: FileList | null) => Promise<void>
  onRemoveAttachment?: (attachmentId: string) => void
  submitLabel: string
  disabled: boolean
}) => {
  const typingTimeout = useRef<number | null>(null)
  const uploadInputId = useId()

  return (
    <section className="composer-card">
      <div className="sidebar-header">
        <strong>{label}</strong>
      </div>
      <textarea
        className="composer-input"
        disabled={disabled}
        value={draft}
        onChange={(event) => {
          onDraftChange(event.target.value)
          onTypingStart()

          if (typingTimeout.current) {
            window.clearTimeout(typingTimeout.current)
          }

          typingTimeout.current = window.setTimeout(() => {
            onTypingStop()
          }, 900)
        }}
        onBlur={() => {
          onTypingStop()
        }}
        placeholder="Write a message"
      />

      {attachments.length > 0 ? (
        <div className="attachment-stack">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-row">
              <AttachmentCard attachment={attachment} />
              {onRemoveAttachment ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAttachment(attachment.id)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="composer-actions">
        {onFilesSelected ? (
          <label className="upload-pill" htmlFor={uploadInputId}>
            <span>Upload image or doc</span>
            <input
              id={uploadInputId}
              className="sr-only"
              aria-label="Upload image or doc"
              multiple
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.docx"
              onChange={(event) => {
                void onFilesSelected(event.target.files)
                event.currentTarget.value = ''
              }}
            />
          </label>
        ) : null}
        <Button
          disabled={disabled || (draft.trim().length === 0 && attachments.length === 0)}
          onClick={() => {
            void onSubmit()
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </section>
  )
}

export const ChannelPage = () => {
  const { channelId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { pushToast } = useToast()
  const { connectionState, typing, sendTyping, stopTyping } = useRealtime()
  const sessionQuery = useSessionQuery()
  const bootstrapQuery = useBootstrapQuery(Boolean(sessionQuery.data))
  const messagesQuery = useChannelMessagesQuery(channelId, Boolean(channelId && sessionQuery.data))
  const markChannelReadMutation = useMarkChannelReadMutation()
  const markThreadReadMutation = useMarkThreadReadMutation()
  const sendMessageMutation = useSendMessageMutation(sessionQuery.data?.id)
  const sendReplyMutation = useSendReplyMutation(sessionQuery.data?.id)
  const uploadMutation = useUploadMutation()

  const threadId = searchParams.get('thread')
  const threadQuery = useThreadRepliesQuery(threadId ?? undefined, Boolean(threadId && sessionQuery.data))

  const channelDraft = usePersistedDraft(sessionQuery.data?.id, `channel:${channelId}`)
  const threadDraft = usePersistedDraft(sessionQuery.data?.id, `thread:${threadId ?? 'none'}`)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const previousScrollHeight = useRef<number | null>(null)
  const bootstrap = bootstrapQuery.data
  const currentUserId = sessionQuery.data?.id ?? ''
  const channel = bootstrap?.channels.find((entry) => entry.id === channelId) ?? null
  const messages: MessageRecord[] = flattenPages(messagesQuery.data?.pages)
  const activeThreadMessage = messages.find((message) => message.id === threadId) ?? null
  const replies: ReplyRecord[] = flattenPages(threadQuery.data?.pages)
  const userLookup = new Map(bootstrap?.users.map((user) => [user.id, user]) ?? [])
  const rows = useMemo(() => messages, [messages])
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 170,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  })

  const channelTypingNames = typing
    .filter(
      (entry) =>
        entry.scope === 'channel' &&
        entry.targetId === channelId &&
        entry.userId !== currentUserId,
    )
    .map((entry) => {
      const user = userLookup.get(entry.userId)

      if (!user) {
        throw new Error('Typing state referenced an unknown user.')
      }

      return user.name
    })

  const threadTypingNames = typing
    .filter(
      (entry) =>
        entry.scope === 'thread' &&
        entry.targetId === threadId &&
        entry.userId !== currentUserId,
    )
    .map((entry) => {
      const user = userLookup.get(entry.userId)

      if (!user) {
        throw new Error('Typing state referenced an unknown user.')
      }

      return user.name
    })

  useEffect(() => {
    if (!channel || messages.length === 0) {
      return
    }

    void markChannelReadMutation.mutateAsync(channel.id)
  }, [channel, markChannelReadMutation, messages.length])

  useEffect(() => {
    if (!threadId) {
      return
    }

    void markThreadReadMutation.mutateAsync(threadId)
  }, [markThreadReadMutation, replies.length, threadId])

  useEffect(() => {
    if (!scrollRef.current || rows.length === 0) {
      return
    }

    if (previousScrollHeight.current !== null) {
      const nextHeight = scrollRef.current.scrollHeight
      scrollRef.current.scrollTop += nextHeight - previousScrollHeight.current
      previousScrollHeight.current = null
      return
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [rows.length])

  if (!bootstrap || !sessionQuery.data) {
    if (bootstrapQuery.isPending || sessionQuery.isPending) {
      return (
        <section className="state-card">
          <h2>Loading channel</h2>
        </section>
      )
    }

    return (
      <section className="state-card">
        <h2>Workspace unavailable</h2>
        <p>{bootstrapQuery.error?.message ?? 'Failed to load workspace data.'}</p>
      </section>
    )
  }

  if (!channel) {
    return <Navigate replace to={`/channels/${bootstrap.defaultChannelId}`} />
  }

  const loadOlderMessages = async () => {
    if (!messagesQuery.hasNextPage || !scrollRef.current) {
      return
    }

    previousScrollHeight.current = scrollRef.current.scrollHeight
    await messagesQuery.fetchNextPage()
  }

  const loadOlderReplies = async () => {
    if (!threadQuery.hasNextPage) {
      return
    }

    await threadQuery.fetchNextPage()
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    for (const file of [...files]) {
      try {
        const attachment = await uploadMutation.mutateAsync(file)
        setAttachments((current) => [...current, attachment])
      } catch (error) {
        pushToast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Attachment upload failed.',
        })
      }
    }
  }

  const sendChannelMessage = async () => {
    try {
      await sendMessageMutation.mutateAsync({
        channelId,
        body: channelDraft.value.trim(),
        attachments,
      })
      await channelDraft.clear()
      setAttachments([])
    } catch (error) {
      pushToast({
        title: 'Message failed',
        description: error instanceof Error ? error.message : 'Message delivery failed.',
      })
    }
  }

  const sendThreadReply = async () => {
    if (!threadId) {
      return
    }

    try {
      await sendReplyMutation.mutateAsync({
        messageId: threadId,
        body: threadDraft.value.trim(),
      })
      await threadDraft.clear()
    } catch (error) {
      pushToast({
        title: 'Reply failed',
        description: error instanceof Error ? error.message : 'Thread reply failed.',
      })
    }
  }

  return (
    <section className="channel-shell">
      <header className="channel-header">
        <div>
          <p className="eyebrow">Channel</p>
          <h2>#{channel.name}</h2>
          <p>{channel.topic}</p>
        </div>
        <div className="connection-pill" data-state={connectionState}>
          {connectionState}
        </div>
      </header>

      <div className="channel-layout">
        <section className="stream-panel">
          <div className="stream-toolbar">
            <div>
              <strong>Live channel stream</strong>
              <p>{channel.topic}</p>
            </div>
            {messagesQuery.hasNextPage ? (
              <Button
                variant="ghost"
                size="sm"
                busy={messagesQuery.isFetchingNextPage}
                onClick={() => {
                  void loadOlderMessages()
                }}
              >
                Load older
              </Button>
            ) : null}
          </div>

          <div ref={scrollRef} className="message-scroll-area" aria-label="Channel messages">
            <div
              className="virtual-space"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const message = rows[virtualRow.index]

                if (!message) {
                  throw new Error('Virtualized stream referenced a missing message row.')
                }

                const author = userLookup.get(message.authorId)

                if (!author) {
                  throw new Error('Message author was not found.')
                }

                return (
                  <article
                    key={message.id}
                    className="message-card"
                    data-pending={message.optimistic === true}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <div className="message-head">
                      <div className="identity-card compact">
                        <div className="avatar-badge">{author.avatarLabel}</div>
                        <div>
                          <strong>{author.name}</strong>
                          <p>{formatTimestamp(message.createdAt)}</p>
                        </div>
                      </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchParams((current) => {
                              const next = new URLSearchParams(current)
                              next.set('thread', message.id)
                              return next
                            })
                          }}
                        >
                        {message.replyCount} replies
                        {message.threadUnreadCount > 0
                          ? ` • ${message.threadUnreadCount} unread`
                          : ''}
                      </Button>
                    </div>
                    <p className="message-body">{message.body}</p>
                    {message.attachments.length > 0 ? (
                      <div className="attachment-stack">
                        {message.attachments.map((attachment) => (
                          <AttachmentCard key={attachment.id} attachment={attachment} />
                        ))}
                      </div>
                    ) : null}
                    {message.optimistic ? (
                      <p className="pending-note">Pending delivery. It will resend after reconnect.</p>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </div>

          <TypingLabel names={channelTypingNames} />

          <Composer
            label="Channel composer"
            draft={channelDraft.value}
            onDraftChange={channelDraft.setValue}
            onSubmit={sendChannelMessage}
            onTypingStart={() => sendTyping('channel', channelId)}
            onTypingStop={() => stopTyping('channel', channelId)}
            attachments={attachments}
            onFilesSelected={uploadFiles}
            onRemoveAttachment={(attachmentId) => {
              setAttachments((current) =>
                current.filter((attachment) => attachment.id !== attachmentId),
              )
            }}
            submitLabel="Send message"
            disabled={channelDraft.isReady === false || sendMessageMutation.isPending}
          />
        </section>

        <aside className="thread-panel">
          {activeThreadMessage ? (
            <>
              <div className="stream-toolbar">
                <div>
                  <strong>Thread</strong>
                  <p>{activeThreadMessage.replyCount} replies</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current)
                      next.delete('thread')
                      return next
                    })
                  }}
                >
                  Close
                </Button>
              </div>

              <article className="thread-root-card">
                <strong>{userLookup.get(activeThreadMessage.authorId)?.name}</strong>
                <p>{activeThreadMessage.body}</p>
              </article>

              <div className="thread-list">
                {threadQuery.hasNextPage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    busy={threadQuery.isFetchingNextPage}
                    onClick={() => {
                      void loadOlderReplies()
                    }}
                  >
                    Load older replies
                  </Button>
                ) : null}

                {replies.map((reply) => {
                  const author = userLookup.get(reply.authorId)

                  if (!author) {
                    throw new Error('Reply author was not found.')
                  }

                  return (
                    <article
                      key={reply.id}
                      className="thread-reply-card"
                      data-pending={reply.optimistic === true}
                    >
                      <strong>{author.name}</strong>
                      <p>{reply.body}</p>
                      <span>{formatTimestamp(reply.createdAt)}</span>
                    </article>
                  )
                })}
              </div>

              <TypingLabel names={threadTypingNames} />

              <Composer
                label="Thread reply"
                draft={threadDraft.value}
                onDraftChange={threadDraft.setValue}
                onSubmit={sendThreadReply}
                onTypingStart={() => sendTyping('thread', activeThreadMessage.id)}
                onTypingStop={() => stopTyping('thread', activeThreadMessage.id)}
                attachments={[]}
                submitLabel="Reply"
                disabled={threadDraft.isReady === false || sendReplyMutation.isPending}
              />
            </>
          ) : (
            <section className="empty-thread-card">
              <strong>Select a message thread</strong>
              <p>Open a message thread to review replies, unread counts, and live typing.</p>
            </section>
          )}
        </aside>
      </div>
    </section>
  )
}
