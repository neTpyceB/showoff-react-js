import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  attachmentRoute,
  buildCursor,
  pageSize,
  parseCursor,
  type Attachment,
  type Channel,
  type ChatMessage,
  type PresenceRecord,
  type ThreadReply,
  type User,
  type Workspace,
  type PresenceState,
} from '../src/chat/model.ts'

type StoredAttachment = Attachment & {
  absolutePath: string
  uploaderId: string
}

type ChannelReadState = Record<string, number>
type ThreadReadState = Record<string, number>

const nowFromSequence = (sequence: number) =>
  new Date(Date.UTC(2026, 2, 22, 8, 0, sequence)).toISOString()

const workspace: Workspace = {
  id: 'workspace-1',
  name: 'Orbit Team',
  description: 'Realtime collaboration workspace for product and support operations.',
}

const users: User[] = [
  {
    id: 'alice',
    name: 'Alice Johnson',
    title: 'Support Lead',
    email: 'alice@showoff.dev',
    avatarLabel: 'AJ',
  },
  {
    id: 'ben',
    name: 'Ben Carter',
    title: 'Engineering Manager',
    email: 'ben@showoff.dev',
    avatarLabel: 'BC',
  },
  {
    id: 'casey',
    name: 'Casey Diaz',
    title: 'Customer Success',
    email: 'casey@showoff.dev',
    avatarLabel: 'CD',
  },
]

const channelSeeds = [
  {
    id: 'general',
    name: 'general',
    topic: 'Daily coordination and rollout updates.',
  },
  {
    id: 'support',
    name: 'support',
    topic: 'Customer escalations and triage.',
  },
  {
    id: 'releases',
    name: 'releases',
    topic: 'Deployments, incidents, and release readiness.',
  },
]

const uploadsDirectory = join(process.cwd(), '.runtime', 'uploads')
mkdirSync(uploadsDirectory, { recursive: true })

export class ChatStore {
  private readonly workspace = workspace
  private readonly users = users
  private readonly channels = channelSeeds
  private readonly messages = new Map<string, ChatMessage[]>()
  private readonly replies = new Map<string, ThreadReply[]>()
  private readonly attachments = new Map<string, StoredAttachment>()
  private readonly sessions = new Map<string, string>()
  private readonly channelReads = new Map<string, ChannelReadState>()
  private readonly threadReads = new Map<string, ThreadReadState>()
  private readonly presence = new Map<string, PresenceRecord>()
  private readonly deliveredMessages = new Map<string, ChatMessage>()
  private readonly deliveredReplies = new Map<string, ThreadReply>()
  private sequence = 1

  constructor() {
    for (const channel of this.channels) {
      this.messages.set(channel.id, [])
    }

    this.seedMessages()

    for (const user of this.users) {
      this.channelReads.set(user.id, {})
      this.threadReads.set(user.id, {})
      this.presence.set(user.id, {
        userId: user.id,
        state: 'offline',
        lastActiveAt: nowFromSequence(this.sequence),
      })
    }

    this.markChannelRead('alice', 'general')
    this.markChannelRead('alice', 'support')
    this.markChannelRead('ben', 'general')
  }

  getUploadsDirectory() {
    return uploadsDirectory
  }

  createSession(userId: string) {
    this.getUser(userId)
    const sessionId = randomUUID()
    this.sessions.set(sessionId, userId)
    return sessionId
  }

  destroySession(sessionId: string) {
    this.sessions.delete(sessionId)
  }

  getUserIdForSession(sessionId: string | undefined) {
    if (!sessionId) {
      return null
    }

    return this.sessions.get(sessionId) ?? null
  }

  getUser(userId: string) {
    const user = this.users.find((entry) => entry.id === userId)

    if (!user) {
      throw new Error('Unknown user.')
    }

    return user
  }

  getSessionPayload(userId: string | null) {
    return {
      user: userId ? this.getUser(userId) : null,
    }
  }

  getBootstrap(userId: string) {
    this.getUser(userId)

    return {
      workspace: this.workspace,
      currentUser: this.getUser(userId),
      users: this.users,
      presence: this.users.map((user) => this.getPresence(user.id)),
      channels: this.channels.map((channel) => this.getChannelSummary(userId, channel.id)),
      defaultChannelId: this.channels[0]!.id,
    }
  }

  getMessages(userId: string, channelId: string, cursor: string | undefined) {
    this.getUser(userId)
    const channelMessages = this.getChannelMessages(channelId)
    const beforeSequence = parseCursor(cursor)
    const filtered = beforeSequence
      ? channelMessages.filter((message) => this.getSequence(message.id) < beforeSequence)
      : channelMessages
    const pageItems = filtered.slice(-pageSize)

    return {
      items: pageItems.map((message) => this.withThreadUnreadCount(userId, message)),
      nextCursor:
        filtered.length > pageItems.length
          ? buildCursor(this.getSequence(pageItems[0]!.id))
          : null,
    }
  }

