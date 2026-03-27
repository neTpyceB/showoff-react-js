import { describe, expect, it } from 'vitest'
import { getDictionary, getLocalizedPath, isLocale } from './i18n'

describe('i18n', () => {
  it('resolves localized paths and locale guards', async () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('de')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(getLocalizedPath('de', '/login')).toBe('/de/login')
    expect((await getDictionary('en')).login.title).toMatch(/Atlas/i)
  })
})
