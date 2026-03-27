# Architecture

## Overview

The app is a single Next.js 16 App Router product platform with server-first rendering, locale-prefixed routing, seeded multi-tenant authz, SSE live updates, and in-process operational state.

- `app/` owns the route tree, route handlers, layouts, redirects, metadata, and protected boundaries.
- `src/modules/*` owns the shell and product modules: feed, dashboards, search, notifications, collaboration, jobs, observability, and experiments.
- `src/server/platform-store.ts` owns the seeded source-of-truth state for sessions, memberships, feed, notifications, jobs, observability, experiments, and collaboration threads.
- `src/server/auth.ts` owns session resolution, scoped access checks, and module-level route authorization.
- `src/server/actions.ts` owns authenticated mutations and cache invalidation.
- `src/server/runtime.ts` owns the in-process job ticker.
- `app/api/stream/route.ts` exposes authenticated SSE for scoped realtime updates.

## Route model

- Public:
  - `/:locale/login`
- Authenticated redirect:
  - `/:locale`
- Authenticated product routes:
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/feed`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/dashboards`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/search`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/notifications`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/collaboration`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/jobs`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/observability`
  - `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/experiments`

## Tenant and permission model

- Every session belongs to one seeded user and may access multiple `(org, workspace, product, environment)` scopes.
- The session stores one active scope and the shell can switch it through a server action.
- Page access is enforced server-side:
  - scoped membership match
  - module-level role match
- Module policies:
  - `feed`, `dashboards`, `search`, `notifications`, `collaboration`: all scoped roles
  - `jobs`: `owner`, `admin`, `engineer`
  - `observability`: `owner`, `admin`, `engineer`, `analyst`
  - `experiments`: `owner`, `admin`, `product_manager`, `analyst`

## Realtime and cache model

- SSE under `/api/stream` broadcasts tenant-scoped `feed`, `notification`, `presence`, `job`, and `experiment` events.
- `unstable_cache` is used for expensive shared reads on feed, dashboards, jobs, observability, and experiments.
- Server actions and route handlers explicitly revalidate related tags after mutations.
- No functional fallbacks are used. Unauthorized, missing, or invalid operations fail explicitly.

## Code ownership boundaries

- `app/`: routing and transport boundaries
- `src/server/`: authoritative auth, state, actions, and cache ownership
- `src/lib/`: shared contracts and permissions
- `src/modules/`: feature-owned rendering and client islands
