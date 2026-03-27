import type {
  CollaborationComment,
  CollaborationThread,
  DashboardState,
  Experiment,
  FeedItem,
  Job,
  LoginOption,
  Membership,
  NotificationItem,
  ObservabilityState,
  PlatformEvent,
  PlatformSession,
  PresenceSnapshot,
  ScopeContext,
  SearchDocument,
} from '../lib/platform-types'

const nowIso = () => new Date().toISOString()

export const scopeKey = (scope: ScopeContext) =>
  `${scope.orgSlug}/${scope.workspaceSlug}/${scope.productSlug}/${scope.environmentSlug}`

const buildHref = (scope: ScopeContext, segment: string) =>
  `/app/${scope.orgSlug}/${scope.workspaceSlug}/${scope.productSlug}/${scope.environmentSlug}/${segment}`

type UserRecord = LoginOption & {
  memberships: Membership[]
}

type SessionRecord = {
  sessionId: string
  userId: string
  currentContext: ScopeContext
}

type PlatformStoreState = {
  users: UserRecord[]
  sessions: Map<string, SessionRecord>
  feed: FeedItem[]
  notifications: NotificationItem[]
  threads: CollaborationThread[]
  jobs: Job[]
  experiments: Experiment[]
  observability: Record<string, ObservabilityState>
  presence: PresenceSnapshot
}

const memberships: Record<string, Membership[]> = {
  'user-alina': [
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'growth',
      workspaceName: 'Growth',
      productSlug: 'atlas-cloud',
      productName: 'Atlas Cloud',
      environmentSlug: 'production',
      environmentName: 'Production',
      environmentRisk: 'high',
      role: 'owner',
    },
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'growth',
      workspaceName: 'Growth',
      productSlug: 'atlas-cloud',
      productName: 'Atlas Cloud',
      environmentSlug: 'staging',
      environmentName: 'Staging',
      environmentRisk: 'medium',
      role: 'owner',
    },
    {
      orgSlug: 'solstice',
      orgName: 'Solstice Systems',
      workspaceSlug: 'core',
      workspaceName: 'Core Platform',
      productSlug: 'solstice-app',
      productName: 'Solstice App',
      environmentSlug: 'production',
      environmentName: 'Production',
      environmentRisk: 'high',
      role: 'owner',
    },
  ],
  'user-emil': [
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'growth',
      workspaceName: 'Growth',
      productSlug: 'atlas-cloud',
      productName: 'Atlas Cloud',
      environmentSlug: 'production',
      environmentName: 'Production',
      environmentRisk: 'high',
      role: 'product_manager',
    },
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'growth',
      workspaceName: 'Growth',
      productSlug: 'atlas-cloud',
      productName: 'Atlas Cloud',
      environmentSlug: 'staging',
      environmentName: 'Staging',
      environmentRisk: 'medium',
      role: 'product_manager',
    },
  ],
  'user-marta': [
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'reliability',
      workspaceName: 'Reliability',
      productSlug: 'pulse-ops',
      productName: 'Pulse Ops',
      environmentSlug: 'production',
      environmentName: 'Production',
      environmentRisk: 'high',
      role: 'engineer',
    },
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'reliability',
      workspaceName: 'Reliability',
      productSlug: 'pulse-ops',
      productName: 'Pulse Ops',
      environmentSlug: 'staging',
      environmentName: 'Staging',
      environmentRisk: 'medium',
      role: 'engineer',
    },
  ],
  'user-felix': [
    {
      orgSlug: 'northstar',
      orgName: 'Northstar Labs',
      workspaceSlug: 'growth',
      workspaceName: 'Growth',
      productSlug: 'atlas-cloud',
      productName: 'Atlas Cloud',
      environmentSlug: 'production',
      environmentName: 'Production',
      environmentRisk: 'high',
      role: 'viewer',
    },
  ],
}

