import type { BillingPlan, ModuleDescriptor, ModuleId, Organization, Role } from './model.ts'
import { planEntitlements } from './model.ts'

const roleRank: Record<Role, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4,
}

export const moduleRegistry: ModuleDescriptor[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Tenant health, usage, and operational posture.',
    path: '/overview',
    requiredRoles: ['viewer', 'member', 'manager', 'admin', 'owner'],
    requiredEntitlements: ['core-admin'],
    requiredFlags: [],
  },
  {
    id: 'members',
    label: 'Members',
    description: 'Role assignments and org membership controls.',
    path: '/members',
    requiredRoles: ['manager', 'admin', 'owner'],
    requiredEntitlements: ['role-management'],
    requiredFlags: [],
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Plan status, seat limits, and entitlement posture.',
    path: '/billing',
    requiredRoles: ['admin', 'owner'],
    requiredEntitlements: ['billing-controls'],
    requiredFlags: [],
  },
  {
    id: 'flags',
    label: 'Feature Flags',
    description: 'Per-organization rollout control for internal capabilities.',
    path: '/flags',
    requiredRoles: ['admin', 'owner'],
    requiredEntitlements: ['billing-controls'],
    requiredFlags: ['advancedRoles'],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    description: 'Immutable records for configuration and access changes.',
    path: '/audit',
    requiredRoles: ['admin', 'owner'],
    requiredEntitlements: ['audit-log'],
    requiredFlags: ['auditStreaming'],
  },
  {
    id: 'plugins',
    label: 'Plugins',
    description: 'Internal module activation managed per tenant.',
    path: '/plugins',
    requiredRoles: ['admin', 'owner'],
    requiredEntitlements: ['plugin-registry'],
    requiredFlags: ['pluginCenter'],
  },
]

const hasRole = (currentRole: Role, allowedRoles: Role[]) =>
  allowedRoles.some((role) => roleRank[currentRole] >= roleRank[role])

export const hasEntitlement = (plan: BillingPlan, entitlement: string) =>
  planEntitlements[plan].includes(entitlement)

export const canAccessModule = (
  role: Role,
  organization: Pick<Organization, 'plan' | 'featureFlags'>,
  module: Pick<ModuleDescriptor, 'requiredRoles' | 'requiredEntitlements' | 'requiredFlags'>,
) =>
  hasRole(role, module.requiredRoles) &&
  module.requiredEntitlements.every((entitlement) => hasEntitlement(organization.plan, entitlement)) &&
  module.requiredFlags.every((flag) => organization.featureFlags[flag])

export const getAuthorizedModules = (
  role: Role,
  organization: Pick<Organization, 'id' | 'plan' | 'featureFlags'>,
) =>
  moduleRegistry.filter((module) => canAccessModule(role, organization, module))

export const getModulePath = (orgId: string, moduleId: ModuleId) => {
  const module = moduleRegistry.find((entry) => entry.id === moduleId)

  if (!module) {
    throw new Error(`Unknown module: ${moduleId}`)
  }

  return `/orgs/${orgId}${module.path}`
}

export const getDefaultModulePath = (
  role: Role,
  organization: Pick<Organization, 'id' | 'plan' | 'featureFlags'>,
) => {
  const firstModule = getAuthorizedModules(role, organization)[0]

  return firstModule ? getModulePath(organization.id, firstModule.id) : `/orgs/${organization.id}`
}
