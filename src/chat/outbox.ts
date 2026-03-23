import { openDB } from 'idb'

export type PendingEnvelope =
  | {
      clientId: string
      userId: string
      kind: 'message'
      targetId: string
      body: string
      attachmentIds: string[]
      createdAt: string
    }
  | {
      clientId: string
      userId: string
      kind: 'reply'
      targetId: string
      body: string
      attachmentIds: []
      createdAt: string
    }

type DraftRecord = {
  id: string
  value: string
}

const databaseName = 'showoff-chat-client'

const getDatabase = () =>
  openDB(databaseName, 1, {
    upgrade(database) {
      database.createObjectStore('drafts', {
        keyPath: 'id',
      })
      database.createObjectStore('outbox', {
        keyPath: 'clientId',
      })
    },
  })

export const draftKey = (userId: string, scope: string) => `${userId}:${scope}`

export const getDraft = async (userId: string, scope: string) => {
  const database = await getDatabase()
  const record = await database.get('drafts', draftKey(userId, scope))
  return (record as DraftRecord | undefined)?.value ?? ''
}

export const setDraft = async (userId: string, scope: string, value: string) => {
  const database = await getDatabase()
  await database.put('drafts', {
    id: draftKey(userId, scope),
    value,
  } satisfies DraftRecord)
}

export const clearDraft = async (userId: string, scope: string) => {
  const database = await getDatabase()
  await database.delete('drafts', draftKey(userId, scope))
}

export const queuePending = async (envelope: PendingEnvelope) => {
  const database = await getDatabase()
  await database.put('outbox', envelope)
}

export const listPending = async (userId: string) => {
  const database = await getDatabase()
  const all = (await database.getAll('outbox')) as PendingEnvelope[]
  return all
    .filter((entry) => entry.userId === userId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

export const removePending = async (clientId: string) => {
  const database = await getDatabase()
  await database.delete('outbox', clientId)
}

export const isNetworkFailure = (error: unknown) =>
  error instanceof TypeError || error instanceof DOMException
