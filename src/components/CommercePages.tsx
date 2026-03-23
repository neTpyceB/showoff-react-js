/* @jsxRuntime automatic */
import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { formatMoney, checkoutFormDefaults, type CatalogQuery, type Promotion } from '../commerce/model.ts'
import { useCommerce, resolveProductPrice } from '../commerce/client.tsx'
import { commerceApi } from '../commerce/api.ts'
import { getAvailability } from '../commerce/catalog.ts'
import { useToast } from './ToastProvider.tsx'
import { Button } from './Button.tsx'

const NavLink = ({ to, children }: { to: string; children: string }) => {
  const location = useLocation()
  const active = location.pathname.startsWith(to)

  return (
    <Link className={`nav-link${active ? ' active' : ''}`} to={to}>
      {children}
    </Link>
  )
}

export const StoreLayout = () => {
  const { state, logout } = useCommerce()
  const navigate = useNavigate()

  return (
    <div className="store-shell">
      <header className="topbar">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">S</span>
          <span>
            <strong>Showoff Electronics</strong>
            <small>SSR retail frontend</small>
          </span>
        </Link>

        <nav className="nav-row">
          <NavLink to="/catalog">Catalog</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {state.session?.role === 'customer' ? <NavLink to="/account/orders">Account</NavLink> : null}
          {state.session?.role === 'admin' ? <NavLink to="/admin">Admin</NavLink> : null}
        </nav>

        <div className="topbar-actions">
          <Link className="cart-pill" to="/cart">
            Cart {state.cart.itemCount}
          </Link>
          {state.session ? (
            <Button
              variant="ghost"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
            >
              Sign out
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  )
}

export const HomePage = () => {
  const { state, recordEvent } = useCommerce()

  useEffect(() => {
    recordEvent('search_submitted', { route: 'home' })
  }, [recordEvent])

  return (
    <main className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Flagship Storefront</p>
          <h1>Build-worthy electronics retail with SSR, checkout, account, and admin.</h1>
          <p className="hero-copy">
            Browse premium devices, move through cart and checkout, then switch into customer and admin workflows without leaving the same-origin app.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-md" to="/catalog">
              Explore catalog
            </Link>
            <Link className="button button-secondary button-md" to="/admin">
              Open admin area
            </Link>
          </div>
        </div>

        <div className="hero-grid">
          {state.bootstrap.categories.map((category) => (
            <Link key={category.id} className="surface-card" to={`/catalog?category=${category.id}`}>
              <strong>{category.name}</strong>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>Merchandising highlights</h2>
          </div>
        </div>
        <div className="product-grid">
          {state.bootstrap.featured.map((product) => (
            <Link key={product.id} className="product-card" to={`/catalog/${product.slug}`}>
              <img alt={product.name} src={product.media[0]?.url ?? '/favicon.svg'} />
              <span className="badge">{product.badge}</span>
              <strong>{product.name}</strong>
              <p>{product.description}</p>
              <span>{formatMoney(resolveProductPrice(product))}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export const CatalogPage = ({ searchMode = false }: { searchMode?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { state, setState, recordEvent } = useCommerce()
  const [pendingSearch, setPendingSearch] = useState(searchParams.get('q') ?? '')

  const query: Partial<CatalogQuery> = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      category: searchParams.get('category') ?? 'all',
      brand: searchParams.get('brand') ?? 'all',
      availability: searchParams.get('availability') ?? 'all',
      rating: Number(searchParams.get('rating') ?? '0'),
      priceMin: Number(searchParams.get('priceMin') ?? '0'),
      priceMax: Number(searchParams.get('priceMax') ?? '5000'),
      sort: (searchParams.get('sort') ?? 'featured') as CatalogQuery['sort'],
    }),
    [searchParams],
  )
  const searchKey = searchParams.toString()

  useEffect(() => {
    const run = async () => {
      const next = searchMode
        ? await commerceApi.search(query)
        : await commerceApi.getCatalog(query)

      setState((current) => ({ ...current, catalog: next }))
      recordEvent('search_submitted', {
        route: searchMode ? 'search' : 'catalog',
        query: query.q ?? '',
      })
    }

    void run()
  }, [query, recordEvent, searchMode, searchKey, setState])

  const catalog = state.catalog

  if (!catalog) {
    return <main className="page-stack"><section className="state-card"><h2>Loading catalog</h2></section></main>
  }

  const brands = catalog.availableBrands

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">{searchMode ? 'Search' : 'Catalog'}</p>
            <h1>{searchMode ? 'Find the right hardware fast' : 'Browse the product catalog'}</h1>
          </div>
          <form
            className="inline-search"
            onSubmit={(event) => {
              event.preventDefault()
              setSearchParams((current) => {
                const next = new URLSearchParams(current)
                if (pendingSearch.trim()) {
                  next.set('q', pendingSearch.trim())
                } else {
                  next.delete('q')
                }
                return next
              })
            }}
          >
            <input value={pendingSearch} onChange={(event) => setPendingSearch(event.currentTarget.value)} placeholder="Search products" />
            <Button type="submit">Search</Button>
          </form>
        </div>

        <div className="catalog-layout">
          <aside className="filter-panel">
            <label>
              <span>Category</span>
              <select
                value={query.category ?? 'all'}
                onChange={(event) => {
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current)
                    next.set('category', event.currentTarget.value)
                    return next
                  })
                }}
              >
                <option value="all">All categories</option>
                {state.bootstrap.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Brand</span>
              <select
                value={query.brand ?? 'all'}
                onChange={(event) => {
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current)
                    next.set('brand', event.currentTarget.value)
                    return next
                  })
                }}
              >
                <option value="all">All brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Availability</span>
              <select
                value={query.availability ?? 'all'}
                onChange={(event) => {
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current)
                    next.set('availability', event.currentTarget.value)
                    return next
                  })
                }}
              >
                <option value="all">Any</option>
                <option value="in-stock">In stock</option>
                <option value="low-stock">Low stock</option>
                <option value="backorder">Backorder</option>
              </select>
            </label>

            <label>
              <span>Sort</span>
              <select
                value={query.sort ?? 'featured'}
                onChange={(event) => {
                  setSearchParams((current) => {
                    const next = new URLSearchParams(current)
                    next.set('sort', event.currentTarget.value)
                    return next
                  })
                }}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="rating">Top rated</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </aside>

          <section className="product-grid">
            {catalog.products.map((product) => {
              const variant = product.variants[0]

              return (
                <Link key={product.id} className="product-card" to={`/catalog/${product.slug}`}>
                  <img alt={product.name} src={product.media[0]?.url ?? '/favicon.svg'} />
                  <span className="badge">{product.badge}</span>
                  <strong>{product.name}</strong>
                  <p>{product.brand} · {product.category}</p>
                  <small>{getAvailability(variant)}</small>
                  <span>{formatMoney(variant.priceCents)}</span>
                </Link>
              )
            })}
          </section>
        </div>
      </section>
    </main>
  )
}

