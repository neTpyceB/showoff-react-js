import { createEmptyAppState, type AppState } from '../platform/state.ts'
import { getAuthorizedModules } from '../platform/access.ts'

export const createPlatformTestState = (): AppState => {
  const state = createEmptyAppState()

  state.session = {
    id: 'user-olivia',
    name: 'Olivia Hart',
    email: 'olivia@northstar.test',
    currentOrgId: 'org-acme',
    memberships: [
      {
        orgId: 'org-acme',
        orgName: 'Acme Cloud',
        role: 'owner',
      },
    ],
  }

  state.bootstrap = {
    loginOptions: [
      {
        id: 'user-olivia',
        name: 'Olivia Hart',
        email: 'olivia@northstar.test',
        summary: 'Global owner across two organizations.',
      },
    ],
    organizations: [
      {
        id: 'org-acme',
        name: 'Acme Cloud',
        slug: 'acme-cloud',
        plan: 'growth',
        billingStatus: 'active',
        seatLimit: 20,
        usedSeats: 4,
        monthlySpendCents: 240000,
        renewalAt: '2026-04-15T08:00:00.000Z',
        featureFlags: {
          advancedRoles: true,
          auditStreaming: true,
          pluginCenter: false,
          automationRules: false,
        },
      },
    ],
    currentOrganization: {
      id: 'org-acme',
      name: 'Acme Cloud',
      slug: 'acme-cloud',
      plan: 'growth',
      billingStatus: 'active',
      seatLimit: 20,
      usedSeats: 4,
      monthlySpendCents: 240000,
      renewalAt: '2026-04-15T08:00:00.000Z',
      featureFlags: {
        advancedRoles: true,
        auditStreaming: true,
        pluginCenter: false,
        automationRules: false,
      },
    },
    session: state.session,
    modules: getAuthorizedModules('owner', {
      id: 'org-acme',
      plan: 'growth',
      featureFlags: {
        advancedRoles: true,
        auditStreaming: true,
        pluginCenter: false,
        automationRules: false,
      },
    }),
  }

  state.overview = {
    orgId: 'org-acme',
    activeUsers: 18,
    automationRuns: 142,
    apiRequests: 904320,
    openIncidents: 1,
    storageUsedGb: 284,
  }

  return state
}
