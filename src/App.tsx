import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { BoardPage } from './components/BoardPage.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import { useSessionQuery, useSpacesQuery } from './kanban/hooks.ts'

const LoadingScreen = ({ label }: { label: string }) => (
  <main className="login-shell">
    <section className="login-card">
      <h1>{label}</h1>
    </section>
  </main>
)

const RootRedirect = () => {
  const sessionQuery = useSessionQuery()
  const spacesQuery = useSpacesQuery(sessionQuery.data?.id)

  if (sessionQuery.isPending) {
    return <LoadingScreen label="Checking session" />
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" replace />
  }

  if (spacesQuery.isPending) {
    return <LoadingScreen label="Loading team spaces" />
  }

  const firstSpace = spacesQuery.data?.[0]

  if (!firstSpace) {
    return <LoadingScreen label="No accessible spaces found" />
  }

  return <Navigate to={`/spaces/${firstSpace.id}`} replace />
}

const ProtectedRoute = () => {
  const sessionQuery = useSessionQuery()
  const { spaceId = '' } = useParams()

  if (sessionQuery.isPending) {
    return <LoadingScreen label="Checking session" />
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell activeSpaceId={spaceId}>
      <Outlet />
    </AppShell>
  )
}

const LoginRoute = () => {
  const sessionQuery = useSessionQuery()

  if (sessionQuery.isPending) {
    return <LoadingScreen label="Checking session" />
  }

  if (sessionQuery.data) {
    return <Navigate to="/" replace />
  }

  return <LoginPage />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<RootRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/spaces/:spaceId" element={<BoardPage />} />
      </Route>
    </Routes>
  )
}

export default App
