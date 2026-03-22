import { useNavigate } from 'react-router-dom'
import { Button } from './Button.tsx'
import { useLoginMutation, useUsersQuery } from '../kanban/hooks.ts'

export const LoginPage = () => {
  const navigate = useNavigate()
  const usersQuery = useUsersQuery()
  const loginMutation = useLoginMutation()

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="hero-copy">
          <p className="eyebrow">Access control</p>
          <h1>Kanban Task Manager</h1>
          <p className="hero-text">
            Demo auth is role-aware. Sign in with a seeded user to access the
            appropriate team spaces and permissions.
          </p>
        </div>

        <div className="user-grid">
          {usersQuery.data?.map((user) => (
            <article key={user.id} className="user-card">
              <div>
                <strong>{user.name}</strong>
                <p>{user.title}</p>
                <p>{user.email}</p>
              </div>
              <Button
                onClick={async () => {
                  await loginMutation.mutateAsync(user.id)
                  navigate('/', { replace: true })
                }}
              >
                Sign in as {user.name.split(' ')[0]}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
