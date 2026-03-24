import { readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { getAuthorizedModules, getDefaultModulePath, moduleRegistry } from '../src/platform/access.ts'
import {
  featureFlagKeySchema,
  loginRequestSchema,
  switchOrganizationSchema,
  updateBillingPlanSchema,
  updateFeatureFlagSchema,
  updateMemberRoleSchema,
  updatePluginSchema,
  type ModuleId,
} from '../src/platform/model.ts'
import { createEmptyAppState, type AppState, type SeoMeta } from '../src/platform/state.ts'
import { App } from '../src/App.tsx'
import { ToastProvider } from '../src/components/ToastProvider.tsx'
import { PlatformStore } from './store.ts'

const sessionCookieName = 'northstar_admin_session'
const store = new PlatformStore()

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

const app = express()
const httpServer = createHttpServer(app)
const vite =
  mode === 'dev'
    ? await (async () => {
        const { createServer } = await import('vite')

        return createServer({
          server: { middlewareMode: true, hmr: false },
          appType: 'custom',
        })
      })()
    : null

const escapeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

const getUserId = (request: Request) => {
  const sessionId = request.cookies[sessionCookieName] as string | undefined
  return store.getUserIdForSession(sessionId)
}

const readLocalUserId = (response: Response) => response.locals.userId as string | null

const withOptionalSession = (request: Request, response: Response, next: NextFunction) => {
  response.locals.userId = getUserId(request)
  next()
}

const requireAuth = (_request: Request, response: Response, next: NextFunction) => {
  const userId = readLocalUserId(response)

  if (!userId) {
    response.status(401).json({ message: 'Authentication is required.' })
    return
  }

  next()
}

const requireOrganizationAccess = (
  request: Request<{ orgId: string }>,
  response: Response,
  next: NextFunction,
) => {
  const userId = readLocalUserId(response)
  const orgId = request.params.orgId

  if (!userId) {
    response.status(401).json({ message: 'Authentication is required.' })
    return
  }

  const session = store.getSessionPayload(userId)
  const membership = session?.memberships.find((entry) => entry.orgId === orgId)

  if (!membership) {
    response.status(403).json({ message: 'You do not belong to this organization.' })
    return
  }

  next()
}

const moduleIdForPath = (pathname: string): ModuleId | null => {
  if (/^\/orgs\/[^/]+$/.test(pathname) || /^\/orgs\/[^/]+\/overview$/.test(pathname)) {
    return 'overview'
  }

  return moduleRegistry.find((module) => pathname.endsWith(module.path))?.id ?? null
}

const buildSeo = (pathname: string, state: AppState): SeoMeta => {
  const currentOrg = state.bootstrap.currentOrganization
  const moduleId = moduleIdForPath(pathname)
  const module = moduleRegistry.find((entry) => entry.id === moduleId)

  if (pathname === '/login') {
    return {
      title: 'Northstar Admin Login',
      description: 'Seeded multi-tenant SaaS admin access with role-aware workspaces.',
      canonicalPath: '/login',
    }
  }

  if (state.routeError) {
    return {
      title: 'Access Denied | Northstar Admin',
      description: 'Protected SaaS admin route denied by role, entitlement, or organization boundary.',
      canonicalPath: pathname,
    }
  }

  return {
    title: currentOrg && module ? `${module.label} | ${currentOrg.name} | Northstar Admin` : 'Northstar Admin',
    description: module?.description ?? 'Multi-tenant SaaS admin system with org isolation and auditable change flows.',
    canonicalPath: pathname,
  }
}

const buildState = (request: Request): { state: AppState; redirect?: string; status?: number } => {
  const url = new URL(request.originalUrl, `http://${host}:${port}`)
  const pathname = url.pathname
  const state = createEmptyAppState()
  const userId = getUserId(request)
  const session = store.getSessionPayload(userId)

  state.session = session
  state.bootstrap = store.getBootstrap(userId)

  if (pathname === '/login') {
    state.seo = buildSeo(pathname, state)
    return { state }
  }

  if (!session) {
    return { state, redirect: '/login' }
  }

  if (pathname === '/') {
    const currentOrganization = state.bootstrap.currentOrganization
    const membership = session.memberships.find((entry) => entry.orgId === currentOrganization?.id)

    if (!currentOrganization || !membership) {
      return { state, status: 403 }
    }

    return { state, redirect: getDefaultModulePath(membership.role, currentOrganization) }
  }

  const routeMatch = pathname.match(/^\/orgs\/([^/]+)/)
  if (!routeMatch) {
    state.seo = buildSeo(pathname, state)
    return { state }
  }

  const orgId = routeMatch[1] ?? ''
  const currentMembership = session.memberships.find((entry) => entry.orgId === orgId)
  const currentOrganization = state.bootstrap.organizations.find((entry) => entry.id === orgId) ?? null
  const moduleId = moduleIdForPath(pathname)

  if (!currentMembership || !currentOrganization) {
    state.routeError = { status: 403, message: 'You do not belong to this organization.' }
    state.seo = buildSeo(pathname, state)
    return { state, status: 403 }
  }

  const allowedModules = getAuthorizedModules(currentMembership.role, currentOrganization).map((module) => module.id)
  if (moduleId && !allowedModules.includes(moduleId)) {
    state.routeError = { status: 403, message: 'You do not have access to this module.' }
    state.seo = buildSeo(pathname, state)
    return { state, status: 403 }
  }

  state.bootstrap.currentOrganization = currentOrganization
  if (moduleId === 'overview') {
    state.overview = store.getOverview(orgId)
  }
  if (moduleId === 'members') {
    state.members = store.getMembers(orgId)
  }
  if (moduleId === 'billing') {
    state.billing = store.getBilling(orgId)
  }
  if (moduleId === 'flags') {
    state.featureFlags = store.getFeatureFlags(orgId)
  }
  if (moduleId === 'audit') {
    state.auditEntries = store.getAuditEntries(orgId)
  }
  if (moduleId === 'plugins') {
    state.plugins = store.getPlugins(orgId)
  }

  state.seo = buildSeo(pathname, state)
  return { state }
}

const renderPage = async (request: Request, response: Response) => {
  const { state, redirect, status = 200 } = buildState(request)

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
</head>`,
        )
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${payloadScript}`),
    )

    response.status(status).set({ 'Content-Type': 'text/html' }).end(html)
    return
  }

  const template = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8')
  const html = template
    .replace(/<title>.*<\/title>/, `<title>${state.seo.title}</title>`)
    .replace(
      '</head>',
      `<meta name="description" content="${state.seo.description}" />
<link rel="canonical" href="${state.seo.canonicalPath}" />
</head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${payloadScript}`)

  response.status(status).set({ 'Content-Type': 'text/html' }).end(html)
}

