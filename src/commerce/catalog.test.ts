import { describe, expect, it } from 'vitest'
import { buildCartSummary, filterProducts } from './catalog.ts'
import type { Product } from './model.ts'

const products: Product[] = [
  {
    id: 'product-1',
    slug: 'orbit-laptop',
    name: 'Orbit Laptop',
    category: 'laptops',
    brand: 'Orbit',
    badge: 'Best Seller',
    description: 'Creator laptop',
    highlights: ['Fast'],
    specs: { Processor: 'Nova' },
    rating: 4.8,
    reviewCount: 100,
    featured: true,
    releasedAt: '2026-02-01T00:00:00.000Z',
    media: [{ id: 'media-1', name: 'hero', kind: 'image', url: '/favicon.svg' }],
    variants: [
      {
        id: 'variant-1',
        sku: 'ORB-1',
        color: 'Silver',
        storage: '1TB',
        priceCents: 199_900,
        compareAtCents: 219_900,
        inventory: 12,
      },
    ],
  },
  {
    id: 'product-2',
    slug: 'signal-buds',
    name: 'Signal Buds',
    category: 'audio',
    brand: 'Signal',
    badge: 'Travel Pick',
    description: 'Wireless earbuds',
    highlights: ['ANC'],
    specs: { Battery: '20h' },
    rating: 4.3,
    reviewCount: 44,
    featured: false,
    releasedAt: '2026-03-01T00:00:00.000Z',
    media: [{ id: 'media-2', name: 'hero', kind: 'image', url: '/favicon.svg' }],
    variants: [
      {
        id: 'variant-2',
        sku: 'SIG-1',
        color: 'Black',
        storage: 'Standard',
        priceCents: 24_900,
        compareAtCents: 29_900,
        inventory: 4,
      },
    ],
  },
]

describe('commerce catalog helpers', () => {
  it('filters catalog items by category and brand', () => {
    const filtered = filterProducts(products, {
      q: '',
      category: 'audio',
      brand: 'Signal',
      availability: 'all',
      rating: 0,
      priceMin: 0,
      priceMax: 5000,
      sort: 'featured',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.slug).toBe('signal-buds')
  })

  it('builds cart totals with promotions', () => {
    const cart = buildCartSummary(
      products,
      [
        {
          id: 'line-1',
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 1,
        },
      ],
      { code: 'WELCOME10', label: '10% off', type: 'percent', amount: 10, active: true },
    )

    expect(cart.subtotalCents).toBe(199_900)
    expect(cart.discountCents).toBe(19_990)
    expect(cart.totalCents).toBe(179_910)
  })
})
