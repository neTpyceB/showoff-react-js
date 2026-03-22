import { z } from 'zod'

export const boardStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const
export type BoardStatus = (typeof boardStatuses)[number]

export const roleValues = ['admin', 'editor', 'viewer'] as const
export type TeamRole = (typeof roleValues)[number]

export const priorityValues = ['low', 'medium', 'high'] as const
export type TaskPriority = (typeof priorityValues)[number]

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  email: z.email(),
})

export type User = z.infer<typeof userSchema>

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  description: z.string().max(220),
  assigneeId: z.string().min(1),
  priority: z.enum(priorityValues),
  status: z.enum(boardStatuses),
  updatedAt: z.iso.datetime(),
})

export type Task = z.infer<typeof taskSchema>

export const memberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(roleValues),
})

export type Member = z.infer<typeof memberSchema>

export const spaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  members: z.array(memberSchema),
  tasks: z.array(taskSchema),
})

export type Space = z.infer<typeof spaceSchema>

export const kanbanDatabaseSchema = z.object({
  users: z.array(userSchema),
  spaces: z.array(spaceSchema),
})

export type KanbanDatabase = z.infer<typeof kanbanDatabaseSchema>

export const sessionSchema = z.object({
  userId: z.string().min(1),
})

export type Session = z.infer<typeof sessionSchema>

export const loginUsers: User[] = [
  {
    id: 'alice',
    name: 'Alice Johnson',
    title: 'Product Lead',
    email: 'alice@showoff.dev',
  },
  {
    id: 'ben',
    name: 'Ben Carter',
    title: 'Engineering Manager',
    email: 'ben@showoff.dev',
  },
  {
    id: 'casey',
    name: 'Casey Diaz',
    title: 'Stakeholder Viewer',
    email: 'casey@showoff.dev',
  },
]

export const databaseStorageKey = 'showoff.kanban.database.v1'
export const sessionStorageKey = 'showoff.kanban.session.v1'

export const createSeedDatabase = (): KanbanDatabase => ({
  users: loginUsers,
  spaces: [
    {
      id: 'platform',
      name: 'Platform Rebuild',
      description: 'Core product board for the current quarter migration.',
      members: [
        { userId: 'alice', role: 'admin' },
        { userId: 'ben', role: 'editor' },
        { userId: 'casey', role: 'viewer' },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Audit edge auth paths',
          description: 'Verify route protection, redirects, and token expiry handling.',
          assigneeId: 'ben',
          priority: 'high',
          status: 'backlog',
          updatedAt: '2026-03-21T08:00:00.000Z',
        },
        {
          id: 'task-2',
          title: 'Finalize onboarding copy',
          description: 'Polish handoff content for the new workspace launch.',
          assigneeId: 'alice',
          priority: 'medium',
          status: 'todo',
          updatedAt: '2026-03-21T09:30:00.000Z',
        },
        {
          id: 'task-3',
          title: 'Replace brittle cache keying',
          description: 'Align task and space cache keys with the API contract.',
          assigneeId: 'ben',
          priority: 'high',
          status: 'in-progress',
          updatedAt: '2026-03-21T11:00:00.000Z',
        },
        {
          id: 'task-4',
          title: 'Publish release checklist',
          description: 'Share the production readiness checklist with stakeholders.',
          assigneeId: 'alice',
          priority: 'low',
          status: 'done',
          updatedAt: '2026-03-20T15:15:00.000Z',
        },
      ],
    },
    {
      id: 'growth',
      name: 'Growth Ops',
      description: 'Delivery board for funnel experiments and CRM work.',
      members: [
        { userId: 'alice', role: 'editor' },
        { userId: 'ben', role: 'admin' },
        { userId: 'casey', role: 'viewer' },
      ],
      tasks: [
        {
          id: 'task-5',
          title: 'Map lifecycle campaign states',
          description: 'Document trigger ownership and message sequencing.',
          assigneeId: 'alice',
          priority: 'medium',
          status: 'todo',
          updatedAt: '2026-03-20T10:10:00.000Z',
        },
        {
          id: 'task-6',
          title: 'Check experiment reporting',
          description: 'Validate metric rollups in the shared dashboard.',
          assigneeId: 'casey',
          priority: 'low',
          status: 'done',
          updatedAt: '2026-03-19T16:45:00.000Z',
        },
      ],
    },
  ],
})
