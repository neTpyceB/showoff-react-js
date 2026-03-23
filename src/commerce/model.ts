import { z } from 'zod'

export const roleSchema = z.enum(['guest', 'customer', 'admin'])
export type Role = z.infer<typeof roleSchema>

export const availabilitySchema = z.enum(['in-stock', 'low-stock', 'backorder'])
export type Availability = z.infer<typeof availabilitySchema>

export const sortSchema = z.enum(['featured', 'price-asc', 'price-desc', 'rating', 'newest'])
export type CatalogSort = z.infer<typeof sortSchema>

export const catalogQuerySchema = z.object({
  q: z.string().default(''),
  category: z.string().default('all'),
  brand: z.string().default('all'),
  availability: z.string().default('all'),
  rating: z.coerce.number().min(0).max(5).default(0),
  priceMin: z.coerce.number().min(0).default(0),
  priceMax: z.coerce.number().min(0).default(5000),
  sort: sortSchema.default('featured'),
})
export type CatalogQuery = z.infer<typeof catalogQuerySchema>

export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
})
export type SessionUser = z.infer<typeof sessionSchema>

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['image', 'manual']),
  url: z.string(),
})
export type ProductMedia = z.infer<typeof attachmentSchema>

export const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  color: z.string(),
  storage: z.string(),
  priceCents: z.number().int(),
  compareAtCents: z.number().int(),
  inventory: z.number().int().min(0),
})
export type ProductVariant = z.infer<typeof variantSchema>

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  brand: z.string(),
  badge: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  specs: z.record(z.string(), z.string()),
  rating: z.number(),
  reviewCount: z.number().int(),
  featured: z.boolean(),
  releasedAt: z.string(),
  media: z.array(attachmentSchema),
  variants: z.array(variantSchema),
})
export type Product = z.infer<typeof productSchema>

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})
export type Category = z.infer<typeof categorySchema>

export const promoSchema = z.object({
  code: z.string(),
  label: z.string(),
  type: z.enum(['percent', 'fixed']),
  amount: z.number().int(),
  active: z.boolean(),
})
export type Promotion = z.infer<typeof promoSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().min(1),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartLineSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  variantId: z.string(),
  variantLabel: z.string(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int(),
  lineTotalCents: z.number().int(),
  badge: z.string(),
  image: z.string(),
  availability: availabilitySchema,
})
export type CartLine = z.infer<typeof cartLineSchema>

export const cartSummarySchema = z.object({
  lines: z.array(cartLineSchema),
  promoCode: z.string().nullable(),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  shippingCents: z.number().int(),
  totalCents: z.number().int(),
  itemCount: z.number().int(),
})
export type CartSummary = z.infer<typeof cartSummarySchema>

export const orderStatusSchema = z.enum(['paid', 'packed', 'shipped', 'delivered'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  createdAt: z.string(),
  status: orderStatusSchema,
  totalCents: z.number().int(),
  lines: z.array(cartLineSchema),
  address: z.object({
    fullName: z.string(),
    line1: z.string(),
    city: z.string(),
    country: z.string(),
  }),
})
export type Order = z.infer<typeof orderSchema>

export const analyticsEventSchema = z.object({
  type: z.enum([
    'product_viewed',
    'search_submitted',
    'cart_item_added',
    'checkout_started',
    'purchase_completed',
    'admin_product_updated',
  ]),
  detail: z.record(z.string(), z.string()),
  createdAt: z.string(),
})
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>

export const catalogResponseSchema = z.object({
  query: catalogQuerySchema,
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  availableBrands: z.array(z.string()),
  total: z.number().int(),
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>

export const productResponseSchema = z.object({
  product: productSchema,
  related: z.array(productSchema),
})
export type ProductResponse = z.infer<typeof productResponseSchema>

export const bootstrapSchema = z.object({
  session: sessionSchema.nullable(),
  featured: z.array(productSchema),
  categories: z.array(categorySchema),
  cart: cartSummarySchema,
})
export type CommerceBootstrap = z.infer<typeof bootstrapSchema>

export const checkoutSessionSchema = z.object({
  sessionId: z.string(),
  checkoutUrl: z.string(),
})
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>

export const adminSummarySchema = z.object({
  revenueCents: z.number().int(),
  pendingOrders: z.number().int(),
  lowInventorySkus: z.number().int(),
  activePromotions: z.number().int(),
})
export type AdminSummary = z.infer<typeof adminSummarySchema>

export const adminCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  orderCount: z.number().int(),
})
export type AdminCustomer = z.infer<typeof adminCustomerSchema>

export const loginRequestSchema = z.object({
  userId: z.string(),
})

export const addCartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().min(1).max(10),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(10),
})

export const applyPromoSchema = z.object({
  code: z.string().trim().min(2),
})

export const checkoutRequestSchema = z.object({
  address: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(4),
    city: z.string().min(2),
    country: z.string().min(2),
  }),
  shippingMethod: z.enum(['standard', 'priority']),
})

export const checkoutConfirmSchema = z.object({
  sessionId: z.string(),
})

export const updateProductSchema = z.object({
  badge: z.string().min(2),
  featured: z.boolean(),
})

export const updateInventorySchema = z.object({
  inventory: z.number().int().min(0),
})

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
})

export const createPromotionSchema = z.object({
  code: z.string().min(2),
  label: z.string().min(2),
  type: z.enum(['percent', 'fixed']),
  amount: z.number().int().positive(),
})

export const analyticsRequestSchema = z.object({
  type: analyticsEventSchema.shape.type,
  detail: z.record(z.string(), z.string()),
})

export const checkoutFormDefaults = {
  fullName: 'Maya Brooks',
  line1: '221B Purchase Street',
  city: 'Berlin',
  country: 'Germany',
}

export const formatMoney = (valueCents: number) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(valueCents / 100)
