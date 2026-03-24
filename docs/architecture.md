# Architecture

## Overview

The app is structured around a same-origin React SSR admin shell plus a local Express backend:

- `src/platform/model.ts` defines the shared typed contracts for sessions, organizations, roles, billing, feature flags, audit entries, plugins, and module descriptors.
- `src/platform/access.ts` owns module registry metadata and the pure authorization rules for `(role + entitlement + feature flag)`.
- `server/store.ts` owns seeded organizations, membership partitioning, session state, audit writing, billing state, and plugin activation.
- `server/index.ts` exposes authenticated org-scoped HTTP routes and server-side renders route-specific HTML with metadata and embedded initial state.
- `src/platform/api.ts` is the browser HTTP boundary.
- `src/platform/client.tsx` owns client refresh flows for login, org switching, and module updates.
- `src/components/SaasPages.tsx` contains the routed admin shell and internal module surfaces.

## Routing and access

- Public route:
  - `/login`
- Authenticated root:
  - `/`
- Authenticated org routes:
  - `/orgs/:orgId/overview`
  - `/orgs/:orgId/members`
  - `/orgs/:orgId/billing`
  - `/orgs/:orgId/flags`
  - `/orgs/:orgId/audit`
  - `/orgs/:orgId/plugins`

Access is enforced by:

- session cookie presence
- org membership match
- role thresholds
- plan entitlements
- feature flag requirements

## Tenant boundary model

- A session can belong to multiple organizations.
- The server keeps one current organization in the session record.
- Every protected read and mutation is explicitly scoped by `orgId`.
- Server mutations write immutable audit entries inside the same org boundary.
- The module registry is filtered per organization and per role before navigation is rendered.

## Backend contracts

- Session:
  - `GET /api/session`
  - `POST /api/session/login`
  - `POST /api/session/logout`
  - `POST /api/session/switch-organization`
- Bootstrap:
  - `GET /api/bootstrap`
- Organization modules:
  - `GET /api/orgs/:orgId/overview`
  - `GET /api/orgs/:orgId/members`
  - `PATCH /api/orgs/:orgId/members/:memberId`
  - `GET /api/orgs/:orgId/billing`
  - `PATCH /api/orgs/:orgId/billing`
  - `GET /api/orgs/:orgId/flags`
  - `PATCH /api/orgs/:orgId/flags/:flagKey`
  - `GET /api/orgs/:orgId/audit`
  - `GET /api/orgs/:orgId/plugins`
  - `PATCH /api/orgs/:orgId/plugins/:pluginId`

## State model

- The server owns the source-of-truth tenant data in memory for the seeded demo.
- SSR embeds an initial `AppState` snapshot for the requested route.
- The client refreshes bootstrap state after login, org switching, and mutating module actions.
- Module views fetch their own org-scoped slice on navigation while preserving the shared admin shell.

## Code ownership boundaries

- `src/platform/*`: shared contracts, access rules, and browser state edges.
- `server/*`: authoritative authz, tenant isolation, audit logging, and mutation services.
- `src/components/*`: app shell composition and module presentation.
- New modules should enter through the registry and keep their store and UI slices localized instead of editing the shell in multiple places.