export const ProductPage = () => {
  const { slug = '' } = useParams()
  const { state, setState, refreshCart, recordEvent } = useCommerce()
  const { pushToast } = useToast()
  const [variantId, setVariantId] = useState('')

  useEffect(() => {
    void commerceApi.getProduct(slug).then((product) => {
      setState((current) => ({ ...current, product }))
      setVariantId(product.product.variants[0]?.id ?? '')
      recordEvent('product_viewed', { slug })
    })
  }, [recordEvent, setState, slug])

  if (!state.product) {
    return <main className="page-stack"><section className="state-card"><h2>Loading product</h2></section></main>
  }

  const { product, related } = state.product
  const variant = product.variants.find((entry) => entry.id === variantId) ?? product.variants[0]

  return (
    <main className="page-stack">
      <section className="product-hero">
        <img alt={product.name} src={product.media[0]?.url ?? '/favicon.svg'} />
        <div className="product-copy">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <span className="price-mark">{formatMoney(variant.priceCents)}</span>

          <label>
            <span>Variant</span>
            <select value={variantId} onChange={(event) => setVariantId(event.currentTarget.value)}>
              {product.variants.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.color} / {entry.storage}
                </option>
              ))}
            </select>
          </label>

          <div className="hero-actions">
            <Button
              onClick={async () => {
                await commerceApi.addCartItem({ productId: product.id, variantId: variant.id, quantity: 1 })
                await refreshCart()
                recordEvent('cart_item_added', { productId: product.id, variantId: variant.id })
                pushToast({
                  title: 'Added to cart',
                  description: `${product.name} is now in the cart.`,
                  tone: 'success',
                })
              }}
            >
              Add to cart
            </Button>
            <Link className="button button-secondary button-md" to="/cart">
              View cart
            </Link>
          </div>

          <ul className="bullet-list">
            {product.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2>Specifications</h2>
        </div>
        <div className="spec-grid">
          {Object.entries(product.specs).map(([label, value]) => (
            <div key={label} className="surface-card">
              <strong>{label}</strong>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2>Related products</h2>
        </div>
        <div className="product-grid">
          {related.map((entry) => (
            <Link key={entry.id} className="product-card" to={`/catalog/${entry.slug}`}>
              <img alt={entry.name} src={entry.media[0]?.url ?? '/favicon.svg'} />
              <strong>{entry.name}</strong>
              <span>{formatMoney(resolveProductPrice(entry))}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export const CartPage = () => {
  const { state, refreshCart } = useCommerce()
  const [promoCode, setPromoCode] = useState('')
  const navigate = useNavigate()

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Cart</p>
            <h1>Review the order before checkout</h1>
          </div>
        </div>

        <div className="cart-layout">
          <section className="stack-panel">
            {state.cart.lines.map((line) => (
              <article key={line.id} className="cart-line">
                <img alt={line.productName} src={line.image} />
                <div>
                  <strong>{line.productName}</strong>
                  <p>{line.variantLabel}</p>
                  <small>{line.availability}</small>
                </div>
                <div className="cart-line-actions">
                  <select
                    aria-label={`Quantity for ${line.productName}`}
                    value={line.quantity}
                    onChange={async (event) => {
                      await commerceApi.updateCartItem(line.id, Number(event.currentTarget.value))
                      await refreshCart()
                    }}
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await commerceApi.removeCartItem(line.id)
                      await refreshCart()
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <span>{formatMoney(line.lineTotalCents)}</span>
              </article>
            ))}
          </section>

          <aside className="checkout-card">
            <strong>Order summary</strong>
            <p>Subtotal {formatMoney(state.cart.subtotalCents)}</p>
            <p>Discount {formatMoney(state.cart.discountCents)}</p>
            <p>Shipping {formatMoney(state.cart.shippingCents)}</p>
            <p className="price-mark">{formatMoney(state.cart.totalCents)}</p>

            <form
              className="promo-form"
              onSubmit={async (event) => {
                event.preventDefault()
                await commerceApi.applyPromo(promoCode)
                await refreshCart()
                setPromoCode('')
              }}
            >
              <input value={promoCode} onChange={(event) => setPromoCode(event.currentTarget.value)} placeholder="Promo code" />
              <Button type="submit" variant="secondary">Apply</Button>
            </form>

            <Button onClick={() => navigate('/checkout')} disabled={state.cart.lines.length === 0}>
              Proceed to checkout
            </Button>
          </aside>
        </div>
      </section>
    </main>
  )
}

export const CheckoutPage = () => {
  const { state, recordEvent } = useCommerce()
  const [form, setForm] = useState(checkoutFormDefaults)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'priority'>('standard')

  if (!state.session || state.session.role !== 'customer') {
    return <Navigate replace to="/login" />
  }

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Checkout</p>
            <h1>Complete a Stripe-style test purchase</h1>
          </div>
        </div>

        <form
          className="checkout-layout"
          onSubmit={async (event) => {
            event.preventDefault()
            recordEvent('checkout_started', { itemCount: String(state.cart.itemCount) })
            const session = await commerceApi.createCheckoutSession({
              address: form,
              shippingMethod,
            })
            window.location.assign(session.checkoutUrl)
          }}
        >
          <section className="stack-panel">
            {Object.entries(form).map(([key, value]) => (
              <label key={key}>
                <span>{key}</span>
                <input
                  value={value}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.currentTarget.value }))
                  }
                />
              </label>
            ))}

            <label>
              <span>Shipping method</span>
              <select value={shippingMethod} onChange={(event) => setShippingMethod(event.currentTarget.value as 'standard' | 'priority')}>
                <option value="standard">Standard</option>
                <option value="priority">Priority</option>
              </select>
            </label>
          </section>

          <aside className="checkout-card">
            <strong>Pay with Stripe test flow</strong>
            <p>This project uses a local Stripe-style session handoff to validate the checkout integration shape end to end.</p>
            <p className="price-mark">{formatMoney(state.cart.totalCents)}</p>
            <Button type="submit">Create checkout session</Button>
          </aside>
        </form>
      </section>
    </main>
  )
}

export const CheckoutSuccessPage = () => {
  const { state } = useCommerce()
  const order = state.lastOrder ?? state.accountOrders[0] ?? null

  return (
    <main className="page-stack">
      <section className="state-card success-card">
        <p className="eyebrow">Order confirmed</p>
        <h1>{order ? `Order ${order.number} is confirmed` : 'Checkout complete'}</h1>
        <p>{order ? `Total ${formatMoney(order.totalCents)}` : 'Your latest purchase is ready for account review.'}</p>
        <div className="hero-actions">
          <Link className="button button-primary button-md" to="/account/orders">
            View orders
          </Link>
          <Link className="button button-secondary button-md" to="/catalog">
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  )
}

const AccountNav = () => {
  const location = useLocation()
  const links = [
    ['/account/orders', 'Orders'],
    ['/account/profile', 'Profile'],
    ['/account/addresses', 'Addresses'],
  ] as const

  return (
    <nav className="section-tabs">
      {links.map(([to, label]) => (
        <Link key={to} className={`nav-link${location.pathname === to ? ' active' : ''}`} to={to}>
          {label}
        </Link>
      ))}
    </nav>
  )
}

export const AccountPage = () => {
  const { state, refreshAccount } = useCommerce()
  const location = useLocation()

  useEffect(() => {
    void refreshAccount()
  }, [refreshAccount])

  if (!state.session || state.session.role !== 'customer') {
    return <Navigate replace to="/login" />
  }

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Account</p>
            <h1>{state.session.name}</h1>
          </div>
        </div>

        <AccountNav />

        {location.pathname === '/account/orders' ? (
          <section className="stack-panel">
            {state.accountOrders.map((order) => (
              <article key={order.id} className="surface-card">
                <strong>{order.number}</strong>
                <p>{order.status}</p>
                <span>{formatMoney(order.totalCents)}</span>
              </article>
            ))}
          </section>
        ) : null}

        {location.pathname === '/account/profile' ? (
          <section className="surface-card">
            <strong>{state.profile?.user.name}</strong>
            <p>{state.profile?.user.email}</p>
            <small>Role: {state.profile?.user.role}</small>
          </section>
        ) : null}

        {location.pathname === '/account/addresses' ? (
          <section className="stack-panel">
            {state.profile?.savedAddresses.map((address) => (
              <article key={address.line1} className="surface-card">
                <strong>{address.fullName}</strong>
                <p>{address.line1}</p>
                <p>{address.city}, {address.country}</p>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  )
}

const AdminNav = () => {
  const location = useLocation()
  const links = [
    ['/admin', 'Overview'],
    ['/admin/products', 'Products'],
    ['/admin/inventory', 'Inventory'],
    ['/admin/orders', 'Orders'],
    ['/admin/promotions', 'Promotions'],
    ['/admin/customers', 'Customers'],
  ] as const

  return (
    <nav className="section-tabs">
      {links.map(([to, label]) => (
        <Link key={to} className={`nav-link${location.pathname === to ? ' active' : ''}`} to={to}>
          {label}
        </Link>
      ))}
    </nav>
  )
}

export const AdminPage = () => {
  const { state, refreshAdmin } = useCommerce()
  const location = useLocation()
  const { pushToast } = useToast()
  const [promotionDraft, setPromotionDraft] = useState<{
    code: string
    label: string
    type: Promotion['type']
    amount: number
  }>({
    code: 'SPRING25',
    label: 'Spring launch',
    type: 'percent',
    amount: 25,
  })

  useEffect(() => {
    void refreshAdmin()
  }, [refreshAdmin])

  if (!state.session || state.session.role !== 'admin') {
    return <Navigate replace to="/login" />
  }

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Operational commerce dashboard</h1>
          </div>
        </div>
        <AdminNav />

        {location.pathname === '/admin' ? (
          <div className="spec-grid">
            <div className="surface-card"><strong>Revenue</strong><p>{formatMoney(state.adminSummary?.revenueCents ?? 0)}</p></div>
            <div className="surface-card"><strong>Pending orders</strong><p>{state.adminSummary?.pendingOrders ?? 0}</p></div>
            <div className="surface-card"><strong>Low inventory</strong><p>{state.adminSummary?.lowInventorySkus ?? 0}</p></div>
            <div className="surface-card"><strong>Promotions</strong><p>{state.adminSummary?.activePromotions ?? 0}</p></div>
          </div>
        ) : null}

        {location.pathname === '/admin/products' ? (
          <section className="stack-panel">
            {state.adminProducts.map((product) => (
              <article key={product.id} className="surface-card admin-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.badge}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await commerceApi.updateProduct(product.id, {
                      badge: product.badge === 'Best Seller' ? 'Limited Drop' : 'Best Seller',
                      featured: !product.featured,
                    })
                    await refreshAdmin()
                    pushToast({ title: 'Product updated', description: product.name, tone: 'success' })
                  }}
                >
                  Toggle merch
                </Button>
              </article>
            ))}
          </section>
        ) : null}

        {location.pathname === '/admin/inventory' ? (
          <section className="stack-panel">
            {state.inventory.map((entry) => (
              <article key={entry.sku} className="surface-card admin-row">
                <div>
                  <strong>{entry.productName}</strong>
                  <p>{entry.label}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await commerceApi.updateInventory(entry.sku, entry.inventory + 3)
                    await refreshAdmin()
                  }}
                >
                  Add stock
                </Button>
              </article>
            ))}
          </section>
        ) : null}

        {location.pathname === '/admin/orders' ? (
          <section className="stack-panel">
            {state.adminOrders.map((order) => (
              <article key={order.id} className="surface-card admin-row">
                <div>
                  <strong>{order.number}</strong>
                  <p>{order.customerName}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await commerceApi.updateOrder(order.id, order.status === 'paid' ? 'packed' : 'shipped')
                    await refreshAdmin()
                  }}
                >
                  Advance status
                </Button>
              </article>
            ))}
          </section>
        ) : null}

        {location.pathname === '/admin/promotions' ? (
          <section className="stack-panel">
            <form
              className="surface-card promo-form-vertical"
              onSubmit={async (event) => {
                event.preventDefault()
                await commerceApi.createPromotion(promotionDraft)
                await refreshAdmin()
              }}
            >
              <input value={promotionDraft.code} onChange={(event) => setPromotionDraft((current) => ({ ...current, code: event.currentTarget.value }))} />
              <input value={promotionDraft.label} onChange={(event) => setPromotionDraft((current) => ({ ...current, label: event.currentTarget.value }))} />
              <Button type="submit">Create promotion</Button>
            </form>
            {state.promotions.map((promotion) => (
              <article key={promotion.code} className="surface-card">
                <strong>{promotion.code}</strong>
                <p>{promotion.label}</p>
              </article>
            ))}
          </section>
        ) : null}

        {location.pathname === '/admin/customers' ? (
          <section className="stack-panel">
            {state.customers.map((customer) => (
              <article key={customer.id} className="surface-card">
                <strong>{customer.name}</strong>
                <p>{customer.email}</p>
                <small>{customer.orderCount} orders</small>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  )
}
