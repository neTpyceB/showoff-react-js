export type Locale = 'en' | 'de'

export type PlatformRole =
  | 'owner'
  | 'admin'
  | 'product_manager'
  | 'engineer'
  | 'analyst'
  | 'viewer'

export type ScopeContext = {
  orgSlug: string
  workspaceSlug: string
  productSlug: string
  environmentSlug: string
}

export type Membership = ScopeContext & {
  orgName: string
  workspaceName: string
  productName: string
  environmentName: string
  environmentRisk: 'low' | 'medium' | 'high'
  role: PlatformRole
}

export type PlatformSession = {
  id: string
  name: string
  email: string
  currentContext: ScopeContext
  memberships: Membership[]
}

export type LoginOption = {
  id: string
  name: string
  email: string
  summary: Record<Locale, string>
}

export type FeedItem = {
  id: string
  scopeKey: string
  kind: 'launch' | 'incident' | 'experiment' | 'job' | 'note'
  title: string
  body: string
  actor: string
  pinned: boolean
  createdAt: string
}

export type NotificationItem = {
  id: string
  scopeKey: string
  title: string
  body: string
  kind: 'mention' | 'incident' | 'job' | 'experiment'
  readBy: string[]
  createdAt: string
}

export type DashboardMetric = {
  id: string
  label: string
  value: string
  delta: string
}

export type DashboardSeriesPoint = {
  label: string
  value: number
}

export type DashboardState = {
  metrics: DashboardMetric[]
  funnel: DashboardSeriesPoint[]
  releaseHealth: DashboardSeriesPoint[]
}

export type SearchDocument = {
  id: string
  scopeKey: string
  type: 'feed' | 'job' | 'incident' | 'experiment' | 'thread'
  title: string
  snippet: string
  href: string
  tags: string[]
}

export type CollaborationComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type CollaborationThread = {
  id: string
  scopeKey: string
  title: string
  comments: CollaborationComment[]
}

export type JobStatus = 'queued' | 'running' | 'failed' | 'retrying' | 'completed'

export type Job = {
  id: string
  scopeKey: string
  name: string
  owner: string
  status: JobStatus
  schedule: string
  lastRunAt: string
  nextRunAt: string
  retries: number
  maxRetries: number
  lastError: string | null
}

export type Alert = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  createdAt: string
}

export type TraceSummary = {
  id: string
  operation: string
  latencyMs: number
  status: 'healthy' | 'degraded'
}

export type Incident = {
  id: string
  title: string
  status: 'investigating' | 'mitigated' | 'resolved'
  startedAt: string
}

export type ObservabilityState = {
  alerts: Alert[]
  traces: TraceSummary[]
  incidents: Incident[]
  errorBudget: number
}

export type Experiment = {
  id: string
  scopeKey: string
  name: string
  status: 'draft' | 'running' | 'paused'
  owner: string
  metric: string
  guardrail: string
  winner: string | null
}

export type PlatformEvent =
  | { type: 'notification'; payload: NotificationItem }
  | { type: 'feed'; payload: FeedItem }
  | { type: 'presence'; payload: { scopeKey: string; activeUsers: string[] } }
  | { type: 'job'; payload: Job }
  | { type: 'experiment'; payload: Experiment }

export type PresenceSnapshot = Record<string, string[]>
