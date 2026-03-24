/* @jsxRuntime automatic */
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from './Button.tsx'
import { usePlatform } from '../platform/client.tsx'
import { getAuthorizedModules, getDefaultModulePath, getModulePath, moduleRegistry } from '../platform/access.ts'
import { platformApi } from '../platform/api.ts'
import { formatMoney, roleLabels, type BillingPlan, type ModuleId, type OrganizationMember } from '../platform/model.ts'
import { useToast } from './ToastProvider.tsx'

const NavItem = ({ to, children }: { to: string; children: string }) => {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link className={`shell-link${active ? ' active' : ''}`} to={to}>
      {children}
    </Link>
  )
}

const ShellHeader = () => {
  const { state, switchOrganization, logout } = usePlatform()
  const navigate = useNavigate()
  const currentOrg = state.bootstrap.currentOrganization

  if (!state.session || !currentOrg) {
    return null
  }

  const currentMembership = state.session.memberships.find((membership) => membership.orgId === currentOrg.id)

  return (
    <header className="shell-topbar">
      <div className="brand-block">
        <span className="brand-mark">N</span>
        <div>
          <strong>Northstar Admin</strong>
          <small>Multi-tenant SaaS control plane</small>
        </div>
      </div>

      <div className="topbar-meta">
        <label className="org-switcher">
          <span>Organization</span>
          <select
            aria-label="Organization switcher"
            value={currentOrg.id}
            onChange={async (event) => {
              const nextOrgId = event.currentTarget.value
              await switchOrganization(nextOrgId)
              navigate(getDefaultModulePath(
                state.session!.memberships.find((membership) => membership.orgId === nextOrgId)?.role ?? 'viewer',
                state.bootstrap.organizations.find((organization) => organization.id === nextOrgId)!,
              ))
            }}
          >
            {state.session.memberships.map((membership) => (
              <option key={membership.orgId} value={membership.orgId}>
                {membership.orgName}
              </option>
            ))}
          </select>
        </label>

        <div className="pill-group">
          <span className="info-pill">{currentOrg.plan}</span>
          <span className="info-pill">{currentMembership ? roleLabels[currentMembership.role] : 'No role'}</span>
        </div>

        <Button
          variant="ghost"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
        >
          Sign out
        </Button>
      </div>
    </header>
  )
}

