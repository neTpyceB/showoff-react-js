import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import cookieParser from 'cookie-parser'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import multer from 'multer'
import { WebSocketServer } from 'ws'
import {
  getAttachmentKind,
  sendMessageInputSchema,
  sendReplyInputSchema,
  sessionSchema,
  uploadResponseSchema,
  wsClientEventSchema,
  type TypingScope,
  type WsServerEvent,
} from '../src/chat/model.ts'
import { ChatStore } from './store.ts'

const sessionCookieName = 'showoff_chat_session'
const idleThresholdMs = 45_000
const typingExpiryMs = 4_000

const args = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]

  if (key?.startsWith('--') && value) {
    args.set(key, value)
  }
}

const host = args.get('--host') ?? '127.0.0.1'
const mode = args.get('--mode') ?? 'preview'
const port = Number(args.get('--port') ?? (mode === 'preview' ? '4173' : '3001'))

const store = new ChatStore()
const app = express()
const upload = multer({
  dest: store.getUploadsDirectory(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
})
const server = createServer(app)
const socketsByUser = new Map<string, Set<import('ws').WebSocket>>()
const typingTimeouts = new Map<string, NodeJS.Timeout>()

const sendEvent = (userId: string, event: WsServerEvent) => {
  const sockets = socketsByUser.get(userId)

  if (!sockets) {
    return
  }

  const serialized = JSON.stringify(event)

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(serialized)
    }
  }
}

const broadcastEvent = (event: WsServerEvent, exceptUserId?: string) => {
  for (const user of store.getBootstrap('alice').users) {
    if (user.id === exceptUserId) {
      continue
    }

    sendEvent(user.id, event)
  }
}

const channelUpdateForAllUsers = (channelId: string) => {
  for (const user of store.getBootstrap('alice').users) {
    sendEvent(user.id, {
      type: 'channel.updated',
      channel: store.getChannelSummary(user.id, channelId),
    })
  }
}

const requireUserId = (request: Request) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined
  const userId = store.getUserIdForSession(sessionId)

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

const onPresenceChange = (userId: string, state: import('../src/chat/model.ts').PresenceState) => {
  const presence = store.updatePresence(userId, state)
  broadcastEvent({
    type: 'presence.updated',
    userId,
    state: presence.state,
    lastActiveAt: presence.lastActiveAt,
  })
}

const touchPresence = (userId: string) => {
  const presence = store.touchPresence(userId)
  broadcastEvent({
    type: 'presence.updated',
    userId,
    state: presence.state,
    lastActiveAt: presence.lastActiveAt,
  })
}

const typingKey = (scope: TypingScope, targetId: string, userId: string) =>
  `${scope}:${targetId}:${userId}`

const stopTyping = (scope: TypingScope, targetId: string, userId: string) => {
  const key = typingKey(scope, targetId, userId)
  const timeout = typingTimeouts.get(key)

  if (timeout) {
    clearTimeout(timeout)
    typingTimeouts.delete(key)
  }

  broadcastEvent(
    {
      type: 'typing.stopped',
      scope,
      targetId,
      userId,
    },
    userId,
  )
}

const stopTypingForUser = (userId: string) => {
  for (const key of [...typingTimeouts.keys()]) {
    const [scope, targetId, typingUserId] = key.split(':')

    if (typingUserId !== userId) {
      continue
    }

    stopTyping(scope as TypingScope, targetId, userId)
  }
}

app.disable('x-powered-by')
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

app.get('/api/healthz', (_request: Request, response: Response) => {
  response.json({ ok: true })
})

app.get('/api/session', (request: Request, response: Response) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined
  const userId = store.getUserIdForSession(sessionId)
  response.json(sessionSchema.parse(store.getSessionPayload(userId)))
})

app.post('/api/session/login', (request: Request, response: Response) => {
  const userId = String(request.body?.userId ?? '')
  const sessionId = store.createSession(userId)

  response.cookie(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })
  touchPresence(userId)
  response.status(201).json(store.getSessionPayload(userId))
})

app.post('/api/session/logout', (request: Request, response: Response) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined

  if (sessionId) {
    const userId = store.getUserIdForSession(sessionId)

    if (userId) {
      onPresenceChange(userId, 'offline')
    }

    store.destroySession(sessionId)
  }

  response.clearCookie(sessionCookieName, { path: '/' })
  response.status(204).end()
})

app.use('/api', (request: Request, response: Response, next: NextFunction) => {
  if (request.path === '/session' || request.path === '/session/login' || request.path === '/healthz') {
    next()
    return
  }

  try {
    const userId = requireUserId(request)
    touchPresence(userId)
    response.locals.userId = userId
    next()
  } catch {
    response.status(401).json({ message: 'Authentication is required.' })
  }
})

app.get('/api/bootstrap', (_request: Request, response: Response) => {
  response.json(store.getBootstrap(response.locals.userId))
})

app.get('/api/channels/:channelId/messages', (request: Request, response: Response) => {
  const channelId = String(request.params.channelId)

  response.json(
    store.getMessages(response.locals.userId, channelId, request.query.cursor as string | undefined),
  )
})

app.get('/api/messages/:messageId/thread', (request: Request, response: Response) => {
  const messageId = String(request.params.messageId)

  response.json(
    store.getThreadReplies(response.locals.userId, messageId, request.query.cursor as string | undefined),
  )
})

