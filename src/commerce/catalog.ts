import type {
  CartItem,
  CartLine,
  CartSummary,
  CatalogQuery,
  Product,
  ProductVariant,
  Promotion,
} from './model.ts'

export const getVariant = (product: Product, variantId: string) => {
  const variant = product.variants.find((entry) => entry.id === variantId)

  if (!variant) {
    throw new Error('Variant not found.')
  }

  return variant
}

export const getDefaultVariant = (product: Product) => {
  const variant = product.variants[0]

  if (!variant) {
    throw new Error('Product has no variants.')
  }

  return variant
}

export const getAvailability = (variant: ProductVariant) => {
  if (variant.inventory >= 12) {
    return 'in-stock' as const
  }

  if (variant.inventory > 0) {
    return 'low-stock' as const
  }

  return 'backorder' as const
}

export const sortProducts = (products: Product[], sort: CatalogQuery['sort']) => {
  const next = [...products]

  next.sort((left, right) => {
    const leftVariant = getDefaultVariant(left)
    const rightVariant = getDefaultVariant(right)

    switch (sort) {
      case 'price-asc':
        return leftVariant.priceCents - rightVariant.priceCents
      case 'price-desc':
        return rightVariant.priceCents - leftVariant.priceCents
      case 'rating':
        return right.rating - left.rating
      case 'newest':
        return right.releasedAt.localeCompare(left.releasedAt)
      default:
        return Number(right.featured) - Number(left.featured) || right.rating - left.rating
    }
  })

  return next
}

export const filterProducts = (products: Product[], query: CatalogQuery) =>
  sortProducts(
    products.filter((product) => {
      const variant = getDefaultVariant(product)
      const availability = getAvailability(variant)
      const q = query.q.trim().toLowerCase()
      const haystack = `${product.name} ${product.brand} ${product.description}`.toLowerCase()

      if (q && !haystack.includes(q)) {
        return false
      }

      if (query.category !== 'all' && product.category !== query.category) {
        return false
      }

      if (query.brand !== 'all' && product.brand !== query.brand) {
        return false
      }

      if (query.availability !== 'all' && availability !== query.availability) {
        return false
      }

      if (product.rating < query.rating) {
        return false
      }

      if (variant.priceCents < query.priceMin * 100 || variant.priceCents > query.priceMax * 100) {
        return false
      }

      return true
    }),
    query.sort,
  )

export const buildCartSummary = (
  products: Product[],
  items: CartItem[],
  promotion: Promotion | null,
) => {
  const lines: CartLine[] = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)

    if (!product) {
      throw new Error('Product not found for cart item.')
    }

    const variant = getVariant(product, item.variantId)
    const image = product.media[0]?.url ?? ''

    return {
      id: item.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: variant.id,
      variantLabel: `${variant.color} / ${variant.storage}`,
      quantity: item.quantity,
      unitPriceCents: variant.priceCents,
      lineTotalCents: variant.priceCents * item.quantity,
      badge: product.badge,
      image,
      availability: getAvailability(variant),
    }
  })

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0)
  const discountCents = promotion
    ? promotion.type === 'percent'
      ? Math.round((subtotalCents * promotion.amount) / 100)
      : Math.min(subtotalCents, promotion.amount)
    : 0
  const shippingCents = subtotalCents >= 150_000 ? 0 : lines.length > 0 ? 1_500 : 0

  return {
    lines,
    promoCode: promotion?.code ?? null,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, subtotalCents - discountCents + shippingCents),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  } satisfies CartSummary
}
