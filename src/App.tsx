import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { ChannelPage } from './components/ChannelPage.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import { useBootstrapQuery, useSessionQuery } from './chat/hooks.ts'
import { ChatRealtimeProvider } from './chat/socket.tsx'

const LoadingScreen = ({ label }: { label: string }) => (
  <main className="login-shell">
    <section className="login-card">
      <h1>{label}</h1>
    </section>
  </main>
)

const RootRedirect = () => {
  const sessionQuery = useSessionQuery()
  const bootstrapQuery = useBootstrapQuery(Boolean(sessionQuery.data))

  if (sessionQuery.isPending) {
    return <LoadingScreen label="Checking session" />
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" replace />
  }

  if (bootstrapQuery.isPending) {
    return <LoadingScreen label="Loading channels" />
  }

  if (!bootstrapQuery.data) {
    return <LoadingScreen label="Workspace unavailable" />
  }

  return <Navigate to={`/channels/${bootstrapQuery.data.defaultChannelId}`} replace />
}

const ProtectedRoute = () => {
  const sessionQuery = useSessionQuery()
  const { channelId = '' } = useParams()

  if (sessionQuery.isPending) {
    return <LoadingScreen label="Checking session" />
  }

  if (!sessionQuery.data) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell activeChannelId={channelId}>
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
  const sessionQuery = useSessionQuery()

  return (
    <ChatRealtimeProvider userId={sessionQuery.data?.id ?? null}>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<RootRedirect />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/channels/:channelId" element={<ChannelPage />} />
        </Route>
      </Routes>
    </ChatRealtimeProvider>
  )
}

export default App
