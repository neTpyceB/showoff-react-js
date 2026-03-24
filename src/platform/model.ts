import { z } from 'zod'

export const roleSchema = z.enum(['owner', 'admin', 'manager', 'member', 'viewer'])
export type Role = z.infer<typeof roleSchema>

export const planSchema = z.enum(['starter', 'growth', 'enterprise'])
export type BillingPlan = z.infer<typeof planSchema>

export const billingStatusSchema = z.enum(['active', 'trialing', 'past_due'])
export type BillingStatus = z.infer<typeof billingStatusSchema>

export const featureFlagKeySchema = z.enum([
  'advancedRoles',
  'auditStreaming',
  'pluginCenter',
  'automationRules',
])
export type FeatureFlagKey = z.infer<typeof featureFlagKeySchema>

export const moduleIdSchema = z.enum(['overview', 'members', 'billing', 'flags', 'audit', 'plugins'])
export type ModuleId = z.infer<typeof moduleIdSchema>

export const featureFlagsSchema = z.record(featureFlagKeySchema, z.boolean())
export type FeatureFlags = z.infer<typeof featureFlagsSchema>

export const membershipSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  role: roleSchema,
})
export type Membership = z.infer<typeof membershipSchema>

export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  currentOrgId: z.string(),
  memberships: z.array(membershipSchema),
})
export type SessionUser = z.infer<typeof sessionSchema>

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: planSchema,
  billingStatus: billingStatusSchema,
  seatLimit: z.number().int().min(1),
  usedSeats: z.number().int().min(0),
  monthlySpendCents: z.number().int().min(0),
  renewalAt: z.string(),
  featureFlags: featureFlagsSchema,
})
export type Organization = z.infer<typeof organizationSchema>

export const moduleDescriptorSchema = z.object({
  id: moduleIdSchema,
  label: z.string(),
  description: z.string(),
  path: z.string(),
  requiredRoles: z.array(roleSchema),
  requiredEntitlements: z.array(z.string()),
  requiredFlags: z.array(featureFlagKeySchema),
})
export type ModuleDescriptor = z.infer<typeof moduleDescriptorSchema>

export const overviewSchema = z.object({
  orgId: z.string(),
  activeUsers: z.number().int().min(0),
  automationRuns: z.number().int().min(0),
  apiRequests: z.number().int().min(0),
  openIncidents: z.number().int().min(0),
  storageUsedGb: z.number().min(0),
})
export type OrgOverview = z.infer<typeof overviewSchema>

export const memberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  lastActiveAt: z.string(),
})
export type OrganizationMember = z.infer<typeof memberSchema>

export const billingSchema = z.object({
  orgId: z.string(),
  plan: planSchema,
  billingStatus: billingStatusSchema,
  seatLimit: z.number().int().min(1),
  usedSeats: z.number().int().min(0),
  monthlySpendCents: z.number().int().min(0),
  renewalAt: z.string(),
  entitlements: z.array(z.string()),
})
export type BillingState = z.infer<typeof billingSchema>

export const featureFlagSchema = z.object({
  key: featureFlagKeySchema,
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
})
export type FeatureFlagRecord = z.infer<typeof featureFlagSchema>

export const auditEntrySchema = z.object({
  id: z.string(),
  orgId: z.string(),
  actorName: z.string(),
  action: z.string(),
  target: z.string(),
  createdAt: z.string(),
  detail: z.string(),
})
export type AuditEntry = z.infer<typeof auditEntrySchema>

export const pluginSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  status: z.enum(['stable', 'beta']),
  enabled: z.boolean(),
})
export type PluginModule = z.infer<typeof pluginSchema>

export const bootstrapSchema = z.object({
  loginOptions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      summary: z.string(),
    }),
  ),
  organizations: z.array(organizationSchema),
  currentOrganization: organizationSchema.nullable(),
  session: sessionSchema.nullable(),
  modules: z.array(moduleDescriptorSchema),
})
export type PlatformBootstrap = z.infer<typeof bootstrapSchema>

export const loginRequestSchema = z.object({
  userId: z.string(),
})

export const switchOrganizationSchema = z.object({
  orgId: z.string(),
})

export const updateMemberRoleSchema = z.object({
  role: roleSchema,
})

export const updateBillingPlanSchema = z.object({
  plan: planSchema,
})

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
})

export const updatePluginSchema = z.object({
  enabled: z.boolean(),
})

export const planEntitlements: Record<BillingPlan, string[]> = {
  starter: ['core-admin', 'role-management'],
  growth: ['core-admin', 'role-management', 'billing-controls', 'audit-log'],
  enterprise: ['core-admin', 'role-management', 'billing-controls', 'audit-log', 'plugin-registry'],
}

export const featureFlagCatalog: Array<Pick<FeatureFlagRecord, 'key' | 'label' | 'description'>> = [
  {
    key: 'advancedRoles',
    label: 'Advanced roles',
    description: 'Unlock manager-grade role workflows and finer module gating.',
  },
  {
    key: 'auditStreaming',
    label: 'Audit streaming',
    description: 'Expose immutable org audit history and export-ready event feeds.',
  },
  {
    key: 'pluginCenter',
    label: 'Plugin center',
    description: 'Allow internal plugin-like modules to be enabled per organization.',
  },
  {
    key: 'automationRules',
    label: 'Automation rules',
    description: 'Reserve automation control surfaces for enterprise organizations.',
  },
]

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
}

export const formatMoney = (valueCents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valueCents / 100)
