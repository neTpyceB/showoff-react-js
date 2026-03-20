# Showoff React.js

Production-grade React component playground built with Vite, TypeScript, Docker, and full test coverage. The app demonstrates accessible buttons, modal, tabs, dropdown actions, toast notifications, and a validated form inside a polished UI kit demo.

## Stack

- React 19
- TypeScript 5
- Vite 8
- Vitest + Testing Library
- Playwright + axe-core
- Docker + GitHub Actions

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Docker

```bash
docker compose up --build app
```

Open [http://localhost:5173](http://localhost:5173).

Preview mode:

```bash
docker compose up --build preview
```

Open [http://localhost:4173](http://localhost:4173).

## Verification

```bash
make verify
```

That runs linting, type checks, unit tests, smoke tests, production build, and browser e2e tests.

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
