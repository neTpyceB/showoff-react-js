import {
  auditEntrySchema,
  billingSchema,
  bootstrapSchema,
  featureFlagSchema,
  loginRequestSchema,
  overviewSchema,
  pluginSchema,
  sessionSchema,
  switchOrganizationSchema,
  updateBillingPlanSchema,
  updateFeatureFlagSchema,
  updateMemberRoleSchema,
  updatePluginSchema,
  type BillingPlan,
  type FeatureFlagRecord,
  type OrganizationMember,
  type PluginModule,
  type SessionUser,
} from './model.ts'

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: 'Request failed.' }))) as { message?: string }
    throw new Error(body.message ?? 'Request failed.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

const request = async <T>(input: RequestInfo, init?: RequestInit) =>
  readJson<T>(
    await fetch(input, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    }),
  )

export const platformApi = {
  getSession: async () => sessionSchema.nullable().parse(await request<SessionUser | null>('/api/session')),
  login: async (userId: string) =>
    sessionSchema.parse(
      await request('/api/session/login', {
        method: 'POST',
        body: JSON.stringify(loginRequestSchema.parse({ userId })),
      }),
    ),
  logout: async () =>
    request<void>('/api/session/logout', {
      method: 'POST',
    }),
  switchOrganization: async (orgId: string) =>
    sessionSchema.parse(
      await request('/api/session/switch-organization', {
        method: 'POST',
        body: JSON.stringify(switchOrganizationSchema.parse({ orgId })),
      }),
    ),
  getBootstrap: async () => bootstrapSchema.parse(await request('/api/bootstrap')),
  getOverview: async (orgId: string) => overviewSchema.parse(await request(`/api/orgs/${orgId}/overview`)),
  getMembers: async (orgId: string) =>
    request<OrganizationMember[]>(`/api/orgs/${orgId}/members`),
  updateMemberRole: async (orgId: string, userId: string, role: OrganizationMember['role']) =>
    request<OrganizationMember>(`/api/orgs/${orgId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateMemberRoleSchema.parse({ role })),
    }),
  getBilling: async (orgId: string) => billingSchema.parse(await request(`/api/orgs/${orgId}/billing`)),
  updateBillingPlan: async (orgId: string, plan: BillingPlan) =>
    billingSchema.parse(
      await request(`/api/orgs/${orgId}/billing`, {
        method: 'PATCH',
        body: JSON.stringify(updateBillingPlanSchema.parse({ plan })),
      }),
    ),
  getFlags: async (orgId: string) =>
    request<FeatureFlagRecord[]>(`/api/orgs/${orgId}/flags`).then((rows) => rows.map((row) => featureFlagSchema.parse(row))),
  updateFlag: async (orgId: string, key: FeatureFlagRecord['key'], enabled: boolean) =>
    featureFlagSchema.parse(
      await request(`/api/orgs/${orgId}/flags/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFeatureFlagSchema.parse({ enabled })),
      }),
    ),
  getAudit: async (orgId: string) =>
    request<unknown[]>(`/api/orgs/${orgId}/audit`).then((rows) => rows.map((row) => auditEntrySchema.parse(row))),
  getPlugins: async (orgId: string) =>
    request<PluginModule[]>(`/api/orgs/${orgId}/plugins`).then((rows) => rows.map((row) => pluginSchema.parse(row))),
  updatePlugin: async (orgId: string, pluginId: string, enabled: boolean) =>
    pluginSchema.parse(
      await request(`/api/orgs/${orgId}/plugins/${pluginId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatePluginSchema.parse({ enabled })),
      }),
    ),
}