const users: UserRecord[] = [
  {
    id: 'user-alina',
    name: 'Alina Vogel',
    email: 'alina@atlas.test',
    summary: {
      en: 'Owner across Northstar and Solstice production workspaces.',
      de: 'Owner über Northstar- und Solstice-Produktionsbereiche hinweg.',
    },
    memberships: memberships['user-alina'],
  },
  {
    id: 'user-emil',
    name: 'Emil Krauss',
    email: 'emil@atlas.test',
    summary: {
      en: 'Product manager focused on growth feeds and experiments.',
      de: 'Produktmanager mit Fokus auf Growth-Feeds und Experimente.',
    },
    memberships: memberships['user-emil'],
  },
  {
    id: 'user-marta',
    name: 'Marta Rossi',
    email: 'marta@atlas.test',
    summary: {
      en: 'Reliability engineer handling jobs and observability.',
      de: 'Reliability Engineer für Jobs und Observability.',
    },
    memberships: memberships['user-marta'],
  },
  {
    id: 'user-felix',
    name: 'Felix Brandt',
    email: 'felix@atlas.test',
    summary: {
      en: 'Viewer for read-only verification of strict boundaries.',
      de: 'Viewer zur Prüfung strikter Berechtigungsgrenzen.',
    },
    memberships: memberships['user-felix'],
  },
]

const seededFeed = (scope: ScopeContext): FeedItem[] => [
  {
    id: `${scopeKey(scope)}-feed-1`,
    scopeKey: scopeKey(scope),
    kind: 'launch',
    title: `${scope.productSlug} rollout reached 30%`,
    body: 'Guardrail metrics remain inside budget after the latest deployment wave.',
    actor: 'Release automation',
    pinned: false,
    createdAt: '2026-03-27T08:10:00.000Z',
  },
  {
    id: `${scopeKey(scope)}-feed-2`,
    scopeKey: scopeKey(scope),
    kind: 'incident',
    title: `Latency spike on ${scope.environmentSlug}`,
    body: 'Checkout edge cache degraded for 11 minutes before automatic recovery.',
    actor: 'Observability',
    pinned: false,
    createdAt: '2026-03-27T07:20:00.000Z',
  },
  {
    id: `${scopeKey(scope)}-feed-3`,
    scopeKey: scopeKey(scope),
    kind: 'experiment',
    title: 'Variant B keeps winning on activation',
    body: 'Experiment guardrails stayed green after the overnight traffic cohort closed.',
    actor: 'Experimentation',
    pinned: false,
    createdAt: '2026-03-26T19:20:00.000Z',
  },
]

const seededNotifications = (scope: ScopeContext): NotificationItem[] => [
  {
    id: `${scopeKey(scope)}-notification-1`,
    scopeKey: scopeKey(scope),
    title: 'Experiment guardrail healthy',
    body: 'Activation uplift is holding while retention remains flat.',
    kind: 'experiment',
    readBy: [],
    createdAt: '2026-03-27T08:22:00.000Z',
  },
  {
    id: `${scopeKey(scope)}-notification-2`,
    scopeKey: scopeKey(scope),
    title: 'Failed job requires attention',
    body: 'Backfill cache warmer exhausted retries on the last run.',
    kind: 'job',
    readBy: [],
    createdAt: '2026-03-27T07:58:00.000Z',
  },
]

const seededThreads = (scope: ScopeContext): CollaborationThread[] => [
  {
    id: `${scopeKey(scope)}-thread-1`,
    scopeKey: scopeKey(scope),
    title: 'Launch review room',
    comments: [
      {
        id: `${scopeKey(scope)}-comment-1`,
        author: 'Alina Vogel',
        body: 'Ship only if latency stays below 220ms through the next deploy train.',
        createdAt: '2026-03-27T08:00:00.000Z',
      },
      {
        id: `${scopeKey(scope)}-comment-2`,
        author: 'Emil Krauss',
        body: 'Variant B remains safe. I want the feed pinned note updated after rollout.',
        createdAt: '2026-03-27T08:05:00.000Z',
      },
    ],
  },
]

const seededJobs = (scope: ScopeContext): Job[] => [
  {
    id: `${scopeKey(scope)}-job-1`,
    scopeKey: scopeKey(scope),
    name: 'analytics-backfill',
    owner: 'Data platform',
    status: 'failed',
    schedule: 'Every 30 min',
    lastRunAt: '2026-03-27T07:50:00.000Z',
    nextRunAt: '2026-03-27T08:20:00.000Z',
    retries: 3,
    maxRetries: 5,
    lastError: 'Warehouse replica lag exceeded 18 minutes.',
  },
  {
    id: `${scopeKey(scope)}-job-2`,
    scopeKey: scopeKey(scope),
    name: 'feed-fanout',
    owner: 'Product core',
    status: 'completed',
    schedule: 'Every 5 min',
    lastRunAt: '2026-03-27T08:15:00.000Z',
    nextRunAt: '2026-03-27T08:20:00.000Z',
    retries: 0,
    maxRetries: 3,
    lastError: null,
  },
]

