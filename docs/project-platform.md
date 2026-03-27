# World-class Product Platform Plan

## Scope and target outcomes

- Replace the previous app with a Next.js 16 App Router product operations platform.
- Demonstrate staff-level architecture through server-first rendering, scoped access control, SSE live surfaces, observability, experimentation, and operational dashboards.
- Keep the implementation minimal, explicit, and production-shaped rather than over-abstracted.

## Implemented foundation

- App Router route tree under `app/`
- Seeded server-owned session model under `src/server/platform-store.ts`
- Locale dictionaries under `src/lib/i18n.ts`
- Scoped authorization under `src/lib/permissions.ts` and `src/server/auth.ts`
- Feature modules under `src/modules/*`
- Authenticated SSE under `app/api/stream/route.ts`
- Server actions for context switching and mutations under `src/server/actions.ts`

## Completed implementation record

- Migrated the repo from the old Vite/Express app to Next.js 16 App Router.
- Implemented locale-prefixed login, scoped product shell, and current-context redirects.
- Implemented feed, dashboards, search, notifications, collaboration, jobs, observability, and experiments.
- Added server-owned session auth with HTTP-only cookies.
- Added scope-aware module authorization and explicit forbidden behavior.
- Added SSE-driven notifications, live feed updates, job status updates, and scoped presence.
- Added browser-stable context switching across organization, workspace, product, and environment.
- Added route handlers for search, observability, notifications, jobs, experiments, collaboration, session, and stream surfaces.
- Fixed real runtime issues uncovered during browser verification:
  - nested App Router `html/body` layout mismatch
  - login redirect host mismatch affecting cookies
  - invalid context switcher cascade behavior
  - incomplete cache invalidation after experiment mutations

## Remaining roadmap ideas

- richer metadata per route
- durable storage
- deeper observability drill-down
- explicit audit module for every mutation surface
- more granular experiment histories and rollout analytics

## Validation status

- Unit tests: implemented and passing
- Smoke tests: implemented and passing
- Browser e2e: implemented and passing
- Production build: passing
- Docker verification: pending in the current task until runtime packaging is rechecked after the Next migration
