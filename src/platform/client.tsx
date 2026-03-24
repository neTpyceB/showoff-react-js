/* @jsxRuntime automatic */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { platformApi } from './api.ts'
import type { AppState } from './state.ts'

type PlatformContextValue = {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  refreshBootstrap: () => Promise<void>
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export const PlatformProvider = ({
  children,
  initialState,
}: {
  children: ReactNode
  initialState: AppState
}) => {
  const [state, setState] = useState(initialState)

  const refreshBootstrap = useCallback(async () => {
    const bootstrap = await platformApi.getBootstrap()
    setState((current) => ({
      ...current,
      bootstrap,
      session: bootstrap.session,
      routeError: null,
    }))
  }, [])

  const login = useCallback(async (userId: string) => {
    const session = await platformApi.login(userId)
    const bootstrap = await platformApi.getBootstrap()
    setState((current) => ({
      ...current,
      session,
      bootstrap,
      routeError: null,
    }))
  }, [])

  const logout = useCallback(async () => {
    await platformApi.logout()
    const bootstrap = await platformApi.getBootstrap()
    setState((current) => ({
      ...current,
      session: null,
      bootstrap,
      overview: null,
      members: [],
      billing: null,
      featureFlags: [],
      auditEntries: [],
      plugins: [],
      routeError: null,
    }))
  }, [])

  const switchOrganization = useCallback(async (orgId: string) => {
    const session = await platformApi.switchOrganization(orgId)
    const bootstrap = await platformApi.getBootstrap()
    setState((current) => ({
      ...current,
      session,
      bootstrap,
      overview: null,
      members: [],
      billing: null,
      featureFlags: [],
      auditEntries: [],
      plugins: [],
      routeError: null,
    }))
  }, [])

  return (
    <PlatformContext.Provider value={{ state, setState, refreshBootstrap, login, logout, switchOrganization }}>
      {children}
    </PlatformContext.Provider>
  )
}

export const usePlatform = () => {
  const context = useContext(PlatformContext)

  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider.')
  }

  return context
}
