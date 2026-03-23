/* @jsxRuntime automatic */
import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from './model.ts'
import { commerceApi } from './api.ts'
import type { AppState } from './state.ts'

type CommerceContextValue = {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  refreshCart: () => Promise<void>
  refreshAccount: () => Promise<void>
  refreshAdmin: () => Promise<void>
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
  recordEvent: (type: string, detail: Record<string, string>) => void
}

const CommerceContext = createContext<CommerceContextValue | null>(null)

export const CommerceProvider = ({
  children,
  initialState,
}: {
  children: ReactNode
  initialState: AppState
}) => {
  const [state, setState] = useState(initialState)

  const refreshCart = useCallback(async () => {
    const cart = await commerceApi.getCart()
    setState((current) => ({
      ...current,
      cart,
      bootstrap: {
        ...current.bootstrap,
        cart,
      },
    }))
  }, [])

  const refreshAccount = useCallback(async () => {
    if (!state.session || state.session.role !== 'customer') {
      return
    }

    const [orders, profile] = await Promise.all([
      commerceApi.getAccountOrders(),
      commerceApi.getAccountProfile(),
    ])
    setState((current) => ({
      ...current,
      accountOrders: orders,
      profile: {
        user: current.session!,
        savedAddresses: profile.savedAddresses,
      },
    }))
  }, [state.session])

  const refreshAdmin = useCallback(async () => {
    if (!state.session || state.session.role !== 'admin') {
      return
    }

    const [adminSummary, adminProducts, adminOrders, inventory, promotions, customers] =
      await Promise.all([
        commerceApi.getAdminSummary(),
        commerceApi.getAdminProducts(),
        commerceApi.getAdminOrders(),
        commerceApi.getInventory(),
        commerceApi.getPromotions(),
        commerceApi.getCustomers(),
      ])

    setState((current) => ({
      ...current,
      adminSummary,
      adminProducts,
      adminOrders,
      inventory,
      promotions,
      customers,
    }))
  }, [state.session])

  const login = useCallback(async (userId: string) => {
    const session = await commerceApi.login(userId)
    const cart = await commerceApi.getCart()
    setState((current) => ({
      ...current,
      session,
      cart,
      bootstrap: {
        ...current.bootstrap,
        session,
        cart,
      },
    }))
  }, [])

  const logout = useCallback(async () => {
    await commerceApi.logout()
    setState((current) => ({
      ...current,
      session: null,
      cart: {
        lines: [],
        promoCode: null,
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        totalCents: 0,
        itemCount: 0,
      },
      accountOrders: [],
      profile: null,
      adminSummary: null,
      adminProducts: [],
      adminOrders: [],
      inventory: [],
      promotions: current.promotions,
      customers: [],
      lastOrder: null,
      bootstrap: {
        ...current.bootstrap,
        session: null,
        cart: {
          lines: [],
          promoCode: null,
          subtotalCents: 0,
          discountCents: 0,
          shippingCents: 0,
          totalCents: 0,
          itemCount: 0,
        },
      },
    }))
  }, [])

  const recordEvent = useCallback((type: string, detail: Record<string, string>) => {
    void commerceApi.track(type, detail).catch(() => undefined)
  }, [])

  return (
    <CommerceContext.Provider
      value={{
        state,
        setState,
        refreshCart,
        refreshAccount,
        refreshAdmin,
        login,
        logout,
        recordEvent,
      }}
    >
      {children}
    </CommerceContext.Provider>
  )
}

export const useCommerce = () => {
  const context = useContext(CommerceContext)

  if (!context) {
    throw new Error('useCommerce must be used within CommerceProvider.')
  }

  return context
}

export const resolveProductPrice = (product: Product) => product.variants[0]?.priceCents ?? 0
