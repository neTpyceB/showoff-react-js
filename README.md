# Showoff React.js

Production-grade Kanban task manager built with React, TypeScript, Docker, and a browser-tested verification pipeline. The app includes auth, protected routes, team spaces, drag-and-drop task movement, optimistic updates, cached server sync, and permission-aware workflows.

## Product scope

- Public login route with seeded users
- Protected team-space routes
- Role-based permissions for admin, editor, and viewer
- Cached board and space queries through TanStack Query
- Optimistic drag-and-drop task movement with rollback on failure
- Explicit task move controls for accessible board operations
- Server-style local sync through a typed mock API boundary

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Router 7
- TanStack Query 5
- dnd-kit
- React Hook Form + Zod
- Vitest + Testing Library
- Playwright + axe-core
- Docker + GitHub Actions

## URL access model

- `/login`: public
- `/`: redirects based on authenticated session
- `/spaces/:spaceId`: protected and membership-scoped

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Docker

```bash
docker compose up --build app preview
```

Open [http://localhost:5173](http://localhost:5173) for dev mode and [http://localhost:4173](http://localhost:4173) for preview mode.

## Verification

```bash
make verify
```

That runs linting, type checks, unit tests, smoke tests, a production build, and Playwright browser e2e.
Browser e2e runs against a fresh Vite server so it always exercises the current source, while the build step separately validates the production bundle.

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
