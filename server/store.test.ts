import { describe, expect, it } from 'vitest'
import { CommerceStore } from './store.ts'

describe('CommerceStore', () => {
  it('filters the seeded catalog', () => {
    const store = new CommerceStore()
    const catalog = store.getCatalog({
      q: 'Arc',
      category: 'all',
      brand: 'all',
      availability: 'all',
      rating: 0,
      priceMin: 0,
      priceMax: 5000,
      sort: 'featured',
    })

    expect(catalog.products).toHaveLength(1)
    expect(catalog.products[0]?.slug).toBe('arc-phone-9')
  })

  it('creates checkout sessions and confirms orders', () => {
    const store = new CommerceStore()
    const sessionId = store.createSession('customer-maya')
    const userId = store.getUserIdForSession(sessionId)

    if (!userId) {
      throw new Error('Expected seeded session.')
    }

    store.addCartItem(userId, 'p-orbit-pro', 'v-x1-silver-1tb', 1)
    const checkout = store.createCheckoutSession(userId, {
      fullName: 'Maya Brooks',
      line1: '221B Purchase Street',
      city: 'Berlin',
      country: 'Germany',
    }, 'standard')

    const order = store.confirmCheckout(checkout.sessionId)

    expect(order.number).toMatch(/^SO-/)
    expect(store.getCart(userId).itemCount).toBe(0)
  })

  it('updates admin inventory and product merchandising', () => {
    const store = new CommerceStore()

    const updatedProduct = store.updateProduct('p-orbit-pro', 'Limited Drop', false)
    const updatedInventory = store.updateInventory('ORB-X1-S-1TB', 24)

    expect(updatedProduct.badge).toBe('Limited Drop')
    expect(updatedInventory.inventory).toBe(24)
  })
})
