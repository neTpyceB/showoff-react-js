import { getAuthorizedModules } from '../src/platform/access.ts'
import {
  featureFlagCatalog,
  planEntitlements,
  roleLabels,
  type AuditEntry,
  type BillingPlan,
  type BillingState,
  type FeatureFlagKey,
  type FeatureFlagRecord,
  type Membership,
  type OrgOverview,
  type Organization,
  type OrganizationMember,
  type PlatformBootstrap,
  type PluginModule,
  type Role,
  type SessionUser,
} from '../src/platform/model.ts'

type UserRecord = {
  id: string
  name: string
  email: string
  summary: string
}

type SessionRecord = {
  sessionId: string
  userId: string
  currentOrgId: string
}

type OrganizationRecord = {
  organization: Organization
  overview: OrgOverview
  members: OrganizationMember[]
  plugins: PluginModule[]
  auditEntries: AuditEntry[]
}

const nowIso = () => new Date().toISOString()

const users: UserRecord[] = [
  {
    id: 'user-olivia',
    name: 'Olivia Hart',
    email: 'olivia@northstar.test',
    summary: 'Global owner across Acme Cloud and Northstar OS.',
  },
  {
    id: 'user-ben',
    name: 'Ben Carter',
    email: 'ben@northstar.test',
    summary: 'Admin for Acme Cloud with billing and flag ownership.',
  },
  {
    id: 'user-mia',
    name: 'Mia Chen',
    email: 'mia@northstar.test',
    summary: 'Manager on Northstar OS with member administration rights.',
  },
  {
    id: 'user-noah',
    name: 'Noah Park',
    email: 'noah@northstar.test',
    summary: 'Viewer on Acme Cloud for read-only access testing.',
  },
  {
    id: 'user-zoe',
    name: 'Zoe Lin',
    email: 'zoe@northstar.test',
    summary: 'Member on Northstar OS for multi-user tenant coverage.',
  },
]

