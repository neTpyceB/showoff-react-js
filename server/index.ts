import { createServer as createHttpServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import {
  addCartItemSchema,
  analyticsRequestSchema,
  catalogQuerySchema,
  checkoutConfirmSchema,
  checkoutRequestSchema,
  createPromotionSchema,
  loginRequestSchema,
  sessionSchema,
  updateCartItemSchema,
  updateInventorySchema,
  updateOrderSchema,
  updateProductSchema,
} from '../src/commerce/model.ts'
import { App } from '../src/App.tsx'
import { ToastProvider } from '../src/components/ToastProvider.tsx'
import { createEmptyAppState, type AppState, type SeoMeta } from '../src/commerce/state.ts'
import { CommerceStore } from './store.ts'

const sessionCookieName = 'showoff_store_session'

const args = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]

  if (key?.startsWith('--') && value) {
    args.set(key, value)
  }
}

const host = args.get('--host') ?? '127.0.0.1'
const mode = args.get('--mode') ?? 'preview'
const port = Number(args.get('--port') ?? (mode === 'preview' ? '4173' : '5173'))

const store = new CommerceStore()
const app = express()
const httpServer = createHttpServer(app)
const vite =
  mode === 'dev'
    ? await (async () => {
        const { createServer } = await import('vite')

        return createServer({
          server: { middlewareMode: true },
          appType: 'custom',
        })
      })()
    : null

type Locals = {
  userId: string | null
}

const getUserId = (request: Request) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined
  return store.getUserIdForSession(sessionId)
}

const requireRole =
  (allowedRoles: Array<'customer' | 'admin'>) =>
  (request: Request, response: Response<unknown, Locals>, next: NextFunction) => {
    const userId = getUserId(request)

    if (!userId) {
      response.status(401).json({ message: 'Authentication is required.' })
      return
    }

    const session = store.getSessionPayload(userId)

    if (!session || session.role === 'guest' || !allowedRoles.includes(session.role)) {
      response.status(403).json({ message: 'You do not have access to this resource.' })
      return
    }

    response.locals.userId = userId
    next()
  }

const withOptionalSession = (
  request: Request,
  response: Response<unknown, Locals>,
  next: NextFunction,
) => {
  response.locals.userId = getUserId(request)
  next()
}

const escapeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

const buildSeo = (pathname: string, search: URLSearchParams, state: AppState): SeoMeta => {
  if (pathname === '/') {
    return {
      title: 'Showoff Electronics',
      description: 'Premium electronics storefront with curated devices, fast checkout, and operational admin tooling.',
      canonicalPath: '/',
    }
  }

  if (pathname === '/catalog' || pathname === '/search') {
    const q = search.get('q')
    return {
      title: q ? `Search: ${q} | Showoff Electronics` : 'Catalog | Showoff Electronics',
      description: 'Browse flagship electronics, creator gear, travel audio, and high-end desk setups.',
      canonicalPath: pathname === '/search' ? `/search${search.toString() ? `?${search.toString()}` : ''}` : '/catalog',
    }
  }

  if (pathname.startsWith('/catalog/') && state.product) {
    return {
      title: `${state.product.product.name} | Showoff Electronics`,
      description: state.product.product.description,
      canonicalPath: pathname,
      structuredData: store.getStructuredProduct(state.product.product.slug),
    }
  }

  if (pathname === '/cart') {
    return {
      title: 'Cart | Showoff Electronics',
      description: 'Review line items, apply promotions, and prepare for checkout.',
      canonicalPath: pathname,
    }
  }

  if (pathname === '/checkout') {
    return {
      title: 'Checkout | Showoff Electronics',
      description: 'Secure purchase flow with shipping details and Stripe-style test checkout.',
      canonicalPath: pathname,
    }
  }

  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin | Showoff Electronics',
      description: 'Operational commerce dashboard for products, inventory, orders, and promotions.',
      canonicalPath: pathname,
    }
  }

  return {
    title: 'Showoff Electronics',
    description: 'Premium electronics storefront with account and admin experiences.',
    canonicalPath: pathname,
  }
}

