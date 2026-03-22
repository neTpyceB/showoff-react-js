import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useBootstrapQuery, useLogoutMutation } from '../chat/hooks.ts'
import { Button } from './Button.tsx'

const presenceLabel = (state: 'online' | 'idle' | 'offline') => {
  if (state === 'online') {
    return 'Online'
  }

  if (state === 'idle') {
    return 'Idle'
  }

  return 'Offline'
}

export const AppShell = ({
  activeChannelId,
  children,
}: {
  activeChannelId: string
  children: ReactNode
}) => {
  const bootstrapQuery = useBootstrapQuery(true)
  const logoutMutation = useLogoutMutation()

  if (bootstrapQuery.isPending) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <h1>Loading workspace</h1>
        </section>
      </main>
    )
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <h1>Workspace unavailable</h1>
          <p>{bootstrapQuery.error?.message ?? 'Workspace bootstrap failed.'}</p>
        </section>
      </main>
    )
  }

  const { currentUser, channels, presence, users, workspace } = bootstrapQuery.data

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="sidebar-panel">
          <p className="eyebrow">Workspace</p>
          <h1>{workspace.name}</h1>
          <p className="sidebar-copy">{workspace.description}</p>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-header">
            <strong>Signed in</strong>
            <Button
              variant="ghost"
              size="sm"
              busy={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Sign out
            </Button>
          </div>
          <div className="identity-card">
            <div className="avatar-badge">{currentUser.avatarLabel}</div>
            <div>
              <strong>{currentUser.name}</strong>
              <p>{currentUser.title}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-header">
            <strong>Channels</strong>
          </div>
          <nav className="channel-nav" aria-label="Channels">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                className="channel-link"
                data-active={channel.id === activeChannelId}
                to={`/channels/${channel.id}`}
              >
                <span>#{channel.name}</span>
                {channel.unreadCount > 0 ? (
                  <span className="badge">{channel.unreadCount}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-panel">
          <div className="sidebar-header">
            <strong>Presence</strong>
          </div>
          <div className="member-list">
            {users.map((user) => {
              const userPresence = presence.find((entry) => entry.userId === user.id)

              if (!userPresence) {
                throw new Error('Workspace presence data is incomplete.')
              }

              return (
                <div key={user.id} className="member-row">
                  <div className="avatar-badge">{user.avatarLabel}</div>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{presenceLabel(userPresence.state)}</p>
                  </div>
                  <span className="presence-dot" data-state={userPresence.state} />
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      <main className="workspace-main">{children}</main>
    </div>
  )
}
