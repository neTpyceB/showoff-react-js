# Showoff React.js

Production-style realtime team chat built with React, TypeScript, an Express and WebSocket backend, Docker, and browser-tested verification. The app ships as a same-origin workspace with seeded login, protected channels, live presence, typing indicators, message threads, unread state, uploads, pagination, and local draft or outbox persistence.

## Product scope

- Public seeded login on `/login`
- Protected channel routes on `/channels/:channelId`
- Same-origin HTTP API and WebSocket server
- Seeded workspace, channels, users, and message history
- Realtime presence, typing, channel updates, and message sync
- Thread panel routing driven by the selected message
- Attachment upload for images and documents
- Local draft persistence and pending-send storage
- TanStack Query caching for bootstrap, channel pages, and threads

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Router 7
- TanStack Query 5
- React Virtual
- Express 5
- ws
- Zod
- Vitest + Testing Library
- Playwright + axe-core
- Docker + GitHub Actions

## URL access model

- `/login`: public
- `/`: redirects authenticated users into the default channel
- `/channels/:channelId`: protected
- `/api/uploads/:attachmentId/content`: protected

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

Open [http://localhost:5173](http://localhost:5173) for the development stack and [http://localhost:4173](http://localhost:4173) for the production-preview stack.

## Verification

```bash
make verify
```

That runs linting, type checks, unit tests, smoke tests, a production build, and Playwright browser e2e. Browser e2e now starts its own preview server on an isolated port so repeated local runs do not collide with stale server processes.

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
