import type { ScopeContext } from '../lib/platform-types'
import { scopeKey } from './platform-store'

export const makeScopeTag = (scope: ScopeContext, area: string) => `${area}:${scopeKey(scope)}`