const seededExperiments = (scope: ScopeContext): Experiment[] => [
  {
    id: `${scopeKey(scope)}-experiment-1`,
    scopeKey: scopeKey(scope),
    name: 'Activation onboarding v3',
    status: 'running',
    owner: 'Growth',
    metric: 'Activation to paid',
    guardrail: 'Retention day 7',
    winner: 'Variant B',
  },
  {
    id: `${scopeKey(scope)}-experiment-2`,
    scopeKey: scopeKey(scope),
    name: 'Smart inbox ranking',
    status: 'draft',
    owner: 'Core UX',
    metric: 'Inbox response time',
    guardrail: 'Escalation rate',
    winner: null,
  },
]

const seededObservability = (scope: ScopeContext): ObservabilityState => ({
  alerts: [
    {
      id: `${scopeKey(scope)}-alert-1`,
      severity: 'critical',
      title: 'API latency budget at 82%',
      detail: 'P95 latency drifted after rollout window 4.',
      createdAt: '2026-03-27T08:12:00.000Z',
    },
    {
      id: `${scopeKey(scope)}-alert-2`,
      severity: 'warning',
      title: 'Queue depth elevated',
      detail: 'Background job queue sits 14% above its seven day median.',
      createdAt: '2026-03-27T07:56:00.000Z',
    },
  ],
  traces: [
    {
      id: `${scopeKey(scope)}-trace-1`,
      operation: 'GET /api/feed',
      latencyMs: 184,
      status: 'healthy',
    },
    {
      id: `${scopeKey(scope)}-trace-2`,
      operation: 'POST /api/jobs/retry',
      latencyMs: 428,
      status: 'degraded',
    },
  ],
  incidents: [
    {
      id: `${scopeKey(scope)}-incident-1`,
      title: 'Checkout latency regression',
      status: 'mitigated',
      startedAt: '2026-03-27T07:10:00.000Z',
    },
  ],
  errorBudget: 91,
})

const seededState = (): PlatformStoreState => {
  const scopedMemberships = Object.values(memberships).flat()
  const uniqueScopes = new Map<string, ScopeContext>()

  for (const membership of scopedMemberships) {
    uniqueScopes.set(scopeKey(membership), {
      orgSlug: membership.orgSlug,
      workspaceSlug: membership.workspaceSlug,
      productSlug: membership.productSlug,
      environmentSlug: membership.environmentSlug,
    })
  }

  const scopes = [...uniqueScopes.values()]

  return {
    users,
    sessions: new Map(),
    feed: scopes.flatMap(seededFeed),
    notifications: scopes.flatMap(seededNotifications),
    threads: scopes.flatMap(seededThreads),
    jobs: scopes.flatMap(seededJobs),
    experiments: scopes.flatMap(seededExperiments),
    observability: Object.fromEntries(scopes.map((scope) => [scopeKey(scope), seededObservability(scope)])),
    presence: {},
  }
}

type Subscriber = (event: PlatformEvent) => void

class PlatformStore {
  private readonly state = seededState()

  private readonly subscribers = new Set<Subscriber>()

  getLoginOptions() {
    return this.state.users.map(({ id, name, email, summary }) => ({ id, name, email, summary }))
  }

  createSession(userId: string) {
    const user = this.state.users.find((entry) => entry.id === userId)
    if (!user || user.memberships.length === 0) {
      throw new Error('Unknown user.')
    }
    const sessionId = `session-${crypto.randomUUID()}`
    const [firstMembership] = user.memberships
    this.state.sessions.set(sessionId, {
      sessionId,
      userId,
      currentContext: {
        orgSlug: firstMembership.orgSlug,
        workspaceSlug: firstMembership.workspaceSlug,
        productSlug: firstMembership.productSlug,
        environmentSlug: firstMembership.environmentSlug,
      },
    })
    return sessionId
  }

  destroySession(sessionId?: string) {
    if (!sessionId) {
      return
    }
    const session = this.state.sessions.get(sessionId)
    if (!session) {
      return
    }
    this.updatePresence(session.userId, session.currentContext, false)
    this.state.sessions.delete(sessionId)
  }

