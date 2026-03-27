import { getDictionary, isLocale } from '../../../src/lib/i18n'
import type { Locale } from '../../../src/lib/platform-types'
import { getLoginOptions } from '../../../src/server/platform-store'
import { sessionCookieName } from '../../../src/server/auth'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const resolvedLocale: Locale = isLocale(locale) ? locale : 'en'
  const dictionary = await getDictionary(resolvedLocale)
  const loginOptions = getLoginOptions()

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">{dictionary.chrome.kicker}</p>
        <h1>{dictionary.login.title}</h1>
        <p className="muted-copy">{dictionary.login.subtitle}</p>
        <div className="login-grid">
          {loginOptions.map((user) => (
            <article key={user.id} className="surface-card login-user-card">
              <div className="avatar-badge">
                {user.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </div>
              <div>
                <strong>{user.name}</strong>
                <p className="muted-copy">{user.email}</p>
              </div>
              <p className="muted-copy">{user.summary[resolvedLocale]}</p>
              <form action="/api/session/login" method="post">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="locale" value={resolvedLocale} />
                <input type="hidden" name="sessionCookieName" value={sessionCookieName} />
                <button className="button button-primary button-md" type="submit">
                  {dictionary.login.signInAs} {user.name.split(' ')[0]}
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
