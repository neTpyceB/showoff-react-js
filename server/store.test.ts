import { describe, expect, it } from 'vitest'
import { PlatformStore } from './store.ts'

describe('PlatformStore', () => {
  it('keeps tenant data isolated by organization', () => {
    const store = new PlatformStore()

    expect(store.getMembers('org-acme').map((member) => member.email)).toContain('noah@northstar.test')
    expect(store.getMembers('org-acme').map((member) => member.email)).not.toContain('mia@northstar.test')
    expect(store.getMembers('org-northstar').map((member) => member.email)).toContain('mia@northstar.test')
  })

  it('blocks plugin enablement when the plan or flag does not allow it', () => {
    const store = new PlatformStore()
    const sessionId = store.createSession('user-ben')
    const userId = store.getUserIdForSession(sessionId)

    if (!userId) {
      throw new Error('Expected seeded session.')
    }

    expect(() => store.updatePlugin(userId, 'org-acme', 'plugin-insights', true)).toThrow(
      /plan does not include/i,
    )
  })

  it('writes audit events for mutating actions', () => {
    const store = new PlatformStore()
    const sessionId = store.createSession('user-olivia')
    const userId = store.getUserIdForSession(sessionId)

    if (!userId) {
      throw new Error('Expected seeded session.')
    }

    const before = store.getAuditEntries('org-acme').length
    store.updateBillingPlan(userId, 'org-acme', 'enterprise')
    const after = store.getAuditEntries('org-acme')

    expect(after).toHaveLength(before + 1)
    expect(after[0]?.action).toBe('billing.plan_changed')
  })

  it('switches organizations only for assigned memberships', () => {
    const store = new PlatformStore()
    store.createSession('user-olivia')
    store.switchOrganization('user-olivia', 'org-northstar')

    expect(store.getSessionPayload('user-olivia')?.currentOrgId).toBe('org-northstar')
    expect(() => store.switchOrganization('user-ben', 'org-northstar')).toThrow(/organization/i)
  })
})
