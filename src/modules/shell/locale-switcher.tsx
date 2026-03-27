'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/platform-types'

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const target = (nextLocale: Locale) => pathname.replace(/^\/(en|de)/, `/${nextLocale}`)

  return (
    <div className="locale-switcher">
      <Link className={locale === 'en' ? 'pill active' : 'pill'} href={target('en')}>
        EN
      </Link>
      <Link className={locale === 'de' ? 'pill active' : 'pill'} href={target('de')}>
        DE
      </Link>
    </div>
  )
}
