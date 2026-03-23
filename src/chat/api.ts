import {
  bootstrapSchema,
  messageSchema,
  pageSchema,
  replySchema,
  sendMessageInputSchema,
  sendReplyInputSchema,
  sessionSchema,
  uploadResponseSchema,
  type Attachment,
  type BootstrapPayload,
  type ChatMessage,
  type SendMessageInput,
  type SendReplyInput,
  type SessionPayload,
  type ThreadReply,
  type User,
} from './model.ts'

const messagePageSchema = pageSchema(messageSchema)
const replyPageSchema = pageSchema(replySchema)

const readErrorMessage = async (response: Response) => {
  try {
    const parsed = (await response.json()) as { message?: string }
    return parsed.message ?? 'Request failed.'
  } catch {
    return response.statusText || 'Request failed.'
  }
}

const requestJson = async <T>(
  input: string,
  init: RequestInit,
  parser: {
    parse: (value: unknown) => T
  },
) => {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return parser.parse(await response.json())
}

const requestNoContent = async (input: string, init: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
}

export const chatApi = {
  getSession() {
    return requestJson('/api/session', { method: 'GET' }, sessionSchema)
  },

  login(userId: string) {
    return requestJson(
      '/api/session/login',
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      },
      sessionSchema,
    )
  },

  logout() {
    return requestNoContent('/api/session/logout', {
      method: 'POST',
    })
  },

  getBootstrap() {
    return requestJson('/api/bootstrap', { method: 'GET' }, bootstrapSchema)
  },

  getChannelMessages(channelId: string, cursor: string | null) {
    const search = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return requestJson(`/api/channels/${channelId}/messages${search}`, { method: 'GET' }, messagePageSchema)
  },

  getThreadReplies(messageId: string, cursor: string | null) {
    const search = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return requestJson(`/api/messages/${messageId}/thread${search}`, { method: 'GET' }, replyPageSchema)
  },

  async sendMessage(channelId: string, input: SendMessageInput) {
    sendMessageInputSchema.parse(input)
    const response = await fetch(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }
  },

  async sendReply(messageId: string, input: SendReplyInput) {
    sendReplyInputSchema.parse(input)
    const response = await fetch(`/api/messages/${messageId}/replies`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }
  },

  markChannelRead(channelId: string) {
    return requestNoContent(`/api/channels/${channelId}/read`, {
      method: 'POST',
    })
  },

  markThreadRead(messageId: string) {
    return requestNoContent(`/api/messages/${messageId}/thread/read`, {
      method: 'POST',
    })
  },

  async uploadAttachment(file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.set('file', file)
    const response = await fetch('/api/uploads', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }

    return uploadResponseSchema.parse(await response.json())
  },
}

export type ChannelMessagesResponse = Awaited<
  ReturnType<typeof chatApi.getChannelMessages>
>

export type ThreadRepliesResponse = Awaited<
  ReturnType<typeof chatApi.getThreadReplies>
>

export type SessionUser = SessionPayload['user']
export type BootstrapData = BootstrapPayload
export type ChatUser = User
export type ChatAttachment = Attachment
export type ChatMessageRecord = ChatMessage
export type ChatReplyRecord = ThreadReply
