import { describe, expect, it } from 'vitest'
import { canManageTasks, isViewer } from './permissions.ts'

describe('permissions', () => {
  it('allows admins and editors to manage tasks', () => {
    expect(canManageTasks('admin')).toBe(true)
    expect(canManageTasks('editor')).toBe(true)
    expect(canManageTasks('viewer')).toBe(false)
  })

  it('identifies viewers', () => {
    expect(isViewer('viewer')).toBe(true)
    expect(isViewer('admin')).toBe(false)
  })
})
