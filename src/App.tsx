/* @jsxRuntime automatic */
import { Navigate, Route, Routes } from 'react-router-dom'
import { PlatformProvider, usePlatform } from './platform/client.tsx'
import type { AppState } from './platform/state.ts'
import {
  AccessDenied,
  AuditPage,
  BillingPage,
  DashboardRedirect,
  FlagsPage,
  MembersPage,
  OrganizationRedirect,
  OverviewPage,
  PlatformLayout,
  PluginsPage,
} from './components/SaasPages.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import { getDefaultModulePath } from './platform/access.ts'

const LoginRoute = () => {
  const { state } = usePlatform()

  if (state.session && state.bootstrap.currentOrganization) {
    const membership = state.session.memberships.find(
      (entry) => entry.orgId === state.bootstrap.currentOrganization?.id,
    )
    if (membership) {
      return <Navigate replace to={getDefaultModulePath(membership.role, state.bootstrap.currentOrganization)} />
    }
  }

  return <LoginPage />
}

export const App = ({ initialState }: { initialState: AppState }) => (
  <PlatformProvider initialState={initialState}>
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<PlatformLayout />}>
        <Route path="/" element={<DashboardRedirect />} />
        <Route path="/orgs/:orgId" element={<OrganizationRedirect />} />
        <Route path="/orgs/:orgId/overview" element={<OverviewPage />} />
        <Route path="/orgs/:orgId/members" element={<MembersPage />} />
        <Route path="/orgs/:orgId/billing" element={<BillingPage />} />
        <Route path="/orgs/:orgId/flags" element={<FlagsPage />} />
        <Route path="/orgs/:orgId/audit" element={<AuditPage />} />
        <Route path="/orgs/:orgId/plugins" element={<PluginsPage />} />
        <Route path="/forbidden" element={<AccessDenied />} />
      </Route>
    </Routes>
  </PlatformProvider>
)

export default App