const ShellNav = () => {
  const { state } = usePlatform()
  const currentOrg = state.bootstrap.currentOrganization

  if (!state.session || !currentOrg) {
    return null
  }

  const currentMembership = state.session.memberships.find((membership) => membership.orgId === currentOrg.id)
  const modules = currentMembership ? getAuthorizedModules(currentMembership.role, currentOrg) : []

  return (
    <aside className="shell-sidebar">
      <section className="sidebar-section">
        <p className="eyebrow">Workspace</p>
        <h1>{currentOrg.name}</h1>
        <p className="muted-copy">
          {currentOrg.usedSeats}/{currentOrg.seatLimit} seats in use. Renewal {new Date(currentOrg.renewalAt).toLocaleDateString()}.
        </p>
      </section>

      <nav className="shell-nav" aria-label="Admin modules">
        {modules.map((module) => (
          <NavItem key={module.id} to={getModulePath(currentOrg.id, module.id)}>
            {module.label}
          </NavItem>
        ))}
      </nav>

      <section className="sidebar-section">
        <p className="eyebrow">Flags</p>
        <ul className="compact-list">
          {Object.entries(currentOrg.featureFlags).map(([key, enabled]) => (
            <li key={key}>
              <span>{key}</span>
              <strong>{enabled ? 'On' : 'Off'}</strong>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

export const PlatformLayout = () => {
  const { state } = usePlatform()

  return (
    <div className="shell">
      <ShellHeader />
      <div className="shell-body">
        <ShellNav />
        <main className="shell-main">
          {state.routeError ? <AccessDenied /> : <Outlet />}
        </main>
      </div>
    </div>
  )
}

export const DashboardRedirect = () => {
  const { state } = usePlatform()
  const currentOrg = state.bootstrap.currentOrganization

  if (!state.session || !currentOrg) {
    return <Navigate replace to="/login" />
  }

  const currentMembership = state.session.memberships.find((membership) => membership.orgId === currentOrg.id)

  if (!currentMembership) {
    return <AccessDenied />
  }

  return <Navigate replace to={getDefaultModulePath(currentMembership.role, currentOrg)} />
}

export const OrganizationRedirect = () => {
  const { orgId = '' } = useParams()
  const { state } = usePlatform()
  const organization = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  if (!state.session || !organization || !membership) {
    return <AccessDenied />
  }

  return <Navigate replace to={getDefaultModulePath(membership.role, organization)} />
}

const PageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) => (
  <header className="page-header">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="muted-copy">{description}</p>
    </div>
    {action}
  </header>
)

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
)

const ensureRouteAccess = (pathname: string, modules: ModuleId[]) => {
  const match = moduleRegistry.find((module) => pathname.endsWith(module.path) || (module.path === '' && /^\/orgs\/[^/]+$/.test(pathname)))
  return match ? modules.includes(match.id) : true
}

export const OverviewPage = () => {
  const { state, setState } = usePlatform()
  const { orgId = '' } = useParams()
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg) {
        return
      }

      const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)
      if (!membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const overview = await platformApi.getOverview(orgId)
      setState((current) => ({ ...current, overview, routeError: null }))
    }

    void run()
  }, [currentOrg, orgId, setState, state.session])

  if (!currentOrg || !state.overview) {
    return <LoadingState label="Loading overview" />
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Control plane"
        title={`${currentOrg.name} overview`}
        description="Core tenant health, usage, and platform posture at a glance."
      />
      <div className="metrics-grid">
        <SummaryCard label="Active users" value={String(state.overview.activeUsers)} />
        <SummaryCard label="Automation runs" value={String(state.overview.automationRuns)} />
        <SummaryCard label="API requests" value={state.overview.apiRequests.toLocaleString()} />
        <SummaryCard label="Open incidents" value={String(state.overview.openIncidents)} />
      </div>

      <section className="surface-grid two-up">
        <article className="surface-card">
          <h3>Billing posture</h3>
          <p>{currentOrg.plan} plan · {currentOrg.billingStatus.replace('_', ' ')}</p>
          <p>{formatMoney(currentOrg.monthlySpendCents)} monthly run rate.</p>
        </article>
        <article className="surface-card">
          <h3>Storage footprint</h3>
          <p>{state.overview.storageUsedGb} GB retained across audit, workflow, and usage data.</p>
          <p>Use feature flags and plugin modules to keep each tenant boundary explicit.</p>
        </article>
      </section>
    </section>
  )
}

const roleChoices: OrganizationMember['role'][] = ['owner', 'admin', 'manager', 'member', 'viewer']