const organizations = new Map<string, OrganizationRecord>([
  [
    'org-acme',
    {
      organization: {
        id: 'org-acme',
        name: 'Acme Cloud',
        slug: 'acme-cloud',
        plan: 'growth',
        billingStatus: 'active',
        seatLimit: 20,
        usedSeats: 4,
        monthlySpendCents: 240_000,
        renewalAt: '2026-04-15T08:00:00.000Z',
        featureFlags: {
          advancedRoles: true,
          auditStreaming: true,
          pluginCenter: false,
          automationRules: false,
        },
      },
      overview: {
        orgId: 'org-acme',
        activeUsers: 18,
        automationRuns: 142,
        apiRequests: 904_320,
        openIncidents: 1,
        storageUsedGb: 284,
      },
      members: [
        {
          userId: 'user-olivia',
          name: 'Olivia Hart',
          email: 'olivia@northstar.test',
          role: 'owner',
          lastActiveAt: '2026-03-24T08:40:00.000Z',
        },
        {
          userId: 'user-ben',
          name: 'Ben Carter',
          email: 'ben@northstar.test',
          role: 'admin',
          lastActiveAt: '2026-03-24T08:32:00.000Z',
        },
        {
          userId: 'user-noah',
          name: 'Noah Park',
          email: 'noah@northstar.test',
          role: 'viewer',
          lastActiveAt: '2026-03-23T17:12:00.000Z',
        },
        {
          userId: 'user-zoe',
          name: 'Zoe Lin',
          email: 'zoe@northstar.test',
          role: 'member',
          lastActiveAt: '2026-03-23T11:25:00.000Z',
        },
      ],
      plugins: [
        {
          id: 'plugin-runbooks',
          name: 'Runbook Center',
          description: 'Operational playbooks surfaced beside tenant configuration.',
          version: '1.4.2',
          status: 'stable',
          enabled: true,
        },
        {
          id: 'plugin-insights',
          name: 'Workload Insights',
          description: 'Internal analytics module for burst traffic and tenant usage mix.',
          version: '0.9.0',
          status: 'beta',
          enabled: false,
        },
      ],
      auditEntries: [
        {
          id: 'audit-acme-1',
          orgId: 'org-acme',
          actorName: 'Ben Carter',
          action: 'flag.updated',
          target: 'advancedRoles',
          createdAt: '2026-03-24T07:12:00.000Z',
          detail: 'Enabled advanced roles for Acme Cloud.',
        },
        {
          id: 'audit-acme-2',
          orgId: 'org-acme',
          actorName: 'Olivia Hart',
          action: 'billing.plan_changed',
          target: 'growth',
          createdAt: '2026-03-20T13:04:00.000Z',
          detail: 'Moved Acme Cloud from starter to growth.',
        },
      ],
    },
  ],
  [
    'org-northstar',
    {
      organization: {
        id: 'org-northstar',
        name: 'Northstar OS',
        slug: 'northstar-os',
        plan: 'enterprise',
        billingStatus: 'trialing',
        seatLimit: 60,
        usedSeats: 3,
        monthlySpendCents: 480_000,
        renewalAt: '2026-04-02T08:00:00.000Z',
        featureFlags: {
          advancedRoles: true,
          auditStreaming: true,
          pluginCenter: true,
          automationRules: true,
        },
      },
      overview: {
        orgId: 'org-northstar',
        activeUsers: 41,
        automationRuns: 844,
        apiRequests: 3_824_110,
        openIncidents: 0,
        storageUsedGb: 812,
      },
      members: [
        {
          userId: 'user-olivia',
          name: 'Olivia Hart',
          email: 'olivia@northstar.test',
          role: 'owner',
          lastActiveAt: '2026-03-24T08:40:00.000Z',
        },
        {
          userId: 'user-mia',
          name: 'Mia Chen',
          email: 'mia@northstar.test',
          role: 'manager',
          lastActiveAt: '2026-03-24T08:34:00.000Z',
        },
        {
          userId: 'user-zoe',
          name: 'Zoe Lin',
          email: 'zoe@northstar.test',
          role: 'member',
          lastActiveAt: '2026-03-23T11:25:00.000Z',
        },
      ],
      plugins: [
        {
          id: 'plugin-runbooks',
          name: 'Runbook Center',
          description: 'Operational playbooks surfaced beside tenant configuration.',
          version: '1.4.2',
          status: 'stable',
          enabled: true,
        },
        {
          id: 'plugin-insights',
          name: 'Workload Insights',
          description: 'Internal analytics module for burst traffic and tenant usage mix.',
          version: '0.9.0',
          status: 'beta',
          enabled: true,
        },
      ],
      auditEntries: [
        {
          id: 'audit-northstar-1',
          orgId: 'org-northstar',
          actorName: 'Olivia Hart',
          action: 'plugin.updated',
          target: 'Workload Insights',
          createdAt: '2026-03-23T09:20:00.000Z',
          detail: 'Enabled Workload Insights during enterprise rollout.',
        },
      ],
    },
  ],
])

const memberships = new Map<string, Membership[]>([
  [
    'user-olivia',
    [
      { orgId: 'org-acme', orgName: 'Acme Cloud', role: 'owner' },
      { orgId: 'org-northstar', orgName: 'Northstar OS', role: 'owner' },
    ],
  ],
  [
    'user-ben',
    [{ orgId: 'org-acme', orgName: 'Acme Cloud', role: 'admin' }],
  ],
  [
    'user-mia',
    [{ orgId: 'org-northstar', orgName: 'Northstar OS', role: 'manager' }],
  ],
  [
    'user-noah',
    [{ orgId: 'org-acme', orgName: 'Acme Cloud', role: 'viewer' }],
  ],
  [
    'user-zoe',
    [
      { orgId: 'org-acme', orgName: 'Acme Cloud', role: 'member' },
      { orgId: 'org-northstar', orgName: 'Northstar OS', role: 'member' },
    ],
  ],
])

export class PlatformStore {
  private readonly sessions = new Map<string, SessionRecord>()

