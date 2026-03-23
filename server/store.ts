import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildCartSummary,
  filterProducts,
  getDefaultVariant,
  getVariant,
} from '../src/commerce/catalog.ts'
import type {
  AdminCustomer,
  AdminSummary,
  AnalyticsEvent,
  CatalogQuery,
  CatalogResponse,
  CartItem,
  CartSummary,
  CheckoutSession,
  CommerceBootstrap,
  Order,
  OrderStatus,
  Product,
  ProductResponse,
  Promotion,
  SessionUser,
} from '../src/commerce/model.ts'

type Address = Order['address']

type SessionRecord = {
  sessionId: string
  userId: string
}

type CustomerRecord = SessionUser & {
  savedAddresses: Address[]
}

type StoredCheckoutSession = {
  sessionId: string
  customerId: string
  address: Address
  shippingMethod: 'standard' | 'priority'
  createdAt: string
}

const nowIso = () => new Date().toISOString()

const products: Product[] = [
  {
    id: 'p-orbit-pro',
    slug: 'orbit-x1-pro-laptop',
    name: 'Orbit X1 Pro Laptop',
    category: 'laptops',
    brand: 'Orbit',
    badge: 'Best Seller',
    description: 'A premium creator laptop with OLED display, AI acceleration, and all-day battery.',
    highlights: ['4K OLED', 'RTX-class graphics', 'Up to 32GB memory'],
    specs: {
      Processor: 'NovaCore Ultra 9',
      Display: '16-inch 4K OLED',
      Battery: '17 hours',
      Weight: '1.7 kg',
    },
    rating: 4.8,
    reviewCount: 218,
    featured: true,
    releasedAt: '2026-01-12T10:00:00.000Z',
    media: [
      { id: 'm1', name: 'Orbit X1 hero', kind: 'image', url: '/favicon.svg' },
      { id: 'm2', name: 'Orbit manual', kind: 'manual', url: '/manuals/orbit-x1.pdf' },
    ],
    variants: [
      {
        id: 'v-x1-silver-1tb',
        sku: 'ORB-X1-S-1TB',
        color: 'Silver',
        storage: '1TB',
        priceCents: 249_900,
        compareAtCents: 269_900,
        inventory: 18,
      },
      {
        id: 'v-x1-black-2tb',
        sku: 'ORB-X1-B-2TB',
        color: 'Midnight',
        storage: '2TB',
        priceCents: 289_900,
        compareAtCents: 309_900,
        inventory: 6,
      },
    ],
  },
  {
    id: 'p-pulse-tab',
    slug: 'pulse-tab-12',
    name: 'Pulse Tab 12',
    category: 'tablets',
    brand: 'Pulse',
    badge: 'New',
    description: 'A hybrid entertainment and note-taking tablet with bright mini-LED panel.',
    highlights: ['Mini-LED', 'Stylus ready', 'Wi-Fi 7'],
    specs: {
      Processor: 'Pulse M3',
      Display: '12-inch mini-LED',
      Battery: '14 hours',
      Connectivity: 'Wi-Fi 7',
    },
    rating: 4.6,
    reviewCount: 143,
    featured: true,
    releasedAt: '2026-02-03T10:00:00.000Z',
    media: [
      { id: 'm3', name: 'Pulse Tab hero', kind: 'image', url: '/favicon.svg' },
      { id: 'm4', name: 'Pulse manual', kind: 'manual', url: '/manuals/pulse-tab-12.pdf' },
    ],
    variants: [
      {
        id: 'v-tab-gray-256',
        sku: 'PLS-T12-G-256',
        color: 'Graphite',
        storage: '256GB',
        priceCents: 89_900,
        compareAtCents: 99_900,
        inventory: 20,
      },
      {
        id: 'v-tab-blue-512',
        sku: 'PLS-T12-B-512',
        color: 'Ice Blue',
        storage: '512GB',
        priceCents: 109_900,
        compareAtCents: 119_900,
        inventory: 10,
      },
    ],
  },
  {
    id: 'p-signal-buds',
    slug: 'signal-buds-max',
    name: 'Signal Buds Max',
    category: 'audio',
    brand: 'Signal',
    badge: 'Travel Pick',
    description: 'Noise-canceling earbuds with adaptive transparency and wireless charging case.',
    highlights: ['ANC', 'Spatial audio', '36-hour case battery'],
    specs: {
      Battery: '9 hours + 27 hour case',
      Audio: 'Spatial audio',
      Charging: 'USB-C / Qi',
      Weight: '52 g case',
    },
    rating: 4.5,
    reviewCount: 512,
    featured: false,
    releasedAt: '2025-11-21T10:00:00.000Z',
    media: [
      { id: 'm5', name: 'Signal Buds hero', kind: 'image', url: '/favicon.svg' },
    ],
    variants: [
      {
        id: 'v-buds-white',
        sku: 'SGN-BUD-W',
        color: 'Cloud',
        storage: 'Standard',
        priceCents: 24_900,
        compareAtCents: 29_900,
        inventory: 28,
      },
      {
        id: 'v-buds-black',
        sku: 'SGN-BUD-B',
        color: 'Onyx',
        storage: 'Standard',
        priceCents: 24_900,
        compareAtCents: 29_900,
        inventory: 4,
      },
    ],
  },
  {
    id: 'p-luma-monitor',
    slug: 'luma-view-32',
    name: 'Luma View 32',
    category: 'monitors',
    brand: 'Luma',
    badge: 'Studio',
    description: 'A 32-inch creator monitor with reference color and USB-C docking.',
    highlights: ['5K panel', '98% DCI-P3', '90W USB-C'],
    specs: {
      Panel: '32-inch 5K IPS',
      Refresh: '120Hz',
      Connectivity: 'USB-C / Thunderbolt',
      Audio: 'Integrated speakers',
    },
    rating: 4.7,
    reviewCount: 81,
    featured: true,
    releasedAt: '2025-09-10T10:00:00.000Z',
    media: [
      { id: 'm6', name: 'Luma View hero', kind: 'image', url: '/favicon.svg' },
    ],
    variants: [
      {
        id: 'v-monitor-black',
        sku: 'LUMA-32-B',
        color: 'Black',
        storage: 'Standard',
        priceCents: 119_900,
        compareAtCents: 129_900,
        inventory: 8,
      },
    ],
  },
  {
    id: 'p-arc-phone',
    slug: 'arc-phone-9',
    name: 'Arc Phone 9',
    category: 'phones',
    brand: 'Arc',
    badge: 'Editor Pick',
    description: 'Flagship phone with pro camera stack, titanium frame, and desktop docking mode.',
    highlights: ['Pro camera', 'Titanium frame', 'Satellite SOS'],
    specs: {
      Processor: 'Arc A9',
      Display: '6.8-inch LTPO OLED',
      Camera: '50MP triple system',
      Battery: '4900mAh',
    },
    rating: 4.9,
    reviewCount: 389,
    featured: true,
    releasedAt: '2026-02-20T10:00:00.000Z',
    media: [
      { id: 'm7', name: 'Arc Phone hero', kind: 'image', url: '/favicon.svg' },
    ],
    variants: [
      {
        id: 'v-phone-titanium-256',
        sku: 'ARC9-TI-256',
        color: 'Titanium',
        storage: '256GB',
        priceCents: 129_900,
        compareAtCents: 139_900,
        inventory: 12,
      },
      {
        id: 'v-phone-blue-512',
        sku: 'ARC9-BL-512',
        color: 'Blue',
        storage: '512GB',
        priceCents: 149_900,
        compareAtCents: 159_900,
        inventory: 0,
      },
    ],
  },
]