const buildState = (request: Request): { state: AppState; redirect?: string } => {
  const url = new URL(request.originalUrl, `http://${host}:${port}`)
  const pathname = url.pathname
  const userId = getUserId(request)
  const session = store.getSessionPayload(userId)
  const state = createEmptyAppState()

  state.session = session
  state.bootstrap = store.getBootstrap(userId)
  state.cart = store.getCart(userId)
  state.promotions = store.getPromotions()

  if (pathname === '/' || pathname === '/catalog' || pathname === '/search') {
    const query = catalogQuerySchema.parse({
      q: url.searchParams.get('q') ?? '',
      category: url.searchParams.get('category') ?? 'all',
      brand: url.searchParams.get('brand') ?? 'all',
      availability: url.searchParams.get('availability') ?? 'all',
      rating: url.searchParams.get('rating') ?? '0',
      priceMin: url.searchParams.get('priceMin') ?? '0',
      priceMax: url.searchParams.get('priceMax') ?? '5000',
      sort: url.searchParams.get('sort') ?? 'featured',
    })

    state.catalog = store.getCatalog(query)
  }

  if (pathname.startsWith('/catalog/')) {
    const slug = pathname.replace('/catalog/', '')
    state.product = store.getProduct(slug)
  }

  if (pathname.startsWith('/account')) {
    if (!session || session.role !== 'customer') {
      return { state, redirect: '/login' }
    }

    state.accountOrders = store.getOrdersForCustomer(session.id)
    const profile = store.getAccountProfile(session.id)
    state.profile = {
      user: session,
      savedAddresses: profile.savedAddresses,
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      return { state, redirect: '/login' }
    }

    state.adminSummary = store.getAdminSummary()
    state.adminProducts = store.getAdminProducts()
    state.adminOrders = store.getAdminOrders()
    state.inventory = store.getInventory()
    state.customers = store.getAdminCustomers()
  }

  if (pathname === '/checkout/success' && session) {
    const sessionId = url.searchParams.get('session_id')

    if (sessionId) {
      try {
        state.lastOrder = store.confirmCheckout(sessionId)
        state.accountOrders = store.getOrdersForCustomer(session.id)
      } catch {
        state.lastOrder = null
      }
      state.cart = store.getCart(session.id)
    }
  }

  state.seo = buildSeo(pathname, url.searchParams, state)
  return { state }
}

