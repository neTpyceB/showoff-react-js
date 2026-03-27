'use client'

import { useState } from 'react'
import type { Locale, Membership, ScopeContext } from '@/lib/platform-types'
import { switchContextAction } from '@/server/actions'

const pickFirst = (memberships: Membership[], partial: Partial<ScopeContext>) =>
  memberships.find(
    (entry) =>
      (!partial.orgSlug || entry.orgSlug === partial.orgSlug) &&
      (!partial.workspaceSlug || entry.workspaceSlug === partial.workspaceSlug) &&
      (!partial.productSlug || entry.productSlug === partial.productSlug) &&
      (!partial.environmentSlug || entry.environmentSlug === partial.environmentSlug),
  )

const uniqueBy = <T,>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function ContextSwitcher({
  locale,
  memberships,
  currentContext,
  submitLabel,
}: {
  locale: Locale
  memberships: Membership[]
  currentContext: ScopeContext
  submitLabel: string
}) {
  const [selection, setSelection] = useState(currentContext)

  const orgOptions = uniqueBy(memberships, (entry) => entry.orgSlug)
  const workspaceOptions = uniqueBy(
    memberships.filter((entry) => entry.orgSlug === selection.orgSlug),
    (entry) => `${entry.orgSlug}:${entry.workspaceSlug}`,
  )
  const productOptions = uniqueBy(
    memberships.filter(
      (entry) => entry.orgSlug === selection.orgSlug && entry.workspaceSlug === selection.workspaceSlug,
    ),
    (entry) => `${entry.orgSlug}:${entry.workspaceSlug}:${entry.productSlug}`,
  )
  const environmentOptions = memberships.filter(
    (entry) =>
      entry.orgSlug === selection.orgSlug &&
      entry.workspaceSlug === selection.workspaceSlug &&
      entry.productSlug === selection.productSlug,
  )

  return (
    <form action={switchContextAction} className="context-form">
      <input type="hidden" name="locale" value={locale} />
      <select
        aria-label="Organization"
        name="orgSlug"
        value={selection.orgSlug}
        onChange={(event) => {
          const orgSlug = event.currentTarget.value
          const next = pickFirst(memberships, { orgSlug })
          if (!next) {
            return
          }
          setSelection({
            orgSlug,
            workspaceSlug: next.workspaceSlug,
            productSlug: next.productSlug,
            environmentSlug: next.environmentSlug,
          })
        }}
      >
        {orgOptions.map((entry) => (
          <option key={`${entry.orgSlug}-${entry.workspaceSlug}-${entry.productSlug}-${entry.environmentSlug}`} value={entry.orgSlug}>
            {entry.orgName}
          </option>
        ))}
      </select>
      <select
        aria-label="Workspace"
        name="workspaceSlug"
        value={selection.workspaceSlug}
        onChange={(event) => {
          const workspaceSlug = event.currentTarget.value
          const next = pickFirst(memberships, { orgSlug: selection.orgSlug, workspaceSlug })
          if (!next) {
            return
          }
          setSelection({
            orgSlug: selection.orgSlug,
            workspaceSlug,
            productSlug: next.productSlug,
            environmentSlug: next.environmentSlug,
          })
        }}
      >
        {workspaceOptions.map((entry) => (
          <option key={`${entry.workspaceSlug}-${entry.productSlug}-${entry.environmentSlug}`} value={entry.workspaceSlug}>
            {entry.workspaceName}
          </option>
        ))}
      </select>
      <select
        aria-label="Product"
        name="productSlug"
        value={selection.productSlug}
        onChange={(event) => {
          const productSlug = event.currentTarget.value
          const next = pickFirst(memberships, {
            orgSlug: selection.orgSlug,
            workspaceSlug: selection.workspaceSlug,
            productSlug,
          })
          if (!next) {
            return
          }
          setSelection({
            orgSlug: selection.orgSlug,
            workspaceSlug: selection.workspaceSlug,
            productSlug,
            environmentSlug: next.environmentSlug,
          })
        }}
      >
        {productOptions.map((entry) => (
          <option key={`${entry.productSlug}-${entry.environmentSlug}`} value={entry.productSlug}>
            {entry.productName}
          </option>
        ))}
      </select>
      <select
        aria-label="Environment"
        name="environmentSlug"
        value={selection.environmentSlug}
        onChange={(event) => {
          const environmentSlug = event.currentTarget.value
          setSelection((current) => ({
            ...current,
            environmentSlug,
          }))
        }}
      >
        {environmentOptions.map((entry) => (
          <option key={entry.environmentSlug} value={entry.environmentSlug}>
            {entry.environmentName}
          </option>
        ))}
      </select>
      <button className="button button-secondary button-sm" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}
