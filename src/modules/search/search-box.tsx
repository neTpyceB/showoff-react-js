'use client'

import { useEffect, useState } from 'react'
import type { SearchDocument } from '@/lib/platform-types'

export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<SearchDocument[]>([])

  useEffect(() => {
    if (!query.trim()) {
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        return
      }
      const data = (await response.json()) as { results: SearchDocument[] }
      setSuggestions(data.results)
    }, 180)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query])

  return (
    <div className="search-box">
      <input
        aria-label="Search platform"
        name="q"
        placeholder="Search feed items, incidents, jobs, experiments"
        value={query}
        onChange={(event) => {
          const nextQuery = event.currentTarget.value
          setQuery(nextQuery)
          if (!nextQuery.trim()) {
            setSuggestions([])
          }
        }}
      />
      {suggestions.length > 0 ? (
        <div className="surface-soft suggestion-list">
          {suggestions.map((suggestion) => (
            <a key={suggestion.id} href={suggestion.href}>
              <strong>{suggestion.title}</strong>
              <small>{suggestion.snippet}</small>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
