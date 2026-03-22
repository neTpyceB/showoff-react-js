import { useLoginMutation } from '../chat/hooks.ts'
import { Button } from './Button.tsx'

const loginUsers = [
  {
    id: 'alice',
    name: 'Alice Johnson',
    title: 'Support Lead',
  },
  {
    id: 'ben',
    name: 'Ben Carter',
    title: 'Engineering Manager',
  },
  {
    id: 'casey',
    name: 'Casey Diaz',
    title: 'Customer Success',
  },
]

export const LoginPage = () => {
  const loginMutation = useLoginMutation()

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Realtime Workspace</p>
        <h1>Orbit Team Chat</h1>
        <p className="hero-copy">
          Channels, live presence, threaded conversations, unread counts, uploads, and
          offline recovery on a real local backend.
        </p>

        <div className="login-user-grid">
          {loginUsers.map((user) => (
            <article key={user.id} className="login-user-card">
              <div className="avatar-badge">{user.name.split(' ').map((part) => part[0]).join('')}</div>
              <div>
                <strong>{user.name}</strong>
                <p>{user.title}</p>
              </div>
              <Button
                busy={loginMutation.isPending && loginMutation.variables === user.id}
                onClick={() => loginMutation.mutate(user.id)}
              >
                Sign in as {user.name.split(' ')[0]}
              </Button>
            </article>
          ))}
        </div>

        {loginMutation.isError ? (
          <p className="field-error">{loginMutation.error.message}</p>
        ) : null}
      </section>
    </main>
  )
}
