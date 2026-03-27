import type { Locale } from './platform-types'

export const locales: Locale[] = ['en', 'de']

export const isLocale = (value: string): value is Locale => locales.includes(value as Locale)

export const getLocalizedPath = (locale: Locale, path: string) =>
  `/${locale}${path.startsWith('/') ? path : `/${path}`}`

const dictionaries = {
  en: {
    appName: 'Atlas Product Platform',
    chrome: {
      kicker: 'World-class Product OS',
      logout: 'Sign out',
      updateContext: 'Update context',
      locale: 'Language',
      notifications: 'Notifications',
      unread: 'Unread',
    },
    login: {
      title: 'Atlas Product Platform',
      subtitle:
        'Feeds, dashboards, search, notifications, collaboration, jobs, observability, and experiments in one server-first platform.',
      signInAs: 'Sign in as',
    },
    nav: {
      feed: 'Feed',
      dashboards: 'Dashboards',
      search: 'Search',
      notifications: 'Notifications',
      collaboration: 'Collaboration',
      jobs: 'Jobs',
      observability: 'Observability',
      experiments: 'Experiments',
    },
    accessDenied: {
      title: 'Access denied',
      body: 'Your session is valid, but the requested scope or capability is outside your permissions.',
      cta: 'Return to workspace',
    },
    states: {
      loading: 'Loading',
      empty: 'No data yet.',
    },
    actions: {
      acknowledge: 'Acknowledge',
      comment: 'Add comment',
      retry: 'Retry job',
      rollout: 'Start rollout',
      pause: 'Pause experiment',
      pin: 'Pin note',
      search: 'Search',
    },
  },
  de: {
    appName: 'Atlas Produktplattform',
    chrome: {
      kicker: 'Produkt-OS auf Staff-Niveau',
      logout: 'Abmelden',
      updateContext: 'Kontext aktualisieren',
      locale: 'Sprache',
      notifications: 'Benachrichtigungen',
      unread: 'Ungelesen',
    },
    login: {
      title: 'Atlas Produktplattform',
      subtitle:
        'Feeds, Dashboards, Suche, Benachrichtigungen, Kollaboration, Jobs, Observability und Experimente in einer serverzentrierten Plattform.',
      signInAs: 'Anmelden als',
    },
    nav: {
      feed: 'Feed',
      dashboards: 'Dashboards',
      search: 'Suche',
      notifications: 'Benachrichtigungen',
      collaboration: 'Kollaboration',
      jobs: 'Jobs',
      observability: 'Observability',
      experiments: 'Experimente',
    },
    accessDenied: {
      title: 'Zugriff verweigert',
      body: 'Die Sitzung ist gültig, aber der angeforderte Bereich oder die Funktion liegt außerhalb deiner Berechtigungen.',
      cta: 'Zurück zur Arbeitsfläche',
    },
    states: {
      loading: 'Wird geladen',
      empty: 'Noch keine Daten vorhanden.',
    },
    actions: {
      acknowledge: 'Bestätigen',
      comment: 'Kommentar hinzufügen',
      retry: 'Job erneut starten',
      rollout: 'Rollout starten',
      pause: 'Experiment pausieren',
      pin: 'Notiz anheften',
      search: 'Suchen',
    },
  },
} satisfies Record<Locale, Record<string, unknown>>

export const getDictionary = async (locale: Locale) => dictionaries[locale]