export const MembersPage = () => {
  const { orgId = '' } = useParams()
  const { state, setState, refreshBootstrap } = usePlatform()
  const { pushToast } = useToast()
  const [pending, setPending] = useState<string | null>(null)
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg || !membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}/members`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const members = await platformApi.getMembers(orgId)
      setState((current) => ({ ...current, members, routeError: null }))
    }

    void run()
  }, [currentOrg, membership, orgId, setState])

  if (!currentOrg) {
    return <LoadingState label="Loading members" />
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Access control"
        title="Members and roles"
        description="Every change is tenant-scoped and written into immutable audit history."
      />
      <div className="surface-card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Last active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {state.members.map((member) => (
              <tr key={member.userId}>
                <td>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </td>
                <td>
                  <select
                    aria-label={`Role for ${member.name}`}
                    defaultValue={member.role}
                    disabled={membership?.role === 'manager'}
                    onChange={(event) => {
                      const nextRole = event.currentTarget.value as OrganizationMember['role']
                      setState((current) => ({
                        ...current,
                        members: current.members.map((entry) =>
                          entry.userId === member.userId
                            ? { ...entry, role: nextRole }
                            : entry,
                        ),
                      }))
                    }}
                  >
                    {roleChoices.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(member.lastActiveAt).toLocaleString()}</td>
                <td>
                  <Button
                    busy={pending === member.userId}
                    disabled={membership?.role === 'manager'}
                    onClick={async () => {
                      const nextRole = state.members.find((entry) => entry.userId === member.userId)?.role ?? member.role
                      setPending(member.userId)
                      const updated = await platformApi.updateMemberRole(orgId, member.userId, nextRole)
                      setState((current) => ({
                        ...current,
                        members: current.members.map((entry) => (entry.userId === updated.userId ? updated : entry)),
                      }))
                      await refreshBootstrap()
                      pushToast({
                        title: 'Role updated',
                        description: `${updated.name} is now ${roleLabels[updated.role]}.`,
                        tone: 'success',
                      })
                      setPending(null)
                    }}
                  >
                    Save role
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export const BillingPage = () => {
  const { orgId = '' } = useParams()
  const { state, setState, refreshBootstrap } = usePlatform()
  const { pushToast } = useToast()
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg || !membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}/billing`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const billing = await platformApi.getBilling(orgId)
      setState((current) => ({ ...current, billing, routeError: null }))
    }

    void run()
  }, [currentOrg, membership, orgId, setState])

  if (!state.billing) {
    return <LoadingState label="Loading billing" />
  }

  const plans: BillingPlan[] = ['starter', 'growth', 'enterprise']

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Revenue controls"
        title="Billing and entitlements"
        description="Plans own the baseline entitlement envelope, then feature flags refine rollout."
      />
      <div className="surface-grid two-up">
        <article className="surface-card">
          <h3>Current subscription</h3>
          <p>{state.billing.plan} plan · {state.billing.billingStatus.replace('_', ' ')}</p>
          <p>{formatMoney(state.billing.monthlySpendCents)} monthly, renewing {new Date(state.billing.renewalAt).toLocaleDateString()}.</p>
          <p>{state.billing.usedSeats}/{state.billing.seatLimit} seats in use.</p>
        </article>
        <article className="surface-card">
          <h3>Entitlements</h3>
          <ul className="list-block">
            {state.billing.entitlements.map((entitlement) => (
              <li key={entitlement}>{entitlement}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="surface-card action-row">
        {plans.map((plan) => (
          <Button
            key={plan}
            variant={plan === state.billing?.plan ? 'secondary' : 'primary'}
            onClick={async () => {
              const billing = await platformApi.updateBillingPlan(orgId, plan)
              setState((current) => ({ ...current, billing }))
              await refreshBootstrap()
              pushToast({
                title: 'Plan updated',
                description: `${currentOrg?.name} is now on the ${plan} plan.`,
                tone: 'success',
              })
            }}
          >
            Set {plan}
          </Button>
        ))}
      </div>
    </section>
  )
}

export const FlagsPage = () => {
  const { orgId = '' } = useParams()
  const { state, setState, refreshBootstrap } = usePlatform()
  const { pushToast } = useToast()
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg || !membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}/flags`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const featureFlags = await platformApi.getFlags(orgId)
      setState((current) => ({ ...current, featureFlags, routeError: null }))
    }

    void run()
  }, [currentOrg, membership, orgId, setState])

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Rollout controls"
        title="Feature flags"
        description="Flags apply inside the tenant boundary and are still constrained by plan entitlements."
      />
      <div className="surface-grid">
        {state.featureFlags.map((flag) => (
          <article key={flag.key} className="surface-card feature-card">
            <div>
              <h3>{flag.label}</h3>
              <p>{flag.description}</p>
            </div>
            <Button
              variant={flag.enabled ? 'secondary' : 'primary'}
              onClick={async () => {
                const updated = await platformApi.updateFlag(orgId, flag.key, !flag.enabled)
                setState((current) => ({
                  ...current,
                  featureFlags: current.featureFlags.map((entry) => (entry.key === updated.key ? updated : entry)),
                }))
                await refreshBootstrap()
                pushToast({
                  title: 'Flag updated',
                  description: `${updated.label} is now ${updated.enabled ? 'enabled' : 'disabled'}.`,
                  tone: 'success',
                })
              }}
            >
              {flag.enabled ? 'Disable' : 'Enable'}
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

export const AuditPage = () => {
  const { orgId = '' } = useParams()
  const { state, setState } = usePlatform()
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg || !membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}/audit`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const auditEntries = await platformApi.getAudit(orgId)
      setState((current) => ({ ...current, auditEntries, routeError: null }))
    }

    void run()
  }, [currentOrg, membership, orgId, setState])

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Auditability"
        title="Audit log"
        description="All mutating admin actions are written as immutable tenant-scoped events."
      />
      <div className="surface-card table-card">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {state.auditEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.actorName}</td>
                <td>{entry.action}</td>
                <td>
                  <strong>{entry.target}</strong>
                  <small>{entry.detail}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export const PluginsPage = () => {
  const { orgId = '' } = useParams()
  const { state, setState, refreshBootstrap } = usePlatform()
  const { pushToast } = useToast()
  const currentOrg = state.bootstrap.organizations.find((entry) => entry.id === orgId)
  const membership = state.session?.memberships.find((entry) => entry.orgId === orgId)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg || !membership) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not belong to this organization.' } }))
        return
      }

      const modules = getAuthorizedModules(membership.role, currentOrg).map((module) => module.id)
      if (!ensureRouteAccess(`/orgs/${orgId}/plugins`, modules)) {
        setState((current) => ({ ...current, routeError: { status: 403, message: 'You do not have access to this module.' } }))
        return
      }

      const plugins = await platformApi.getPlugins(orgId)
      setState((current) => ({ ...current, plugins, routeError: null }))
    }

    void run()
  }, [currentOrg, membership, orgId, setState])

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Registry"
        title="Internal modules"
        description="This registry keeps module ownership explicit without pretending to be a marketplace."
      />
      <div className="surface-grid">
        {state.plugins.map((plugin) => (
          <article key={plugin.id} className="surface-card feature-card">
            <div>
              <div className="inline-row">
                <h3>{plugin.name}</h3>
                <span className="info-pill">{plugin.status}</span>
              </div>
              <p>{plugin.description}</p>
              <small>Version {plugin.version}</small>
            </div>
            <Button
              variant={plugin.enabled ? 'secondary' : 'primary'}
              onClick={async () => {
                const updated = await platformApi.updatePlugin(orgId, plugin.id, !plugin.enabled)
                setState((current) => ({
                  ...current,
                  plugins: current.plugins.map((entry) => (entry.id === updated.id ? updated : entry)),
                }))
                await refreshBootstrap()
                pushToast({
                  title: 'Plugin updated',
                  description: `${updated.name} is now ${updated.enabled ? 'enabled' : 'disabled'}.`,
                  tone: 'success',
                })
              }}
            >
              {plugin.enabled ? 'Disable' : 'Enable'}
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

export const AccessDenied = () => (
  <section className="state-card">
    <p className="eyebrow">403</p>
    <h2>Access denied</h2>
    <p className="muted-copy">
      This route exists, but your current organization, role, plan, or feature flags do not permit it.
    </p>
    <Link className="button button-primary button-md" to="/">
      Return to workspace
    </Link>
  </section>
)

export const LoadingState = ({ label }: { label: string }) => (
  <section className="state-card">
    <h2>{label}</h2>
  </section>
)