const renderPage = async (request: Request, response: Response) => {
  const { state, redirect } = buildState(request)

  if (redirect) {
    response.redirect(302, redirect)
    return
  }

  const appHtml = renderToString(
    createElement(
      StaticRouter,
      { location: request.originalUrl },
      createElement(ToastProvider, null, createElement(App, { initialState: state })),
    ),
  )

  const payloadScript = `<script>window.__APP_STATE__=${escapeJson(state)}</script>`
  const metaScript = state.seo.structuredData
    ? `<script type="application/ld+json">${escapeJson(state.seo.structuredData)}</script>`
    : ''

  if (mode === 'dev') {
    const template = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const html = await vite!.transformIndexHtml(
      request.originalUrl,
      template
        .replace(/<title>.*<\/title>/, `<title>${state.seo.title}</title>`)
        .replace(
          '</head>',
          `<meta name="description" content="${state.seo.description}" />
<link rel="canonical" href="${state.seo.canonicalPath}" />
${metaScript}
</head>`,
        )
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${payloadScript}`),
    )

    response.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    return
  }

  const template = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8')
  const html = template
    .replace(/<title>.*<\/title>/, `<title>${state.seo.title}</title>`)
    .replace(
      '</head>',
      `<meta name="description" content="${state.seo.description}" />
<link rel="canonical" href="${state.seo.canonicalPath}" />
${metaScript}
</head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${payloadScript}`)

  response.status(200).set({ 'Content-Type': 'text/html' }).end(html)
}

app.disable('x-powered-by')
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(withOptionalSession)

if (mode !== 'dev') {
  app.use(express.static(resolve(process.cwd(), 'dist'), { index: false }))
}

app.get('/api/healthz', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/session', (_request, response: Response<unknown, Locals>) => {
  response.json(sessionSchema.nullable().parse(store.getSessionPayload(response.locals.userId)))
})

app.post('/api/session/login', (request, response) => {
  const input = loginRequestSchema.parse(request.body)
  const sessionId = store.createSession(input.userId)
  const session = store.getSessionPayload(input.userId)

  response.cookie(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })
  response.status(201).json(session)
})

app.post('/api/session/logout', (request, response) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined

  if (sessionId) {
    store.destroySession(sessionId)
  }

  response.clearCookie(sessionCookieName, { path: '/' })
  response.status(204).end()
})

app.get('/api/bootstrap', (_request, response: Response<unknown, Locals>) => {
  response.json(store.getBootstrap(response.locals.userId))
})

app.get('/api/catalog', (request, response) => {
  response.json(
    store.getCatalog(
      catalogQuerySchema.parse({
        q: request.query.q ?? '',
        category: request.query.category ?? 'all',
        brand: request.query.brand ?? 'all',
        availability: request.query.availability ?? 'all',
        rating: request.query.rating ?? '0',
        priceMin: request.query.priceMin ?? '0',
        priceMax: request.query.priceMax ?? '5000',
        sort: request.query.sort ?? 'featured',
      }),
    ),
  )
})

app.get('/api/search', (request, response) => {
  response.json(
    store.getCatalog(
      catalogQuerySchema.parse({
        q: request.query.q ?? '',
        category: request.query.category ?? 'all',
        brand: request.query.brand ?? 'all',
        availability: request.query.availability ?? 'all',
        rating: request.query.rating ?? '0',
        priceMin: request.query.priceMin ?? '0',
        priceMax: request.query.priceMax ?? '5000',
        sort: request.query.sort ?? 'featured',
      }),
    ),
  )
})

app.get('/api/products/:slug', (request, response) => {
  response.json(store.getProduct(String(request.params.slug)))
})

app.get('/api/cart', (_request, response: Response<unknown, Locals>) => {
  response.json(store.getCart(response.locals.userId))
})

app.post('/api/cart/items', requireRole(['customer']), (request, response: Response<unknown, Locals>) => {
  const input = addCartItemSchema.parse(request.body)
  response.status(201).json(
    store.addCartItem(response.locals.userId!, input.productId, input.variantId, input.quantity),
  )
})

app.patch('/api/cart/items/:itemId', requireRole(['customer']), (request, response: Response<unknown, Locals>) => {
  const input = updateCartItemSchema.parse(request.body)
  response.json(store.updateCartItem(response.locals.userId!, String(request.params.itemId), input.quantity))
})

app.delete('/api/cart/items/:itemId', requireRole(['customer']), (request, response: Response<unknown, Locals>) => {
  response.json(store.removeCartItem(response.locals.userId!, String(request.params.itemId)))
})

app.post('/api/cart/promo', requireRole(['customer']), (request, response: Response<unknown, Locals>) => {
  response.json(store.applyPromotion(response.locals.userId!, String(request.body?.code ?? '')))
})

app.post('/api/checkout/session', requireRole(['customer']), (request, response: Response<unknown, Locals>) => {
  const input = checkoutRequestSchema.parse(request.body)
  response.status(201).json(
    store.createCheckoutSession(response.locals.userId!, input.address, input.shippingMethod),
  )
})

app.post('/api/checkout/confirm', requireRole(['customer']), (request, response) => {
  const input = checkoutConfirmSchema.parse(request.body)
  response.status(201).json(store.confirmCheckout(input.sessionId))
})

app.get('/api/account/orders', requireRole(['customer']), (_request, response: Response<unknown, Locals>) => {
  response.json(store.getOrdersForCustomer(response.locals.userId!))
})

app.get('/api/account/profile', requireRole(['customer']), (_request, response: Response<unknown, Locals>) => {
  response.json(store.getAccountProfile(response.locals.userId!))
})

app.get('/api/admin/summary', requireRole(['admin']), (_request, response) => {
  response.json(store.getAdminSummary())
})

app.get('/api/admin/products', requireRole(['admin']), (_request, response) => {
  response.json(store.getAdminProducts())
})

app.patch('/api/admin/products/:productId', requireRole(['admin']), (request, response) => {
  const input = updateProductSchema.parse(request.body)
  response.json(store.updateProduct(String(request.params.productId), input.badge, input.featured))
})

app.get('/api/admin/orders', requireRole(['admin']), (_request, response) => {
  response.json(store.getAdminOrders())
})

app.patch('/api/admin/orders/:orderId', requireRole(['admin']), (request, response) => {
  const input = updateOrderSchema.parse(request.body)
  response.json(store.updateOrder(String(request.params.orderId), input.status))
})

app.get('/api/admin/inventory', requireRole(['admin']), (_request, response) => {
  response.json(store.getInventory())
})

app.patch('/api/admin/inventory/:sku', requireRole(['admin']), (request, response) => {
  const input = updateInventorySchema.parse(request.body)
  response.json(store.updateInventory(String(request.params.sku), input.inventory))
})

app.get('/api/admin/promotions', requireRole(['admin']), (_request, response) => {
  response.json(store.getPromotions())
})

app.post('/api/admin/promotions', requireRole(['admin']), (request, response) => {
  const input = createPromotionSchema.parse(request.body)
  response.status(201).json(
    store.createPromotion({
      code: input.code,
      label: input.label,
      type: input.type,
      amount: input.amount,
      active: true,
    }),
  )
})

app.get('/api/admin/customers', requireRole(['admin']), (_request, response) => {
  response.json(store.getAdminCustomers())
})

app.post('/api/analytics/events', (request, response) => {
  const input = analyticsRequestSchema.parse(request.body)
  store.captureAnalytics({
    type: input.type,
    detail: input.detail,
    createdAt: new Date().toISOString(),
  })
  response.status(202).json({ accepted: true })
})

app.use((request, response, next) => {
  const session = store.getSessionPayload(getUserId(request))

  if ((request.path === '/account' || request.path.startsWith('/account/')) && (!session || session.role !== 'customer')) {
    response.redirect(302, '/login')
    return
  }

  if ((request.path === '/admin' || request.path.startsWith('/admin/')) && (!session || session.role !== 'admin')) {
    response.redirect(302, '/login')
    return
  }

  next()
})

if (vite) {
  app.use((request, response, next) => {
    if (request.path.startsWith('/api') || request.path.startsWith('/@') || request.path.includes('.')) {
      next()
      return
    }

    void renderPage(request, response)
  })
  app.use(vite.middlewares)
} else {
  app.use((request, response) => {
    void renderPage(request, response)
  })
}

httpServer.listen(port, host, () => {
  console.log(`commerce server listening on http://${host}:${port}`)
})