app.post('/api/channels/:channelId/messages', (request: Request, response: Response) => {
  const channelId = String(request.params.channelId)
  const input = sendMessageInputSchema.parse(request.body)
  const message = store.createMessage({
    userId: response.locals.userId,
    channelId,
    clientId: input.clientId,
    body: input.body,
    attachmentIds: input.attachmentIds,
  })

  sendEvent(response.locals.userId, {
    type: 'message.acknowledged',
    clientId: input.clientId,
    canonicalId: message.id,
    createdAt: message.createdAt,
    version: message.version,
    scope: 'channel',
    targetId: channelId,
  })
  broadcastEvent({
    type: 'message.created',
    message: store.getMessages(response.locals.userId, channelId, undefined).items.at(-1)!,
  })
  channelUpdateForAllUsers(channelId)

  response.status(202).json({ accepted: true })
})

app.post('/api/messages/:messageId/replies', (request: Request, response: Response) => {
  const messageId = String(request.params.messageId)
  const input = sendReplyInputSchema.parse(request.body)
  const reply = store.createReply({
    userId: response.locals.userId,
    messageId,
    clientId: input.clientId,
    body: input.body,
  })

  sendEvent(response.locals.userId, {
    type: 'message.acknowledged',
    clientId: input.clientId,
    canonicalId: reply.id,
    createdAt: reply.createdAt,
    version: reply.version,
    scope: 'thread',
    targetId: messageId,
  })
  broadcastEvent({
    type: 'reply.created',
    reply,
    messageId,
    channelId: store.getChannelIdForMessage(messageId),
    replyCount: store.getThreadReplies(response.locals.userId, messageId, undefined).items.length,
  })
  response.status(202).json({ accepted: true })
})

app.post('/api/uploads', upload.single('file'), (request: Request, response: Response) => {
  if (!request.file) {
    response.status(400).json({ message: 'No upload was received.' })
    return
  }

  const attachment = store.createUpload({
    userId: response.locals.userId,
    fileName: request.file.originalname,
    mimeType: request.file.mimetype,
    size: request.file.size,
    absolutePath: request.file.path,
    kind: getAttachmentKind(request.file.mimetype),
  })

  response.status(201).json(uploadResponseSchema.parse(store.toPublicAttachment(attachment)))
})

app.get('/api/uploads/:attachmentId/content', (request: Request, response: Response) => {
  try {
    requireUserId(request)
    const attachment = store.getAttachment(String(request.params.attachmentId))
    response.type(attachment.mimeType)
    response.sendFile(attachment.absolutePath)
  } catch (error) {
    response.status(404).json({ message: error instanceof Error ? error.message : 'Attachment was not found.' })
  }
})

app.post('/api/channels/:channelId/read', (request: Request, response: Response) => {
  const channelId = String(request.params.channelId)
  const channel = store.markChannelRead(response.locals.userId, channelId)
  sendEvent(response.locals.userId, {
    type: 'read.updated',
    scope: 'channel',
    targetId: channelId,
    unreadCount: channel.unreadCount,
  })
  sendEvent(response.locals.userId, {
    type: 'channel.updated',
    channel,
  })
  response.status(204).end()
})

app.post(
  '/api/messages/:messageId/thread/read',
  (request: Request, response: Response) => {
    const messageId = String(request.params.messageId)
    const result = store.markThreadRead(response.locals.userId, messageId)
  sendEvent(response.locals.userId, {
    type: 'read.updated',
    scope: 'thread',
      targetId: messageId,
    unreadCount: result.unreadCount,
  })
    response.status(204).end()
  },
)

if (mode === 'preview') {
  const distPath = resolve(process.cwd(), 'dist')

  if (!existsSync(join(distPath, 'index.html'))) {
    throw new Error('Preview mode requires a built client. Run npm run build first.')
  }

  app.use(express.static(distPath))
  app.use((_request: Request, response: Response) => {
    response.sendFile(join(distPath, 'index.html'))
  })
}

const websocketServer = new WebSocketServer({ noServer: true })

server.on('upgrade', (request, socket, head) => {
  if (!request.url?.startsWith('/ws')) {
    socket.destroy()
    return
  }

  const rawCookie = request.headers.cookie ?? ''
  const sessionCookie = rawCookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1)
  const userId = store.getUserIdForSession(sessionCookie)

  if (!userId) {
    socket.destroy()
    return
  }

  websocketServer.handleUpgrade(request, socket, head, (websocket) => {
    websocketServer.emit('connection', websocket, userId)
  })
})

websocketServer.on('connection', (websocket, userId: string) => {
  const sockets = socketsByUser.get(userId) ?? new Set()
  sockets.add(websocket)
  socketsByUser.set(userId, sockets)
  touchPresence(userId)

  websocket.on('close', () => {
    const userSockets = socketsByUser.get(userId)

    if (!userSockets) {
      return
    }

    userSockets.delete(websocket)

    if (userSockets.size === 0) {
      stopTypingForUser(userId)
      socketsByUser.delete(userId)
      onPresenceChange(userId, 'offline')
    }
  })

  websocket.on('message', (buffer) => {
    const parsed = wsClientEventSchema.parse(JSON.parse(String(buffer)))
    touchPresence(userId)

    if (parsed.type === 'heartbeat') {
      return
    }

    if (parsed.type === 'typing.stop') {
      stopTyping(parsed.scope, parsed.targetId, userId)
      return
    }

    const key = typingKey(parsed.scope, parsed.targetId, userId)
    const existing = typingTimeouts.get(key)

    if (existing) {
      clearTimeout(existing)
    }

    broadcastEvent(
      {
        type: 'typing.started',
        scope: parsed.scope,
        targetId: parsed.targetId,
        userId,
      },
      userId,
    )

    typingTimeouts.set(
      key,
      setTimeout(() => {
        stopTyping(parsed.scope, parsed.targetId, userId)
      }, typingExpiryMs),
    )
  })
})

setInterval(() => {
  for (const presence of store.getIdleUsers(idleThresholdMs)) {
    onPresenceChange(presence.userId, 'idle')
  }
}, 5_000)

server.listen(port, host, () => {
  console.log(`chat server listening on http://${host}:${port}`)
})
