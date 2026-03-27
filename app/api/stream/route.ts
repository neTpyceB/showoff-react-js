import { getSessionCookieValue } from '../../../src/server/auth'
import { platformStore, scopeKey } from '../../../src/server/platform-store'

const encoder = new TextEncoder()

const writeEvent = (type: string, payload: unknown) =>
  encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`)

export async function GET(request: Request) {
  const session = platformStore.getSession(await getSessionCookieValue())
  if (!session) {
    return new Response('Authentication required.', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const streamScopeKey = searchParams.get('scopeKey') ?? scopeKey(session.currentContext)
  platformStore.updatePresence(session.id, session.currentContext, true)

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(writeEvent('presence', { activeUsers: platformStore.getPresence(session.currentContext) }))
      const unsubscribe = platformStore.subscribe((event) => {
        if ('scopeKey' in event.payload && event.payload.scopeKey !== streamScopeKey) {
          return
        }
        controller.enqueue(writeEvent(event.type, event.payload))
      })

      request.signal.addEventListener('abort', () => {
        unsubscribe()
        platformStore.updatePresence(session.id, session.currentContext, false)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
