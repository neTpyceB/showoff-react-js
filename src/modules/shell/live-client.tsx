'use client'

import { useEffect, useMemo, useState } from 'react'
import type { NotificationItem } from '@/lib/platform-types'

type LiveClientProps = {
  scopeKey: string
  initialNotifications: Array<NotificationItem & { read: boolean }>
  locale: string
  labels: {
    notifications: string
    unread: string
  }
}

export function LiveClient({ scopeKey, initialNotifications, labels }: LiveClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [presence, setPresence] = useState<string[]>([])

  useEffect(() => {
    const stream = new EventSource(`/api/stream?scopeKey=${encodeURIComponent(scopeKey)}`)

    stream.addEventListener('notification', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as NotificationItem
      setNotifications((current) => [{ ...payload, read: false }, ...current.filter((item) => item.id !== payload.id)].slice(0, 6))
    })

    stream.addEventListener('presence', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { activeUsers: string[] }
      setPresence(payload.activeUsers)
    })

    return () => {
      stream.close()
    }
  }, [scopeKey])

  const unread = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  return (
    <aside className="live-tray">
      <div className="live-head">
        <strong>{labels.notifications}</strong>
        <span className="pill">{labels.unread}: {unread}</span>
      </div>
      <ul className="stack-list">
        {notifications.slice(0, 4).map((notification) => (
          <li key={notification.id} className="surface-soft">
            <strong>{notification.title}</strong>
            <p className="muted-copy">{notification.body}</p>
          </li>
        ))}
      </ul>
      <p className="muted-copy">Live presence: {presence.length}</p>
    </aside>
  )
}
