import { z } from 'zod'

export const presenceStates = ['online', 'idle', 'offline'] as const
export type PresenceState = (typeof presenceStates)[number]

export const attachmentKinds = ['image', 'document'] as const
export type AttachmentKind = (typeof attachmentKinds)[number]

export const typingScopes = ['channel', 'thread'] as const
export type TypingScope = (typeof typingScopes)[number]

export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
})

export type Workspace = z.infer<typeof workspaceSchema>

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  email: z.email(),
  avatarLabel: z.string().length(2),
})

export type User = z.infer<typeof userSchema>

export const presenceSchema = z.object({
  userId: z.string().min(1),
  state: z.enum(presenceStates),
  lastActiveAt: z.iso.datetime(),
})

export type PresenceRecord = z.infer<typeof presenceSchema>

export const attachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  kind: z.enum(attachmentKinds),
  url: z.string().min(1),
})

export type Attachment = z.infer<typeof attachmentSchema>

export const channelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  topic: z.string().min(1),
  unreadCount: z.number().int().nonnegative(),
  lastMessageAt: z.iso.datetime().nullable(),
  lastMessagePreview: z.string().nullable(),
})

export type Channel = z.infer<typeof channelSchema>

export const messageSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  channelId: z.string().min(1),
  authorId: z.string().min(1),
  body: z.string().min(1),
  attachments: z.array(attachmentSchema),
  createdAt: z.iso.datetime(),
  version: z.number().int().positive(),
  replyCount: z.number().int().nonnegative(),
  threadUnreadCount: z.number().int().nonnegative(),
})

export type ChatMessage = z.infer<typeof messageSchema>

export const replySchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  messageId: z.string().min(1),
  authorId: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.iso.datetime(),
  version: z.number().int().positive(),
})

export type ThreadReply = z.infer<typeof replySchema>

export const pageSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  })

export const bootstrapSchema = z.object({
  workspace: workspaceSchema,
  currentUser: userSchema,
  users: z.array(userSchema),
  presence: z.array(presenceSchema),
  channels: z.array(channelSchema),
  defaultChannelId: z.string().min(1),
})

export type BootstrapPayload = z.infer<typeof bootstrapSchema>

export const sessionSchema = z.object({
  user: userSchema.nullable(),
})

export type SessionPayload = z.infer<typeof sessionSchema>

export const sendMessageInputSchema = z.object({
  clientId: z.string().min(1),
  body: z.string().trim().min(1).max(2_000),
  attachmentIds: z.array(z.string().min(1)).max(4),
})

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>

export const uploadResponseSchema = attachmentSchema

export const sendReplyInputSchema = z.object({
  clientId: z.string().min(1),
  body: z.string().trim().min(1).max(2_000),
})

export type SendReplyInput = z.infer<typeof sendReplyInputSchema>

export const wsClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heartbeat'),
  }),
  z.object({
    type: z.literal('typing.start'),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
  }),
  z.object({
    type: z.literal('typing.stop'),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
  }),
])

export type WsClientEvent = z.infer<typeof wsClientEventSchema>

export const wsServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('presence.updated'),
    userId: z.string().min(1),
    state: z.enum(presenceStates),
    lastActiveAt: z.iso.datetime(),
  }),
  z.object({
    type: z.literal('typing.started'),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
    userId: z.string().min(1),
  }),
  z.object({
    type: z.literal('typing.stopped'),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
    userId: z.string().min(1),
  }),
  z.object({
    type: z.literal('message.created'),
    message: messageSchema,
  }),
  z.object({
    type: z.literal('reply.created'),
    reply: replySchema,
    messageId: z.string().min(1),
    channelId: z.string().min(1),
    replyCount: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('message.acknowledged'),
    clientId: z.string().min(1),
    canonicalId: z.string().min(1),
    createdAt: z.iso.datetime(),
    version: z.number().int().positive(),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
  }),
  z.object({
    type: z.literal('read.updated'),
    scope: z.enum(typingScopes),
    targetId: z.string().min(1),
    unreadCount: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('channel.updated'),
    channel: channelSchema,
  }),
])

export type WsServerEvent = z.infer<typeof wsServerEventSchema>

export const allowedUploadTypes = new Map<string, AttachmentKind>([
  ['image/png', 'image'],
  ['image/jpeg', 'image'],
  ['image/webp', 'image'],
  ['image/gif', 'image'],
  ['application/pdf', 'document'],
  ['text/plain', 'document'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'document',
  ],
])

export const getAttachmentKind = (mimeType: string) => {
  const kind = allowedUploadTypes.get(mimeType)

  if (!kind) {
    throw new Error('Unsupported file type.')
  }

  return kind
}

export const pageSize = 18

export const buildCursor = (sequence: number) => String(sequence)
export const parseCursor = (cursor: string | undefined) => {
  if (!cursor) {
    return null
  }

  const numeric = Number(cursor)

  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error('Invalid pagination cursor.')
  }

  return numeric
}

export const attachmentRoute = (id: string) => `/api/uploads/${id}/content`
