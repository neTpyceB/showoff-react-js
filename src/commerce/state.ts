import type {
  AdminCustomer,
  AdminSummary,
  CatalogResponse,
  CartSummary,
  CommerceBootstrap,
  Order,
  ProductResponse,
  Promotion,
  SessionUser,
} from './model.ts'

export type SeoMeta = {
  title: string
  description: string
  canonicalPath: string
  structuredData?: Record<string, unknown>
}

export type AppState = {
  session: SessionUser | null
  bootstrap: CommerceBootstrap
  catalog: CatalogResponse | null
  product: ProductResponse | null
  cart: CartSummary
  accountOrders: Order[]
  profile: {
    user: SessionUser
    savedAddresses: Order['address'][]
  } | null
  adminSummary: AdminSummary | null
  adminProducts: import('./model.ts').Product[]
  adminOrders: Order[]
  inventory: Array<{
    sku: string
    productName: string
    label: string
    inventory: number
  }>
  promotions: Promotion[]
  customers: AdminCustomer[]
  lastOrder: Order | null
  seo: SeoMeta
}

export const createEmptyAppState = (): AppState => ({
  session: null,
  bootstrap: {
    session: null,
    featured: [],
    categories: [],
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
  catalog: null,
  product: null,
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
  promotions: [],
  customers: [],
  lastOrder: null,
  seo: {
    title: 'Showoff Electronics',
    description: 'Premium electronics storefront with catalog, cart, checkout, account, and admin.',
    canonicalPath: '/',
  },
})
