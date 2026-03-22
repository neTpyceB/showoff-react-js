import type { TeamRole } from './model.ts'

export const canManageTasks = (role: TeamRole) =>
  role === 'admin' || role === 'editor'

export const isViewer = (role: TeamRole) => role === 'viewer'
