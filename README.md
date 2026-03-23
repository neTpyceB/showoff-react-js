# Showoff React.js

Production-style electronics e-commerce frontend built with React, TypeScript, Express SSR, Docker, and browser-tested verification. The app ships as a same-origin storefront with SEO-capable SSR routes, catalog and search, filters, PDPs, cart, checkout, account pages, and an operational admin area.

## Product scope

- Public storefront routes on `/`, `/catalog`, `/catalog/:slug`, `/search`, `/cart`, `/checkout`, `/checkout/success`, and `/login`
- Protected customer routes on `/account/*`
- Protected admin routes on `/admin/*`
- Same-origin SSR plus JSON APIs
- Seeded catalog, customers, carts, promotions, orders, and admin data
- Cart updates, promo codes, checkout session creation, order confirmation, analytics events
- Customer account history and addresses
- Admin product, inventory, order, promotion, and customer views

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

- `/`, `/catalog`, `/catalog/:slug`, `/search`, `/cart`, `/checkout`, `/checkout/success`, `/login`: public
- `/account/*`: customer-only
- `/admin/*`: admin-only
- `/api/account/*`: customer-only
- `/api/admin/*`: admin-only
- `/api/checkout/*`: customer-only
- `/api/analytics/events`: server-owned ingestion endpoint

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

That runs linting, type checks, unit tests, smoke tests, a production build, and browser e2e against an isolated preview port.

## Demo accounts

- Customer: `Maya Brooks`
- Admin: `Evan Stone`

## Documentation

- [AGENTS.md](./AGENTS.md)
- [Architecture](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Engineering Rules](./docs/engineering-rules.md)
- [Security Audit](./docs/security-audit.md)