  getUserIdForSession(sessionId?: string) {
    return sessionId ? this.sessions.get(sessionId)?.userId ?? null : null
  }

  createSession(userId: string) {
    const userMemberships = memberships.get(userId)

    if (!userMemberships?.length) {
      throw new Error('User is not assigned to any organization.')
    }

    const sessionId = `session-${crypto.randomUUID()}`
    this.sessions.set(sessionId, {
      sessionId,
      userId,
      currentOrgId: userMemberships[0].orgId,
    })
    return sessionId
  }

  destroySession(sessionId: string) {
    this.sessions.delete(sessionId)
  }

  switchOrganization(userId: string, orgId: string) {
    const session = [...this.sessions.values()].find((entry) => entry.userId === userId)
    const membership = memberships.get(userId)?.find((entry) => entry.orgId === orgId)

    if (!session || !membership) {
      throw new Error('You do not have access to this organization.')
    }

    session.currentOrgId = orgId
  }

  getSessionPayload(userId: string | null): SessionUser | null {
    if (!userId) {
      return null
    }

    const user = users.find((entry) => entry.id === userId)
    const userMemberships = memberships.get(userId)
    const session = [...this.sessions.values()].find((entry) => entry.userId === userId)

    if (!user || !userMemberships?.length || !session) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      currentOrgId: session.currentOrgId,
      memberships: structuredClone(userMemberships),
    }
  }

  getBootstrap(userId: string | null): PlatformBootstrap {
    const session = this.getSessionPayload(userId)
    const currentOrganization = session
      ? structuredClone(organizations.get(session.currentOrgId)?.organization ?? null)
      : null
    const currentMembership = session?.memberships.find((entry) => entry.orgId === session.currentOrgId)

    return {
      loginOptions: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        summary: user.summary,
      })),
      organizations: session
        ? session.memberships
            .map((membership) => organizations.get(membership.orgId)?.organization)
            .filter(Boolean)
            .map((organization) => structuredClone(organization!))
        : [],
      currentOrganization,
      session,
      modules:
        currentOrganization && currentMembership
          ? getAuthorizedModules(currentMembership.role, currentOrganization)
          : [],
    }
  }

  getOverview(orgId: string) {
    return structuredClone(this.requireOrganization(orgId).overview)
  }

  getMembers(orgId: string) {
    return structuredClone(this.requireOrganization(orgId).members)
  }

  getBilling(orgId: string): BillingState {
    const organization = this.requireOrganization(orgId).organization
    return {
      orgId,
      plan: organization.plan,
      billingStatus: organization.billingStatus,
      seatLimit: organization.seatLimit,
      usedSeats: organization.usedSeats,
      monthlySpendCents: organization.monthlySpendCents,
      renewalAt: organization.renewalAt,
      entitlements: structuredClone(planEntitlements[organization.plan]),
    }
  }

  getFeatureFlags(orgId: string): FeatureFlagRecord[] {
    const organization = this.requireOrganization(orgId).organization

    return featureFlagCatalog.map((flag) => ({
      ...flag,
      enabled: organization.featureFlags[flag.key],
    }))
  }

  getAuditEntries(orgId: string) {
    return structuredClone(this.requireOrganization(orgId).auditEntries)
  }

  getPlugins(orgId: string) {
    return structuredClone(this.requireOrganization(orgId).plugins)
  }

  authorize(userId: string, orgId: string, allowedRoles: Role[], entitlement?: string, flag?: FeatureFlagKey) {
    const membership = memberships.get(userId)?.find((entry) => entry.orgId === orgId)
    const organization = this.requireOrganization(orgId).organization

    if (!membership) {
      throw new Error('You do not belong to this organization.')
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new Error('You do not have access to this resource.')
    }

    if (entitlement && !planEntitlements[organization.plan].includes(entitlement)) {
      throw new Error('Your plan does not include this capability.')
    }

    if (flag && !organization.featureFlags[flag]) {
      throw new Error('This feature flag is disabled for the organization.')
    }
  }

  updateMemberRole(actorUserId: string, orgId: string, targetUserId: string, role: Role) {
    this.authorize(actorUserId, orgId, ['owner', 'admin', 'manager'], 'role-management')
    const orgRecord = this.requireOrganization(orgId)
    const actorMembership = memberships.get(actorUserId)?.find((entry) => entry.orgId === orgId)
    const member = orgRecord.members.find((entry) => entry.userId === targetUserId)

    if (!member) {
      throw new Error('Member not found.')
    }

    if (actorMembership?.role === 'manager' && role === 'owner') {
      throw new Error('Managers cannot assign owners.')
    }

    member.role = role
    const userMembership = memberships.get(targetUserId)?.find((entry) => entry.orgId === orgId)
    if (userMembership) {
      userMembership.role = role
    }

    this.writeAudit(orgId, actorUserId, 'member.role_updated', member.name, `Assigned ${roleLabels[role]} role.`)
    return structuredClone(member)
  }

  updateBillingPlan(actorUserId: string, orgId: string, plan: BillingPlan) {
    this.authorize(actorUserId, orgId, ['owner', 'admin'], 'billing-controls')
    const organization = this.requireOrganization(orgId).organization

    organization.plan = plan
    organization.monthlySpendCents =
      plan === 'starter' ? 120_000 : plan === 'growth' ? 240_000 : 480_000
    organization.seatLimit = plan === 'starter' ? 10 : plan === 'growth' ? 20 : 60
    if (plan === 'starter') {
      organization.featureFlags.pluginCenter = false
      organization.featureFlags.automationRules = false
    }
    if (plan === 'growth') {
      organization.featureFlags.automationRules = false
    }
    this.writeAudit(orgId, actorUserId, 'billing.plan_changed', plan, `Moved plan to ${plan}.`)
    return this.getBilling(orgId)
  }

  updateFeatureFlag(actorUserId: string, orgId: string, key: FeatureFlagKey, enabled: boolean) {
    this.authorize(actorUserId, orgId, ['owner', 'admin'], 'billing-controls')
    const organization = this.requireOrganization(orgId).organization

    if (key === 'pluginCenter' && !planEntitlements[organization.plan].includes('plugin-registry')) {
      throw new Error('Upgrade the plan before enabling plugin center.')
    }

    organization.featureFlags[key] = enabled
    const flag = this.getFeatureFlags(orgId).find((entry) => entry.key === key)
    if (!flag) {
      throw new Error('Flag not found.')
    }
    this.writeAudit(orgId, actorUserId, 'flag.updated', flag.label, `${enabled ? 'Enabled' : 'Disabled'} ${flag.label}.`)
    return flag
  }

  updatePlugin(actorUserId: string, orgId: string, pluginId: string, enabled: boolean) {
    this.authorize(actorUserId, orgId, ['owner', 'admin'], 'plugin-registry', 'pluginCenter')
    const plugin = this.requireOrganization(orgId).plugins.find((entry) => entry.id === pluginId)

    if (!plugin) {
      throw new Error('Plugin not found.')
    }

    plugin.enabled = enabled
    this.writeAudit(orgId, actorUserId, 'plugin.updated', plugin.name, `${enabled ? 'Enabled' : 'Disabled'} plugin.`)
    return structuredClone(plugin)
  }

  private requireOrganization(orgId: string) {
    const orgRecord = organizations.get(orgId)

    if (!orgRecord) {
      throw new Error('Organization not found.')
    }

    return orgRecord
  }

  private writeAudit(orgId: string, actorUserId: string, action: string, target: string, detail: string) {
    const user = users.find((entry) => entry.id === actorUserId)
    this.requireOrganization(orgId).auditEntries.unshift({
      id: `audit-${crypto.randomUUID()}`,
      orgId,
      actorName: user?.name ?? 'Unknown user',
      action,
      target,
      createdAt: nowIso(),
      detail,
    })
  }
}