app.disable('x-powered-by')
app.use(cookieParser())
app.use(express.json({ limit: '512kb' }))
app.use(withOptionalSession)

if (mode !== 'dev') {
  app.use(express.static(resolve(process.cwd(), 'dist'), { index: false }))
}

app.get('/api/healthz', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/session', (_request, response) => {
  response.json(store.getSessionPayload(readLocalUserId(response)))
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

app.post('/api/session/switch-organization', requireAuth, (request, response) => {
  const input = switchOrganizationSchema.parse(request.body)
  store.switchOrganization(readLocalUserId(response)!, input.orgId)
  response.json(store.getSessionPayload(readLocalUserId(response)!))
})

app.get('/api/bootstrap', (_request, response) => {
  response.json(store.getBootstrap(readLocalUserId(response)))
})

app.get('/api/orgs/:orgId/overview', requireOrganizationAccess, (request, response) => {
  response.json(store.getOverview(request.params.orgId))
})

app.get('/api/orgs/:orgId/members', requireOrganizationAccess, (request, response) => {
  response.json(store.getMembers(request.params.orgId))
})

app.patch('/api/orgs/:orgId/members/:memberId', requireOrganizationAccess, (request, response) => {
  try {
    const input = updateMemberRoleSchema.parse(request.body)
    const params = request.params as { orgId: string; memberId: string }
    response.json(store.updateMemberRole(readLocalUserId(response)!, params.orgId, params.memberId, input.role))
  } catch (error) {
    response.status(403).json({ message: error instanceof Error ? error.message : 'Request failed.' })
  }
})

app.get('/api/orgs/:orgId/billing', requireOrganizationAccess, (request, response) => {
  response.json(store.getBilling(request.params.orgId))
})

app.patch('/api/orgs/:orgId/billing', requireOrganizationAccess, (request, response) => {
  try {
    const input = updateBillingPlanSchema.parse(request.body)
    response.json(store.updateBillingPlan(readLocalUserId(response)!, request.params.orgId, input.plan))
  } catch (error) {
    response.status(403).json({ message: error instanceof Error ? error.message : 'Request failed.' })
  }
})

app.get('/api/orgs/:orgId/flags', requireOrganizationAccess, (request, response) => {
  response.json(store.getFeatureFlags(request.params.orgId))
})

app.patch('/api/orgs/:orgId/flags/:flagKey', requireOrganizationAccess, (request, response) => {
  try {
    const input = updateFeatureFlagSchema.parse(request.body)
    const params = request.params as { orgId: string; flagKey: string }
    response.json(
      store.updateFeatureFlag(
        readLocalUserId(response)!,
        params.orgId,
        featureFlagKeySchema.parse(params.flagKey),
        input.enabled,
      ),
    )
  } catch (error) {
    response.status(403).json({ message: error instanceof Error ? error.message : 'Request failed.' })
  }
})

app.get('/api/orgs/:orgId/audit', requireOrganizationAccess, (request, response) => {
  response.json(store.getAuditEntries(request.params.orgId))
})

app.get('/api/orgs/:orgId/plugins', requireOrganizationAccess, (request, response) => {
  response.json(store.getPlugins(request.params.orgId))
})

app.patch('/api/orgs/:orgId/plugins/:pluginId', requireOrganizationAccess, (request, response) => {
  try {
    const input = updatePluginSchema.parse(request.body)
    const params = request.params as { orgId: string; pluginId: string }
    response.json(store.updatePlugin(readLocalUserId(response)!, params.orgId, params.pluginId, input.enabled))
  } catch (error) {
    response.status(403).json({ message: error instanceof Error ? error.message : 'Request failed.' })
  }
})

app.use('/api', (_request, response) => {
  response.status(404).json({ message: 'Route not found.' })
})

if (mode === 'dev') {
  app.use(vite!.middlewares)
}

app.use((request, response) => {
  if (
    request.path.startsWith('/api/') ||
    request.path.startsWith('/@vite') ||
    request.path.includes('.') ||
    request.path.startsWith('/src/')
  ) {
    response.status(404).end()
    return
  }

  void renderPage(request, response)
})

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, host, () => {
    console.log(`saas admin server listening on http://${host}:${port}`)
  })
}

export { app, httpServer }
