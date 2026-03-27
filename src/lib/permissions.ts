import type { Membership, PlatformRole } from './platform-types'

export type ModuleKey =
  | 'feed'
  | 'dashboards'
  | 'search'
  | 'notifications'
  | 'collaboration'
  | 'jobs'
  | 'observability'
  | 'experiments'

const moduleRoles: Record<ModuleKey, PlatformRole[]> = {
  feed: ['owner', 'admin', 'product_manager', 'engineer', 'analyst', 'viewer'],
  dashboards: ['owner', 'admin', 'product_manager', 'engineer', 'analyst', 'viewer'],
  search: ['owner', 'admin', 'product_manager', 'engineer', 'analyst', 'viewer'],
  notifications: ['owner', 'admin', 'product_manager', 'engineer', 'analyst', 'viewer'],
  collaboration: ['owner', 'admin', 'product_manager', 'engineer', 'analyst', 'viewer'],
  jobs: ['owner', 'admin', 'engineer'],
  observability: ['owner', 'admin', 'engineer', 'analyst'],
  experiments: ['owner', 'admin', 'product_manager', 'analyst'],
}

export const canAccessModule = (role: PlatformRole, moduleKey: ModuleKey) =>
  moduleRoles[moduleKey].includes(role)

export const getVisibleModules = (membership: Membership) =>
  (Object.keys(moduleRoles) as ModuleKey[]).filter((moduleKey) => canAccessModule(membership.role, moduleKey))
