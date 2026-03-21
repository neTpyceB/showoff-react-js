# Showoff React.js

Production-grade personal finance tracker built with React, TypeScript, Vite, Docker, and a full browser-tested verification pipeline. The app covers transaction entry, category modeling, reducer-driven state, derived analytics, filters, local persistence, and custom chart components.

## Product scope

- Add and delete transactions with schema validation
- Filter by search, transaction kind, category, and period
- Derived balance, income, expense, and savings-rate metrics
- Expense breakdown and six-month trend charts
- Local persistence through a custom reducer hook

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Hook Form + Zod
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

That runs linting, type checks, unit tests, smoke tests, production build, and Playwright browser e2e.

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
