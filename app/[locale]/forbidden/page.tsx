import Link from 'next/link'
import { getDictionary, isLocale } from '../../../src/lib/i18n'
import type { Locale } from '../../../src/lib/platform-types'

export default async function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const resolvedLocale: Locale = isLocale(locale) ? locale : 'en'
  const dictionary = await getDictionary(resolvedLocale)

  return (
    <main className="state-shell">
      <section className="state-card">
        <p className="eyebrow">403</p>
        <h1>{dictionary.accessDenied.title}</h1>
        <p className="muted-copy">{dictionary.accessDenied.body}</p>
        <Link className="button button-primary button-md" href={`/${resolvedLocale}`}>
          {dictionary.accessDenied.cta}
        </Link>
      </section>
    </main>
  )
}