const categories = [
  { id: 'laptops', name: 'Laptops', description: 'Creator, gaming, and daily carry machines.' },
  { id: 'tablets', name: 'Tablets', description: 'Portable compute for work and play.' },
  { id: 'phones', name: 'Phones', description: 'Flagship devices and mobile productivity.' },
  { id: 'audio', name: 'Audio', description: 'Immersive audio gear for travel and focus.' },
  { id: 'monitors', name: 'Monitors', description: 'Studio displays and desk command centers.' },
]

const promotions: Promotion[] = [
  { code: 'WELCOME10', label: '10% off first order', type: 'percent', amount: 10, active: true },
  { code: 'SHIPFREE', label: 'Free shipping upgrade', type: 'fixed', amount: 1_500, active: true },
]

const customers: CustomerRecord[] = [
  {
    id: 'customer-maya',
    name: 'Maya Brooks',
    email: 'maya@showoff.test',
    role: 'customer',
    savedAddresses: [
      {
        fullName: 'Maya Brooks',
        line1: '221B Purchase Street',
        city: 'Berlin',
        country: 'Germany',
      },
    ],
  },
  {
    id: 'admin-evan',
    name: 'Evan Stone',
    email: 'evan@showoff.test',
    role: 'admin',
    savedAddresses: [],
  },
]

