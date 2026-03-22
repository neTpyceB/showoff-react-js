import { canManageTasks } from './permissions.ts'
import {
  createSeedDatabase,
  databaseStorageKey,
  kanbanDatabaseSchema,
  sessionSchema,
  sessionStorageKey,
  type BoardStatus,
  type Session,
  type Space,
  type TeamRole,
  type User,
} from './model.ts'
import { moveTaskCollection } from './board.ts'

const withLatency = async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 140))
}

const readDatabase = () => {
  const rawValue = window.localStorage.getItem(databaseStorageKey)

  if (!rawValue) {
    const seed = createSeedDatabase()
    window.localStorage.setItem(databaseStorageKey, JSON.stringify(seed))
    return seed
  }

  const parsed = kanbanDatabaseSchema.safeParse(JSON.parse(rawValue))

  if (!parsed.success) {
    throw new Error('Stored Kanban database is invalid.')
  }

  return parsed.data
}

const writeDatabase = (database: ReturnType<typeof readDatabase>) => {
  window.localStorage.setItem(databaseStorageKey, JSON.stringify(database))
}

const readSession = (): Session | null => {
  const rawValue = window.localStorage.getItem(sessionStorageKey)

  if (!rawValue) {
    return null
  }

  const parsed = sessionSchema.safeParse(JSON.parse(rawValue))

  if (!parsed.success) {
    throw new Error('Stored session is invalid.')
  }

  return parsed.data
}

const writeSession = (session: Session | null) => {
  if (!session) {
    window.localStorage.removeItem(sessionStorageKey)
    return
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
}

const requireSpaceAccess = (space: Space, userId: string) => {
  const membership = space.members.find((member) => member.userId === userId)

  if (!membership) {
    throw new Error('You do not have access to this team space.')
  }

  return membership.role
}

export type SpaceSummary = {
  id: string
  name: string
  description: string
  role: TeamRole
  taskCount: number
}

export type BoardData = {
  space: SpaceSummary
  role: TeamRole
  users: User[]
  tasks: Space['tasks']
}

export const kanbanApi = {
  async listUsers() {
    await withLatency()
    return readDatabase().users
  },

  async getSession() {
    await withLatency()
    const session = readSession()

    if (!session) {
      return null
    }

    const database = readDatabase()
    const user = database.users.find((entry) => entry.id === session.userId)

    if (!user) {
      throw new Error('The active session references an unknown user.')
    }

    return user
  },

  async login(userId: string) {
    await withLatency()
    const database = readDatabase()
    const user = database.users.find((entry) => entry.id === userId)

    if (!user) {
      throw new Error('The requested user was not found.')
    }

    writeSession({ userId })
    return user
  },

  async logout() {
    await withLatency()
    writeSession(null)
  },

  async getSpaces(userId: string) {
    await withLatency()
    const database = readDatabase()

    return database.spaces
      .map((space) => {
        const membership = space.members.find((member) => member.userId === userId)

        if (!membership) {
          return null
        }

        return {
          id: space.id,
          name: space.name,
          description: space.description,
          role: membership.role,
          taskCount: space.tasks.length,
        }
      })
      .filter(Boolean) as SpaceSummary[]
  },

  async getBoard(spaceId: string, userId: string): Promise<BoardData> {
    await withLatency()
    const database = readDatabase()
    const space = database.spaces.find((entry) => entry.id === spaceId)

    if (!space) {
      throw new Error('The requested team space was not found.')
    }

    const role = requireSpaceAccess(space, userId)
    const allowedUsers = database.users.filter((user) =>
      space.members.some((member) => member.userId === user.id),
    )

    return {
      space: {
        id: space.id,
        name: space.name,
        description: space.description,
        role,
        taskCount: space.tasks.length,
      },
      role,
      users: allowedUsers,
      tasks: space.tasks,
    }
  },

  async createTask(
    spaceId: string,
    userId: string,
    input: {
      title: string
      description: string
      assigneeId: string
      priority: 'low' | 'medium' | 'high'
      status: BoardStatus
    },
  ) {
    await withLatency()
    const database = readDatabase()
    const space = database.spaces.find((entry) => entry.id === spaceId)

    if (!space) {
      throw new Error('The requested team space was not found.')
    }

    const role = requireSpaceAccess(space, userId)

    if (!canManageTasks(role)) {
      throw new Error('Your role does not allow creating tasks in this space.')
    }

    const assigneeExists = space.members.some((member) => member.userId === input.assigneeId)

    if (!assigneeExists) {
      throw new Error('The selected assignee is not part of this team space.')
    }

    const nextTaskId =
      Math.max(
        0,
        ...database.spaces.flatMap((entry) =>
          entry.tasks.map((task) => Number(task.id.replace('task-', '')) || 0),
        ),
      ) + 1

    const nextTask = {
      id: `task-${nextTaskId}`,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      priority: input.priority,
      status: input.status,
      updatedAt: '2026-03-22T09:30:00.000Z',
    }

    space.tasks = [...space.tasks, nextTask]
    writeDatabase(database)
    return nextTask
  },

  async moveTask(
    spaceId: string,
    userId: string,
    input: {
      taskId: string
      targetStatus: BoardStatus
      targetIndex: number
    },
  ) {
    await withLatency()
    const database = readDatabase()
    const space = database.spaces.find((entry) => entry.id === spaceId)

    if (!space) {
      throw new Error('The requested team space was not found.')
    }

    const role = requireSpaceAccess(space, userId)

    if (!canManageTasks(role)) {
      throw new Error('Your role does not allow moving tasks in this space.')
    }

    space.tasks = moveTaskCollection(
      space.tasks,
      input.taskId,
      input.targetStatus,
      input.targetIndex,
    )
    writeDatabase(database)
    return space.tasks
  },
}
