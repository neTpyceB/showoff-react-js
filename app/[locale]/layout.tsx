import type { ReactNode } from 'react'
import { getDictionary, isLocale } from '../../src/lib/i18n'
import type { Locale } from '../../src/lib/platform-types'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const resolvedLocale: Locale = isLocale(locale) ? locale : 'en'
  const dictionary = await getDictionary(resolvedLocale)

  return (
    <div data-locale={resolvedLocale} data-product-name={dictionary.appName}>
      {children}
    </div>
  )
}