const initialOrders: Order[] = [
  {
    id: 'order-1001',
    number: 'SO-1001',
    customerId: 'customer-maya',
    customerName: 'Maya Brooks',
    createdAt: '2026-03-18T10:00:00.000Z',
    status: 'delivered',
    totalCents: 264_900,
    lines: [
      {
        id: 'line-1001',
        productId: 'p-orbit-pro',
        productName: 'Orbit X1 Pro Laptop',
        productSlug: 'orbit-x1-pro-laptop',
        variantId: 'v-x1-silver-1tb',
        variantLabel: 'Silver / 1TB',
        quantity: 1,
        unitPriceCents: 249_900,
        lineTotalCents: 249_900,
        badge: 'Best Seller',
        image: '/favicon.svg',
        availability: 'in-stock',
      },
    ],
    address: {
      fullName: 'Maya Brooks',
      line1: '221B Purchase Street',
      city: 'Berlin',
      country: 'Germany',
    },
  },
]

const seedCart: Record<string, CartItem[]> = {
  'customer-maya': [
    {
      id: 'cart-line-1',
      productId: 'p-signal-buds',
      variantId: 'v-buds-white',
      quantity: 1,
    },
  ],
}

export class CommerceStore {
  private readonly sessions = new Map<string, SessionRecord>()

  private readonly cartItems = new Map<string, CartItem[]>()

  private readonly cartPromos = new Map<string, string>()

  private readonly checkoutSessions = new Map<string, StoredCheckoutSession>()

  private readonly analytics: AnalyticsEvent[] = []

  private readonly orders = [...initialOrders]

  constructor() {
    for (const [customerId, items] of Object.entries(seedCart)) {
      this.cartItems.set(customerId, structuredClone(items))
    }
  }

  getUploadsDirectory() {
    const dir = join(process.cwd(), '.runtime', 'uploads')
    mkdirSync(dir, { recursive: true })
    return dir
  }

  getSessionPayload(userId: string | null) {
    if (!userId) {
      return null
    }

    return this.getUser(userId)
  }

  createSession(userId: string) {
    const user = this.getUser(userId)
    const sessionId = `session-${user.id}-${Date.now()}`
    this.sessions.set(sessionId, { sessionId, userId: user.id })
    return sessionId
  }

  destroySession(sessionId: string) {
    this.sessions.delete(sessionId)
  }

  getUserIdForSession(sessionId: string | undefined) {
    return sessionId ? this.sessions.get(sessionId)?.userId ?? null : null
  }

  getBootstrap(userId: string | null): CommerceBootstrap {
    return {
      session: userId ? this.getUser(userId) : null,
      featured: products.filter((product) => product.featured).slice(0, 4),
      categories,
      cart: this.getCart(userId),
    }
  }

