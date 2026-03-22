import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button.tsx'
import { useLogoutMutation, useSessionQuery, useSpacesQuery } from '../kanban/hooks.ts'

export const AppShell = ({
  activeSpaceId,
  children,
}: {
  activeSpaceId: string
  children: ReactNode
}) => {
  const navigate = useNavigate()
  const sessionQuery = useSessionQuery()
  const spacesQuery = useSpacesQuery(sessionQuery.data?.id)
  const logoutMutation = useLogoutMutation()

  if (!sessionQuery.data || !spacesQuery.data) {
    return null
  }

  return (
    <div className="shell-layout">
      <aside className="sidebar">
        <div className="sidebar-block">
          <p className="eyebrow">Signed in</p>
          <strong>{sessionQuery.data.name}</strong>
          <p>{sessionQuery.data.title}</p>
        </div>

        <nav className="space-nav" aria-label="Team spaces">
          {spacesQuery.data.map((space) => (
            <button
              key={space.id}
              type="button"
              className="space-link"
              data-active={space.id === activeSpaceId}
              onClick={() => navigate(`/spaces/${space.id}`)}
            >
              <span>{space.name}</span>
              <small>{space.role}</small>
            </button>
          ))}
        </nav>

        <Button
          variant="ghost"
          onClick={async () => {
            await logoutMutation.mutateAsync()
            navigate('/login', { replace: true })
          }}
        >
          Sign out
        </Button>
      </aside>

      <div className="content-shell">{children}</div>
    </div>
  )
}
