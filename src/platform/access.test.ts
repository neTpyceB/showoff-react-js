import { describe, expect, it } from 'vitest'
import { canAccessModule, getAuthorizedModules } from './access.ts'

describe('platform access', () => {
  it('hides gated modules when plan entitlements are missing', () => {
    const modules = getAuthorizedModules('owner', {
      id: 'org-test',
      plan: 'growth',
      featureFlags: {
        advancedRoles: true,
        auditStreaming: true,
        pluginCenter: true,
        automationRules: false,
      },
    })

    expect(modules.map((module) => module.id)).not.toContain('plugins')
    expect(modules.map((module) => module.id)).toContain('audit')
  })

  it('requires both feature flags and roles for gated modules', () => {
    expect(
      canAccessModule(
        'admin',
        {
          plan: 'enterprise',
          featureFlags: {
            advancedRoles: true,
            auditStreaming: true,
            pluginCenter: false,
            automationRules: true,
          },
        },
        {
          requiredRoles: ['admin', 'owner'],
          requiredEntitlements: ['plugin-registry'],
          requiredFlags: ['pluginCenter'],
        },
      ),
    ).toBe(false)
  })
})