  getSession(sessionId?: string | null): PlatformSession | null {
    if (!sessionId) {
      return null
    }
    const session = this.state.sessions.get(sessionId)
    if (!session) {
      return null
    }
    const user = this.state.users.find((entry) => entry.id === session.userId)
    if (!user) {
      return null
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      currentContext: session.currentContext,
      memberships: structuredClone(user.memberships),
    }
  }

  switchContext(sessionId: string, nextContext: ScopeContext) {
    const session = this.state.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found.')
    }
    this.requireMembership(session.userId, nextContext)
    this.updatePresence(session.userId, session.currentContext, false)
    session.currentContext = nextContext
    this.updatePresence(session.userId, nextContext, true)
  }

  listContexts(session: PlatformSession) {
    return session.memberships
  }

  getFeed(scope: ScopeContext) {
    return this.state.feed
      .filter((entry) => entry.scopeKey === scopeKey(scope))
      .toSorted((a: FeedItem, b: FeedItem) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  pinFeedNote(session: PlatformSession, feedId: string) {
    this.requireRole(session, session.currentContext, ['owner', 'admin', 'product_manager'])
    const feedItem = this.state.feed.find((entry) => entry.id === feedId)
    if (!feedItem) {
      throw new Error('Feed item not found.')
    }
    feedItem.pinned = !feedItem.pinned
    this.emit({ type: 'feed', payload: { ...feedItem } })
    return feedItem
  }

  getDashboard(scope: ScopeContext): DashboardState {
    const environment = scope.environmentSlug === 'production' ? 'Production' : 'Staging'
    return {
      metrics: [
        { id: 'mrr', label: 'Pipeline health', value: '98.2%', delta: '+1.4%' },
        { id: 'latency', label: `${environment} p95`, value: '184ms', delta: '-24ms' },
        { id: 'activation', label: 'Activation lift', value: '+6.1%', delta: '+0.7%' },
        { id: 'slo', label: 'Error budget', value: `${this.state.observability[scopeKey(scope)]?.errorBudget ?? 0}%`, delta: '-2%' },
      ],
      funnel: [
        { label: 'Visits', value: 94 },
        { label: 'Trials', value: 61 },
        { label: 'Activated', value: 48 },
        { label: 'Paid', value: 35 },
      ],
      releaseHealth: [
        { label: 'Canary', value: 92 },
        { label: 'Latency', value: 78 },
        { label: 'Stability', value: 88 },
        { label: 'Guardrails', value: 94 },
      ],
    }
  }

  getNotifications(session: PlatformSession, scope: ScopeContext) {
    return this.state.notifications
      .filter((entry) => entry.scopeKey === scopeKey(scope))
      .map((entry) => ({ ...entry, read: entry.readBy.includes(session.id) }))
  }

  acknowledgeNotification(session: PlatformSession, notificationId: string) {
    const notification = this.state.notifications.find((entry) => entry.id === notificationId)
    if (!notification) {
      throw new Error('Notification not found.')
    }
    if (!notification.readBy.includes(session.id)) {
      notification.readBy.push(session.id)
      this.emit({ type: 'notification', payload: { ...notification } })
    }
    return notification
  }

  getThreads(scope: ScopeContext) {
    return this.state.threads.filter((entry) => entry.scopeKey === scopeKey(scope))
  }

  addComment(session: PlatformSession, threadId: string, body: string) {
    this.requireRole(session, session.currentContext, ['owner', 'admin', 'product_manager', 'engineer'])
    const thread = this.state.threads.find((entry) => entry.id === threadId)
    if (!thread) {
      throw new Error('Thread not found.')
    }
    const comment: CollaborationComment = {
      id: `comment-${crypto.randomUUID()}`,
      author: session.name,
      body,
      createdAt: nowIso(),
    }
    thread.comments.push(comment)
    const feedItem: FeedItem = {
      id: `feed-${crypto.randomUUID()}`,
      scopeKey: thread.scopeKey,
      kind: 'note',
      title: 'New launch-room decision',
      body,
      actor: session.name,
      pinned: false,
      createdAt: nowIso(),
    }
    this.state.feed.unshift(feedItem)
    this.emit({ type: 'feed', payload: feedItem })
    return comment
  }

  getJobs(scope: ScopeContext) {
    return this.state.jobs.filter((entry) => entry.scopeKey === scopeKey(scope))
  }

  retryJob(session: PlatformSession, jobId: string) {
    this.requireRole(session, session.currentContext, ['owner', 'admin', 'engineer'])
    const job = this.state.jobs.find((entry) => entry.id === jobId)
    if (!job) {
      throw new Error('Job not found.')
    }
    job.status = 'retrying'
    job.retries += 1
    job.lastError = null
    job.lastRunAt = nowIso()
    job.nextRunAt = new Date(Date.now() + 60_000).toISOString()
    this.emit({ type: 'job', payload: { ...job } })
    return job
  }

  tickJobs() {
    for (const job of this.state.jobs) {
      if (job.status === 'retrying') {
        job.status = 'running'
        this.emit({ type: 'job', payload: { ...job } })
        continue
      }
      if (job.status === 'running') {
        job.status = 'completed'
        job.lastRunAt = nowIso()
        job.nextRunAt = new Date(Date.now() + 30 * 60_000).toISOString()
        const feedItem: FeedItem = {
          id: `feed-${crypto.randomUUID()}`,
          scopeKey: job.scopeKey,
          kind: 'job',
          title: `${job.name} completed cleanly`,
          body: 'The retry cleared the blocked backlog and restored queue health.',
          actor: 'Job runtime',
          pinned: false,
          createdAt: nowIso(),
        }
        const notification: NotificationItem = {
          id: `notification-${crypto.randomUUID()}`,
          scopeKey: job.scopeKey,
          title: `${job.name} recovered`,
          body: 'Background job status is healthy again after the retry.',
          kind: 'job',
          readBy: [],
          createdAt: nowIso(),
        }
        this.state.feed.unshift(feedItem)
        this.state.notifications.unshift(notification)
        this.emit({ type: 'feed', payload: feedItem })
        this.emit({ type: 'notification', payload: notification })
        this.emit({ type: 'job', payload: { ...job } })
      }
    }
  }

  getObservability(scope: ScopeContext) {
    return this.state.observability[scopeKey(scope)]
  }

  queryObservability(scope: ScopeContext, kind: 'alerts' | 'traces' | 'incidents') {
    const state = this.getObservability(scope)
    return state[kind]
  }

  getExperiments(scope: ScopeContext) {
    return this.state.experiments.filter((entry) => entry.scopeKey === scopeKey(scope))
  }

  rolloutExperiment(session: PlatformSession, experimentId: string) {
    this.requireRole(session, session.currentContext, ['owner', 'admin', 'product_manager'])
    const experiment = this.state.experiments.find((entry) => entry.id === experimentId)
    if (!experiment) {
      throw new Error('Experiment not found.')
    }
    experiment.status = 'running'
    const feedItem: FeedItem = {
      id: `feed-${crypto.randomUUID()}`,
      scopeKey: experiment.scopeKey,
      kind: 'experiment',
      title: `${experiment.name} rollout started`,
      body: 'Traffic ramp is active and guardrails are now being monitored live.',
      actor: session.name,
      pinned: false,
      createdAt: nowIso(),
    }
    const notification: NotificationItem = {
      id: `notification-${crypto.randomUUID()}`,
      scopeKey: experiment.scopeKey,
      title: `${experiment.name} running`,
      body: 'Rollout entered the running state for the active environment.',
      kind: 'experiment',
      readBy: [],
      createdAt: nowIso(),
    }
    this.state.feed.unshift(feedItem)
    this.state.notifications.unshift(notification)
    this.emit({ type: 'feed', payload: feedItem })
    this.emit({ type: 'notification', payload: notification })
    this.emit({ type: 'experiment', payload: { ...experiment } })
    return experiment
  }

  pauseExperiment(session: PlatformSession, experimentId: string) {
    this.requireRole(session, session.currentContext, ['owner', 'admin', 'product_manager'])
    const experiment = this.state.experiments.find((entry) => entry.id === experimentId)
    if (!experiment) {
      throw new Error('Experiment not found.')
    }
    experiment.status = 'paused'
    const feedItem: FeedItem = {
      id: `feed-${crypto.randomUUID()}`,
      scopeKey: experiment.scopeKey,
      kind: 'experiment',
      title: `${experiment.name} paused`,
      body: 'Rollout paused after a manual operator decision.',
      actor: session.name,
      pinned: false,
      createdAt: nowIso(),
    }
    this.state.feed.unshift(feedItem)
    this.emit({ type: 'feed', payload: feedItem })
    this.emit({ type: 'experiment', payload: { ...experiment } })
    return experiment
  }

  search(scope: ScopeContext, query: string) {
    const normalized = query.trim().toLowerCase()
    const documents = this.getSearchDocuments(scope)
    if (!normalized) {
      return documents
    }
    return documents.filter((entry) =>
      [entry.title, entry.snippet, entry.tags.join(' ')].join(' ').toLowerCase().includes(normalized),
    )
  }

  getSearchDocuments(scope: ScopeContext): SearchDocument[] {
    const contextKey = scopeKey(scope)
    const threads = this.getThreads(scope).map((thread) => ({
      id: thread.id,
      scopeKey: contextKey,
      type: 'thread' as const,
      title: thread.title,
      snippet: thread.comments.at(-1)?.body ?? '',
      href: `${buildHref(scope, 'collaboration')}#${thread.id}`,
      tags: ['collaboration', 'decision'],
    }))
    const jobs = this.getJobs(scope).map((job) => ({
      id: job.id,
      scopeKey: contextKey,
      type: 'job' as const,
      title: job.name,
      snippet: job.lastError ?? `${job.status} · ${job.owner}`,
      href: buildHref(scope, 'jobs'),
      tags: [job.status, job.owner],
    }))
    const experiments = this.getExperiments(scope).map((experiment) => ({
      id: experiment.id,
      scopeKey: contextKey,
      type: 'experiment' as const,
      title: experiment.name,
      snippet: `${experiment.metric} · ${experiment.status}`,
      href: buildHref(scope, 'experiments'),
      tags: [experiment.owner, experiment.metric],
    }))
    const incidents = this.getObservability(scope).incidents.map((incident) => ({
      id: incident.id,
      scopeKey: contextKey,
      type: 'incident' as const,
      title: incident.title,
      snippet: `${incident.status} since ${incident.startedAt}`,
      href: buildHref(scope, 'observability'),
      tags: ['incident', incident.status],
    }))
    const feed = this.getFeed(scope).map((entry: FeedItem) => ({
      id: entry.id,
      scopeKey: contextKey,
      type: 'feed' as const,
      title: entry.title,
      snippet: entry.body,
      href: buildHref(scope, 'feed'),
      tags: [entry.kind, entry.actor],
    }))

    return [...feed, ...jobs, ...incidents, ...experiments, ...threads]
  }

  getPresence(scope: ScopeContext) {
    return this.state.presence[scopeKey(scope)] ?? []
  }

  updatePresence(userId: string, scope: ScopeContext, online: boolean) {
    const key = scopeKey(scope)
    const current = new Set(this.state.presence[key] ?? [])
    if (online) {
      current.add(userId)
    } else {
      current.delete(userId)
    }
    this.state.presence[key] = [...current]
    this.emit({ type: 'presence', payload: { scopeKey: key, activeUsers: this.state.presence[key] } })
  }

  subscribe(listener: Subscriber) {
    this.subscribers.add(listener)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  private emit(event: PlatformEvent) {
    for (const subscriber of this.subscribers) {
      subscriber(event)
    }
  }

  private requireMembership(userId: string, scope: ScopeContext) {
    const user = this.state.users.find((entry) => entry.id === userId)
    const membership = user?.memberships.find((entry) => scopeKey(entry) === scopeKey(scope))
    if (!membership) {
      throw new Error('Scope not permitted.')
    }
    return membership
  }

  private requireRole(
    session: PlatformSession,
    scope: ScopeContext,
    allowedRoles: PlatformSession['memberships'][number]['role'][],
  ) {
    const membership = session.memberships.find((entry) => scopeKey(entry) === scopeKey(scope))
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new Error('Action not permitted.')
    }
  }
}

const globalStore = globalThis as typeof globalThis & { __atlasPlatformStore?: PlatformStore }
export const platformStore = globalStore.__atlasPlatformStore ?? new PlatformStore()
if (!globalStore.__atlasPlatformStore) {
  globalStore.__atlasPlatformStore = platformStore
}

export const getLoginOptions = () => platformStore.getLoginOptions()