  getCatalog(query: CatalogQuery): CatalogResponse {
    const productsForQuery = filterProducts(products, query)

    return {
      query,
      categories,
      products: productsForQuery,
      availableBrands: [...new Set(products.map((product) => product.brand))].sort(),
      total: productsForQuery.length,
    }
  }

  getProduct(slug: string): ProductResponse {
    const product = products.find((entry) => entry.slug === slug)

    if (!product) {
      throw new Error('Product not found.')
    }

    return {
      product,
      related: products
        .filter((entry) => entry.category === product.category && entry.id !== product.id)
        .slice(0, 3),
    }
  }

  getCart(userId: string | null): CartSummary {
    if (!userId) {
      return buildCartSummary(products, [], null)
    }

    const items = this.cartItems.get(userId) ?? []
    const promo = this.getActivePromotion(this.cartPromos.get(userId) ?? null)
    return buildCartSummary(products, items, promo)
  }

  addCartItem(userId: string, productId: string, variantId: string, quantity: number) {
    const product = products.find((entry) => entry.id === productId)

    if (!product) {
      throw new Error('Product not found.')
    }

    const variant = getVariant(product, variantId)

    if (variant.inventory < quantity) {
      throw new Error('Requested quantity exceeds available inventory.')
    }

    const items = [...(this.cartItems.get(userId) ?? [])]
    const existing = items.find((item) => item.productId === productId && item.variantId === variantId)

    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity)
    } else {
      items.push({
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId,
        variantId,
        quantity,
      })
    }

    this.cartItems.set(userId, items)
    return this.getCart(userId)
  }

  updateCartItem(userId: string, itemId: string, quantity: number) {
    const items = [...(this.cartItems.get(userId) ?? [])]
    const item = items.find((entry) => entry.id === itemId)

    if (!item) {
      throw new Error('Cart item not found.')
    }

    const product = products.find((entry) => entry.id === item.productId)

    if (!product) {
      throw new Error('Product not found.')
    }

    const variant = getVariant(product, item.variantId)

    if (variant.inventory < quantity) {
      throw new Error('Requested quantity exceeds available inventory.')
    }

    item.quantity = quantity
    this.cartItems.set(userId, items)
    return this.getCart(userId)
  }

  removeCartItem(userId: string, itemId: string) {
    const items = (this.cartItems.get(userId) ?? []).filter((entry) => entry.id !== itemId)
    this.cartItems.set(userId, items)
    return this.getCart(userId)
  }

  applyPromotion(userId: string, code: string) {
    const promotion = this.getActivePromotion(code)

    if (!promotion) {
      throw new Error('Promo code is invalid.')
    }

    this.cartPromos.set(userId, promotion.code)
    return this.getCart(userId)
  }

  createCheckoutSession(
    userId: string,
    address: Address,
    shippingMethod: 'standard' | 'priority',
  ): CheckoutSession {
    const cart = this.getCart(userId)

    if (cart.lines.length === 0) {
      throw new Error('Cart is empty.')
    }

    const sessionId = `stripe_test_${Date.now()}`
    this.checkoutSessions.set(sessionId, {
      sessionId,
      customerId: userId,
      address,
      shippingMethod,
      createdAt: nowIso(),
    })

    return {
      sessionId,
      checkoutUrl: `/checkout/success?session_id=${sessionId}`,
    }
  }

  confirmCheckout(sessionId: string) {
    const checkoutSession = this.checkoutSessions.get(sessionId)

    if (!checkoutSession) {
      throw new Error('Checkout session not found.')
    }

    const customer = this.getCustomer(checkoutSession.customerId)
    const summary = this.getCart(customer.id)

    const order: Order = {
      id: `order-${Date.now()}`,
      number: `SO-${1000 + this.orders.length + 1}`,
      customerId: customer.id,
      customerName: customer.name,
      createdAt: nowIso(),
      status: 'paid',
      totalCents: summary.totalCents,
      lines: summary.lines,
      address: checkoutSession.address,
    }

    this.orders.unshift(order)
    this.cartItems.set(customer.id, [])
    this.cartPromos.delete(customer.id)
    this.checkoutSessions.delete(sessionId)

    this.captureAnalytics({
      type: 'purchase_completed',
      detail: { orderId: order.id, totalCents: String(order.totalCents) },
      createdAt: nowIso(),
    })

    return order
  }

  getAccountProfile(userId: string) {
    return this.getCustomer(userId)
  }

  getOrdersForCustomer(userId: string) {
    return this.orders.filter((order) => order.customerId === userId)
  }

  getAdminSummary(): AdminSummary {
    return {
      revenueCents: this.orders.reduce((sum, order) => sum + order.totalCents, 0),
      pendingOrders: this.orders.filter((order) => order.status !== 'delivered').length,
      lowInventorySkus: products.flatMap((product) => product.variants).filter((variant) => variant.inventory < 8).length,
      activePromotions: promotions.filter((promotion) => promotion.active).length,
    }
  }

  getAdminProducts() {
    return products
  }

  updateProduct(productId: string, badge: string, featured: boolean) {
    const product = products.find((entry) => entry.id === productId)

    if (!product) {
      throw new Error('Product not found.')
    }

    product.badge = badge
    product.featured = featured
    this.captureAnalytics({
      type: 'admin_product_updated',
      detail: { productId, badge, featured: String(featured) },
      createdAt: nowIso(),
    })
    return product
  }

  getInventory() {
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        sku: variant.sku,
        productName: product.name,
        label: `${variant.color} / ${variant.storage}`,
        inventory: variant.inventory,
      })),
    )
  }

  updateInventory(sku: string, inventory: number) {
    const variant = products.flatMap((product) => product.variants).find((entry) => entry.sku === sku)

    if (!variant) {
      throw new Error('SKU not found.')
    }

    variant.inventory = inventory
    return variant
  }

  getAdminOrders() {
    return this.orders
  }

  updateOrder(orderId: string, status: OrderStatus) {
    const order = this.orders.find((entry) => entry.id === orderId)

    if (!order) {
      throw new Error('Order not found.')
    }

    order.status = status
    return order
  }

  getPromotions() {
    return promotions
  }

  createPromotion(promotion: Promotion) {
    promotions.unshift(promotion)
    return promotion
  }

  getAdminCustomers(): AdminCustomer[] {
    return customers
      .filter((customer) => customer.role === 'customer')
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        orderCount: this.orders.filter((order) => order.customerId === customer.id).length,
      }))
  }

  captureAnalytics(event: AnalyticsEvent) {
    this.analytics.unshift(event)
  }

  getAnalytics() {
    return this.analytics
  }

  private getUser(userId: string): SessionUser {
    const user = customers.find((entry) => entry.id === userId)

    if (!user) {
      throw new Error('User not found.')
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }

  private getCustomer(userId: string) {
    const customer = customers.find((entry) => entry.id === userId)

    if (!customer) {
      throw new Error('Customer not found.')
    }

    return customer
  }

  private getActivePromotion(code: string | null) {
    if (!code) {
      return null
    }

    return promotions.find((entry) => entry.code === code && entry.active) ?? null
  }

  getProductCatalog() {
    return products
  }

  getCategories() {
    return categories
  }

  getDefaultSearchQuery(): CatalogQuery {
    return {
      q: '',
      category: 'all',
      brand: 'all',
      availability: 'all',
      rating: 0,
      priceMin: 0,
      priceMax: 5000,
      sort: 'featured',
    }
  }

  getFeaturedProduct() {
    return products[0] ?? null
  }

  getStructuredProduct(slug: string) {
    const product = this.getProduct(slug).product
    const variant = getDefaultVariant(product)

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      brand: { '@type': 'Brand', name: product.brand },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: (variant.priceCents / 100).toFixed(2),
        availability:
          variant.inventory > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/BackOrder',
      },
    }
  }
}
