import type {
  AuditEntry,
  BillingState,
  FeatureFlagRecord,
  OrgOverview,
  Organization,
  OrganizationMember,
  PlatformBootstrap,
  PluginModule,
  SessionUser,
} from './model.ts'

export type SeoMeta = {
  title: string
  description: string
  canonicalPath: string
}

export type AppState = {
  session: SessionUser | null
  bootstrap: PlatformBootstrap
  overview: OrgOverview | null
  members: OrganizationMember[]
  billing: BillingState | null
  featureFlags: FeatureFlagRecord[]
  auditEntries: AuditEntry[]
  plugins: PluginModule[]
  routeError: { status: 403; message: string } | null
  seo: SeoMeta
}

export const emptyOrganization = (): Organization => ({
  id: '',
  name: '',
  slug: '',
  plan: 'starter',
  billingStatus: 'trialing',
  seatLimit: 1,
  usedSeats: 0,
  monthlySpendCents: 0,
  renewalAt: new Date().toISOString(),
  featureFlags: {
    advancedRoles: false,
    auditStreaming: false,
    pluginCenter: false,
    automationRules: false,
  },
})

export const createEmptyAppState = (): AppState => ({
  session: null,
  bootstrap: {
    loginOptions: [],
    organizations: [],
    currentOrganization: null,
    session: null,
    modules: [],
  },
  overview: null,
  members: [],
  billing: null,
  featureFlags: [],
  auditEntries: [],
  plugins: [],
  routeError: null,
  seo: {
    title: 'Northstar Admin',
    description: 'Multi-tenant SaaS admin system with organizations, billing, feature flags, and audit logs.',
    canonicalPath: '/',
  },
})
