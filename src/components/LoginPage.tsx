/* @jsxRuntime automatic */
import { useNavigate } from 'react-router-dom'
import { usePlatform } from '../platform/client.tsx'
import { Button } from './Button.tsx'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, state } = usePlatform()

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Flagship SaaS Admin Demo</p>
        <h1>Northstar Admin</h1>
        <p className="muted-copy login-copy">
          Multi-tenant organizations, role-aware modules, billing entitlements, feature flags, audit logs, and plugin-like internal modules on one same-origin React stack.
        </p>

        <div className="login-user-grid">
          {state.bootstrap.loginOptions.map((user) => (
            <article key={user.id} className="login-user-card">
              <div className="avatar-badge">{user.name.split(' ').map((part) => part[0]).join('')}</div>
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <p>{user.summary}</p>
              <Button
                onClick={async () => {
                  await login(user.id)
                  navigate('/')
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
