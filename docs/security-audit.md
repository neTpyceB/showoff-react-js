# Security Audit

## Baseline review

- Public access is limited to storefront, search, cart, checkout, and login routes.
- Customer account routes require an authenticated customer session cookie.
- Admin routes require an authenticated admin session cookie.
- Admin JSON APIs reject non-admin access with explicit `403` responses.
- Customer checkout and account JSON APIs reject unauthenticated access with explicit `401` responses.
- Analytics ingestion stays server-owned and same-origin.
- Invalid sessions do not silently retain cart or account authority.

## Exposure notes

- `localhost:5173` and `localhost:4173` are intentional local-only development surfaces.
- No WebSocket or upload surfaces are exposed in this storefront project.
- Public routes are crawlable; account and admin routes redirect unauthenticated browser requests to `/login`.
- The current seeded in-memory store is intentionally local-only and should be replaced with durable storage before any real deployment.
- When moved to a real backend, this app should add CSRF protection, durable session storage, rate limiting, audit logs, and payment webhook signature validation.
