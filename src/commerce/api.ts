import {
  addCartItemSchema,
  catalogResponseSchema,
  checkoutSessionSchema,
  loginRequestSchema,
  orderSchema,
  productResponseSchema,
  sessionSchema,
  type AdminCustomer,
  type AdminSummary,
  type CartSummary,
  type CatalogQuery,
  type CatalogResponse,
  type CheckoutSession,
  type Order,
  type Product,
  type ProductResponse,
  type Promotion,
  type SessionUser,
} from './model.ts'

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({ message: 'Request failed.' }))) as { message?: string }
    throw new Error(body.message ?? 'Request failed.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

const request = async <T>(input: RequestInfo, init?: RequestInit) =>
  readJson<T>(
    await fetch(input, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    }),
  )

const catalogSearchParams = (query: Partial<CatalogQuery>) => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === 'all') {
      continue
    }

    params.set(key, String(value))
  }

  return params.toString()
}

export const commerceApi = {
  getSession: async () => sessionSchema.nullable().parse(await request<SessionUser | null>('/api/session')),
  login: async (userId: string) =>
    sessionSchema.parse(
      await request<SessionUser>('/api/session/login', {
        method: 'POST',
        body: JSON.stringify(loginRequestSchema.parse({ userId })),
      }),
    ),
  logout: async () =>
    request<void>('/api/session/logout', {
      method: 'POST',
    }),
  getCatalog: async (query: Partial<CatalogQuery>) =>
    catalogResponseSchema.parse(
      await request<CatalogResponse>(`/api/catalog?${catalogSearchParams(query)}`),
    ),
  search: async (query: Partial<CatalogQuery>) =>
    catalogResponseSchema.parse(await request<CatalogResponse>(`/api/search?${catalogSearchParams(query)}`)),
  getProduct: async (slug: string) =>
    productResponseSchema.parse(await request<ProductResponse>(`/api/products/${slug}`)),
  getCart: async () => request<CartSummary>('/api/cart'),
  addCartItem: async (input: { productId: string; variantId: string; quantity: number }) =>
    request<CartSummary>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify(addCartItemSchema.parse(input)),
    }),
  updateCartItem: async (itemId: string, quantity: number) =>
    request<CartSummary>(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: async (itemId: string) =>
    request<CartSummary>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
    }),
  applyPromo: async (code: string) =>
    request<CartSummary>('/api/cart/promo', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  createCheckoutSession: async (payload: {
    address: Order['address']
    shippingMethod: 'standard' | 'priority'
  }) =>
    checkoutSessionSchema.parse(
      await request<CheckoutSession>('/api/checkout/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    ),
  getAccountOrders: async () => request<Order[]>('/api/account/orders'),
  getAccountProfile: async () =>
    request<{
      id: string
      name: string
      email: string
      role: 'customer'
      savedAddresses: Order['address'][]
    }>('/api/account/profile'),
  getAdminSummary: async () => request<AdminSummary>('/api/admin/summary'),
  getAdminProducts: async () => request<Product[]>('/api/admin/products'),
  updateProduct: async (productId: string, payload: { badge: string; featured: boolean }) =>
    request<Product>(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getAdminOrders: async () => request<Order[]>('/api/admin/orders'),
  updateOrder: async (orderId: string, status: Order['status']) =>
    orderSchema.parse(
      await request<Order>(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    ),
  getInventory: async () =>
    request<Array<{ sku: string; productName: string; label: string; inventory: number }>>(
      '/api/admin/inventory',
    ),
  updateInventory: async (sku: string, inventory: number) =>
    request<{ sku: string; inventory: number }>(`/api/admin/inventory/${sku}`, {
      method: 'PATCH',
      body: JSON.stringify({ inventory }),
    }),
  getPromotions: async () => request<Promotion[]>('/api/admin/promotions'),
  createPromotion: async (payload: {
    code: string
    label: string
    type: Promotion['type']
    amount: number
  }) =>
    request<Promotion>('/api/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCustomers: async () => request<AdminCustomer[]>('/api/admin/customers'),
  track: async (type: string, detail: Record<string, string>) =>
    request('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ type, detail }),
    }),
}
