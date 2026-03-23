import type { AppState } from '../commerce/state.ts'
import { createEmptyAppState } from '../commerce/state.ts'

export const createCommerceTestState = (): AppState => {
  const state = createEmptyAppState()

  state.bootstrap = {
    session: null,
    featured: [
      {
        id: 'test-product',
        slug: 'test-device',
        name: 'Test Device',
        category: 'laptops',
        brand: 'Orbit',
        badge: 'Best Seller',
        description: 'Testing storefront render path.',
        highlights: ['Fast', 'Portable'],
        specs: { Processor: 'Nova', Battery: '12h' },
        rating: 4.8,
        reviewCount: 100,
        featured: true,
        releasedAt: '2026-03-20T10:00:00.000Z',
        media: [{ id: 'media-1', name: 'Hero', kind: 'image', url: '/favicon.svg' }],
        variants: [
          {
            id: 'variant-1',
            sku: 'TEST-1',
            color: 'Silver',
            storage: '512GB',
            priceCents: 199_900,
            compareAtCents: 209_900,
            inventory: 10,
          },
        ],
      },
    ],
    categories: [
      { id: 'laptops', name: 'Laptops', description: 'Creator machines.' },
      { id: 'audio', name: 'Audio', description: 'Immersive sound.' },
    ],
    cart: state.cart,
  }

  return state
}
