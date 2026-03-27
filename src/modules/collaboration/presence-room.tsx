'use client'

import { useEffect, useState } from 'react'

export function PresenceRoom({ scopeKey, initial }: { scopeKey: string; initial: string[] }) {
  const [activeUsers, setActiveUsers] = useState(initial)

  useEffect(() => {
    const stream = new EventSource(`/api/stream?scopeKey=${encodeURIComponent(scopeKey)}`)
    stream.addEventListener('presence', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { activeUsers: string[] }
      setActiveUsers(payload.activeUsers)
    })
    return () => stream.close()
  }, [scopeKey])

  return (
    <div className="surface-card">
      <h3>Live room presence</h3>
      <p className="muted-copy">Active sessions: {activeUsers.length}</p>
      <ul className="stack-list compact">
        {activeUsers.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  )
}
