'use client'

import { useEffect, useState } from 'react'
import type { FeedItem } from '@/lib/platform-types'

export function LiveFeed({ scopeKey, initialItems }: { scopeKey: string; initialItems: FeedItem[] }) {
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    const stream = new EventSource(`/api/stream?scopeKey=${encodeURIComponent(scopeKey)}`)
    stream.addEventListener('feed', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as FeedItem
      setItems((current) => [payload, ...current.filter((item) => item.id !== payload.id)])
    })
    return () => stream.close()
  }, [scopeKey])

  return (
    <div className="stack-list">
      {items.map((item) => (
        <article key={item.id} className="surface-card timeline-item">
          <div className="inline-row">
            <strong>{item.title}</strong>
            <span className="pill">{item.kind}</span>
          </div>
          <p>{item.body}</p>
          <small className="muted-copy">{item.actor} · {new Date(item.createdAt).toLocaleString()}</small>
        </article>
      ))}
    </div>
  )
}
