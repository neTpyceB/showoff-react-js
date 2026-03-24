# Showoff React.js

Production-style multi-tenant SaaS admin system built with React, TypeScript, Express SSR, Docker, and browser-tested verification. The app is organized around tenant isolation, org-scoped access control, billing entitlements, feature flags, audit logs, and plugin-like internal modules.

## Product scope

- Public login route on `/login`
- Authenticated workspace redirect on `/`
- Authenticated org routes on `/orgs/:orgId/*`
- Multi-organization seeded users with org switching
- Server-owned cookie sessions
- Org-scoped role checks, billing entitlements, and feature-flag gating
- Internal module registry for `Overview`, `Members`, `Billing`, `Feature Flags`, `Audit Logs`, and `Plugins`
- Immutable audit entries for every mutating admin action

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Router 7
- Express 5
- Zod
- Vitest + Testing Library
- Playwright + axe-core
- Docker + GitHub Actions

## URL access model

- `/login`: public
- `/`: authenticated redirect into the current organization
- `/orgs/:orgId/overview`: authenticated org member
- `/orgs/:orgId/members`: manager, admin, or owner with role-management entitlement
- `/orgs/:orgId/billing`: admin or owner with billing-controls entitlement
- `/orgs/:orgId/flags`: admin or owner with billing-controls entitlement and `advancedRoles`
- `/orgs/:orgId/audit`: admin or owner with audit-log entitlement and `auditStreaming`
- `/orgs/:orgId/plugins`: admin or owner with plugin-registry entitlement and `pluginCenter`
- `/api/orgs/:orgId/*`: authenticated org member, with server-enforced per-endpoint authorization

## Local run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Docker

```bash
docker compose up --build app preview
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) for the development stack and [http://127.0.0.1:4173](http://127.0.0.1:4173) for the production-preview stack.

## Verification

```bash
make verify
```

That runs linting, type checks, unit tests, smoke tests, a production build, and browser e2e.

## Demo accounts

- `Olivia Hart`: owner in two organizations
- `Ben Carter`: Acme Cloud admin
- `Mia Chen`: Northstar OS manager
- `Noah Park`: Acme Cloud viewer
- `Zoe Lin`: member in two organizations

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
- [Project Plan](./docs/project-saas.md)
