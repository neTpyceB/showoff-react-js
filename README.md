# Showoff React.js

Production-style product operations platform built with Next.js 16 App Router, React 19, TypeScript, Server Components, SSE, strict server-owned authz, Docker, and browser-tested verification.

## Product scope

- Locale-prefixed entry routes on `/en/*` and `/de/*`
- Public login on `/:locale/login`
- Authenticated product shell on `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/*`
- Feed, dashboards, search, notifications, collaboration, jobs, observability, and experiments
- Multi-organization seeded users with scoped roles and server-owned sessions
- SSE for notifications, feed updates, job status, and scoped presence
- Server actions for context switching and authenticated mutations
- Strict route and API boundaries with explicit `401` and `403` behavior

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Zod
- Vitest + Testing Library
- Playwright + axe-core
- Docker + GitHub Actions

## URL access model

- `/:locale/login`: public
- `/:locale`: authenticated redirect into the session’s current context
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/feed`: any scoped member
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/dashboards`: any scoped member
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/search`: any scoped member
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/notifications`: any scoped member
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/collaboration`: any scoped member
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/jobs`: `owner`, `admin`, `engineer`
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/observability`: `owner`, `admin`, `engineer`, `analyst`
- `/:locale/app/:orgSlug/:workspaceSlug/:productSlug/:environmentSlug/experiments`: `owner`, `admin`, `product_manager`, `analyst`
- `/api/search`: authenticated only
- `/api/observability/query`: authenticated plus observability-capable role
- `/api/jobs/*`, `/api/experiments/*`, `/api/collaboration/*`, `/api/notifications/*`: authenticated and server-authorized

## Local run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173/en/login](http://127.0.0.1:5173/en/login).

## Docker

```bash
docker compose up --build app preview
```

Open:

- [http://127.0.0.1:5173/en/login](http://127.0.0.1:5173/en/login) for the dev container
- [http://127.0.0.1:4173/en/login](http://127.0.0.1:4173/en/login) for the production-preview container

## Verification

```bash
make verify
```

That runs linting, type checks, unit tests, smoke tests, a production build, and Playwright browser e2e.

## Demo accounts

- `Alina Vogel`: owner across Northstar and Solstice workspaces
- `Emil Krauss`: product manager for Northstar growth scopes
- `Marta Rossi`: engineer for Northstar reliability scopes
- `Felix Brandt`: viewer for Northstar growth production

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
- [Project Plan](./docs/project-platform.md)