  getThreadReplies(userId: string, messageId: string, cursor: string | undefined) {
    this.getUser(userId)
    this.getMessage(messageId)
    const replies = this.replies.get(messageId) ?? []
    const beforeSequence = parseCursor(cursor)
    const filtered = beforeSequence
      ? replies.filter((reply) => this.getSequence(reply.id) < beforeSequence)
      : replies
    const pageItems = filtered.slice(-pageSize)

    return {
      items: pageItems,
      nextCursor:
        filtered.length > pageItems.length
          ? buildCursor(this.getSequence(pageItems[0]!.id))
          : null,
    }
  }

  createUpload(input: {
    userId: string
    fileName: string
    mimeType: string
    size: number
    absolutePath: string
    kind: Attachment['kind']
  }) {
    const attachment: StoredAttachment = {
      id: `attachment-${randomUUID()}`,
      name: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      kind: input.kind,
      absolutePath: input.absolutePath,
      uploaderId: input.userId,
      url: attachmentRoute(`attachment-${randomUUID()}`),
    }

    attachment.url = attachmentRoute(attachment.id)
    this.attachments.set(attachment.id, attachment)
    return attachment
  }

  getAttachment(attachmentId: string) {
    const attachment = this.attachments.get(attachmentId)

    if (!attachment) {
      throw new Error('Attachment was not found.')
    }

    return attachment
  }

  createMessage(input: {
    userId: string
    channelId: string
    clientId: string
    body: string
    attachmentIds: string[]
  }) {
    const deliveryKey = `${input.userId}:${input.clientId}`
    const existing = this.deliveredMessages.get(deliveryKey)

    if (existing) {
      return existing
    }

    const message: ChatMessage = {
      id: `message-${this.sequence}`,
      clientId: input.clientId,
      channelId: input.channelId,
      authorId: input.userId,
      body: input.body,
      attachments: input.attachmentIds.map((attachmentId) =>
        this.toPublicAttachment(this.getAttachment(attachmentId)),
      ),
      createdAt: nowFromSequence(this.sequence),
      version: this.sequence,
      replyCount: 0,
      threadUnreadCount: 0,
    }

    this.sequence += 1
    this.getChannelMessages(input.channelId).push(message)
    this.deliveredMessages.set(deliveryKey, message)
    this.markChannelRead(input.userId, input.channelId)

    return message
  }

  createReply(input: {
    userId: string
    messageId: string
    clientId: string
    body: string
  }) {
    const deliveryKey = `${input.userId}:${input.clientId}`
    const existing = this.deliveredReplies.get(deliveryKey)

    if (existing) {
      return existing
    }

    const reply: ThreadReply = {
      id: `reply-${this.sequence}`,
      clientId: input.clientId,
      messageId: input.messageId,
      authorId: input.userId,
      body: input.body,
      createdAt: nowFromSequence(this.sequence),
      version: this.sequence,
    }

    this.sequence += 1
    const threadReplies = this.replies.get(input.messageId) ?? []
    threadReplies.push(reply)
    this.replies.set(input.messageId, threadReplies)
    this.deliveredReplies.set(deliveryKey, reply)
    this.incrementReplyCount(input.messageId)
    this.markThreadRead(input.userId, input.messageId)

    return reply
  }

  markChannelRead(userId: string, channelId: string) {
    const messages = this.getChannelMessages(channelId)
    const lastSequence = messages.length === 0 ? 0 : this.getSequence(messages.at(-1)!.id)
    this.channelReads.set(userId, {
      ...this.channelReads.get(userId),
      [channelId]: lastSequence,
    })

    return this.getChannelSummary(userId, channelId)
  }

  markThreadRead(userId: string, messageId: string) {
    const replies = this.replies.get(messageId) ?? []
    const lastSequence = replies.length === 0 ? 0 : this.getSequence(replies.at(-1)!.id)
    this.threadReads.set(userId, {
      ...this.threadReads.get(userId),
      [messageId]: lastSequence,
    })

    return {
      unreadCount: this.getThreadUnreadCount(userId, messageId),
    }
  }

  updatePresence(userId: string, state: PresenceState) {
    const nextPresence = {
      userId,
      state,
      lastActiveAt: new Date().toISOString(),
    } satisfies PresenceRecord

    this.presence.set(userId, nextPresence)
    return nextPresence
  }

  touchPresence(userId: string) {
    const current = this.getPresence(userId)
    const nextState: PresenceState = current.state === 'offline' ? 'online' : 'online'
    return this.updatePresence(userId, nextState)
  }

  toPublicAttachment(attachment: StoredAttachment): Attachment {
    const publicAttachment: Attachment = {
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      kind: attachment.kind,
      url: attachment.url,
    }

    return publicAttachment
  }

