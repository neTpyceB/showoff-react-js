/* @jsxRuntime automatic */
import { useNavigate } from 'react-router-dom'
import { useCommerce } from '../commerce/client.tsx'
import { Button } from './Button.tsx'

const loginUsers = [
  {
    id: 'customer-maya',
    name: 'Maya Brooks',
    title: 'Returning customer',
    summary: 'Use the customer account flow, cart, checkout, and order history.',
  },
  {
    id: 'admin-evan',
    name: 'Evan Stone',
    title: 'Operations admin',
    summary: 'Use the admin dashboard, product controls, inventory, and order management.',
  },
]

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, state } = useCommerce()

  return (
    <main className="login-shell commerce-login">
      <section className="login-card">
        <p className="eyebrow">Electronics Retail Demo</p>
        <h1>Showoff Electronics</h1>
        <p className="hero-copy">
          Catalog, search, filters, cart, checkout, account, admin, SSR, and role-aware
          same-origin APIs in one production-style React stack.
        </p>

        <div className="login-user-grid">
          {loginUsers.map((user) => (
            <article key={user.id} className="login-user-card">
              <div className="avatar-badge">{user.name.split(' ').map((part) => part[0]).join('')}</div>
              <div>
                <strong>{user.name}</strong>
                <p>{user.title}</p>
              </div>
              <small>{user.summary}</small>
              <Button
                onClick={async () => {
                  await login(user.id)
                  navigate(user.id === 'admin-evan' ? '/admin' : '/account/orders')
                }}
              >
                Sign in as {user.name.split(' ')[0]}
              </Button>
            </article>
          ))}
        </div>

        {state.session ? (
          <p className="field-error">You are signed in already. Use the account or admin navigation.</p>
        ) : null}
      </section>
    </main>
  )
}