  getChannelSummary(userId: string, channelId: string): Channel {
    const channel = this.channels.find((entry) => entry.id === channelId)

    if (!channel) {
      throw new Error('Channel was not found.')
    }

    const messages = this.getChannelMessages(channelId)
    const lastMessage = messages.at(-1) ?? null

    return {
      id: channel.id,
      name: channel.name,
      topic: channel.topic,
      unreadCount: this.getChannelUnreadCount(userId, channelId),
      lastMessageAt: lastMessage?.createdAt ?? null,
      lastMessagePreview: lastMessage?.body ?? null,
    }
  }

  getThreadUnreadCount(userId: string, messageId: string) {
    const lastReadSequence = this.threadReads.get(userId)?.[messageId] ?? 0
    return (this.replies.get(messageId) ?? []).filter(
      (reply) =>
        this.getSequence(reply.id) > lastReadSequence && reply.authorId !== userId,
    ).length
  }

  getPresence(userId: string) {
    const presence = this.presence.get(userId)

    if (!presence) {
      throw new Error('Presence was not found.')
    }

    return presence
  }

  getPresenceSnapshot() {
    return this.users.map((user) => this.getPresence(user.id))
  }

  getChannelIdForMessage(messageId: string) {
    for (const [channelId, messages] of this.messages.entries()) {
      if (messages.some((message) => message.id === messageId)) {
        return channelId
      }
    }

    throw new Error('Message channel was not found.')
  }

  getIdleUsers(thresholdMs: number) {
    const now = Date.now()
    return this.getPresenceSnapshot().filter(
      (presence) =>
        presence.state === 'online' &&
        now - new Date(presence.lastActiveAt).getTime() >= thresholdMs,
    )
  }

  private withThreadUnreadCount(userId: string, message: ChatMessage) {
    return {
      ...message,
      threadUnreadCount: this.getThreadUnreadCount(userId, message.id),
      replyCount: (this.replies.get(message.id) ?? []).length,
    }
  }

  private getChannelUnreadCount(userId: string, channelId: string) {
    const lastReadSequence = this.channelReads.get(userId)?.[channelId] ?? 0
    return this.getChannelMessages(channelId).filter(
      (message) =>
        this.getSequence(message.id) > lastReadSequence && message.authorId !== userId,
    ).length
  }

  private incrementReplyCount(messageId: string) {
    for (const [channelId, messages] of this.messages.entries()) {
      const index = messages.findIndex((message) => message.id === messageId)

      if (index !== -1) {
        const message = messages[index]!
        messages[index] = {
          ...message,
          replyCount: (this.replies.get(messageId) ?? []).length,
          version: this.sequence,
        }
        this.messages.set(channelId, messages)
        return
      }
    }

    throw new Error('Parent message was not found.')
  }

  private getChannelMessages(channelId: string) {
    const messages = this.messages.get(channelId)

    if (!messages) {
      throw new Error('Channel was not found.')
    }

    return messages
  }

  private getMessage(messageId: string) {
    for (const messages of this.messages.values()) {
      const message = messages.find((entry) => entry.id === messageId)

      if (message) {
        return message
      }
    }

    throw new Error('Message was not found.')
  }

  private getSequence(entityId: string) {
    const numeric = Number(entityId.split('-').at(-1))

    if (!Number.isInteger(numeric)) {
      throw new Error('Entity sequence is invalid.')
    }

    return numeric
  }

  private seedMessages() {
    const seed = [
      ...Array.from({ length: 24 }, (_value, index) => ({
        channelId: 'general',
        authorId: index % 2 === 0 ? 'alice' : 'ben',
        body:
          index === 0
            ? 'Morning team. Keep customer follow-ups inside support and release blockers inside releases.'
            : `General coordination update ${index + 1}. Track live status, owners, and unblockers here.`,
      })),
      {
        channelId: 'support',
        authorId: 'casey',
        body: 'We have three unread premium escalations waiting for product guidance.',
      },
      {
        channelId: 'support',
        authorId: 'alice',
        body: 'Route the billing issue to me and keep the export bug threaded so engineering can track it.',
      },
      {
        channelId: 'releases',
        authorId: 'ben',
        body: 'Release candidate is live in staging. Thread any blocker off this message.',
      },
    ]

    for (const message of seed) {
      this.createMessage({
        userId: message.authorId,
        channelId: message.channelId,
        clientId: `seed-${this.sequence}`,
        body: message.body,
        attachmentIds: [],
      })
    }

    const releaseMessage = this.getChannelMessages('releases').at(-1)

    if (!releaseMessage) {
      throw new Error('Release seed message was not created.')
    }

    this.createReply({
      userId: 'alice',
      messageId: releaseMessage.id,
      clientId: `seed-${this.sequence}`,
      body: 'Blocking issue is the search timeout report. I am validating whether it is frontend or API latency.',
    })
  }
}
