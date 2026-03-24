# Security Audit

## Baseline review

- `/login` is the only public UI route.
- All `/orgs/:orgId/*` pages require an authenticated session cookie.
- All `/api/orgs/:orgId/*` routes require both authentication and matching organization membership.
- Sensitive modules are additionally gated by role, billing entitlements, and feature flags.
- Cross-tenant access attempts return explicit `403` responses rather than silently falling back to another organization.
- Every mutating admin action writes an immutable audit entry in the same tenant boundary.
- Session ownership stays server-side through an HTTP-only cookie.

## Exposure notes

- `127.0.0.1:5173` and `127.0.0.1:4173` are intentional local-only development surfaces.
- The e2e runner uses the server in dev middleware mode so browser tests always exercise current source, not stale build artifacts.
- No external billing or identity providers are wired in this showcase; all integrations are intentionally emulated.
- The current in-memory store is local-only and should be replaced with durable storage before any real deployment.
- A real deployment should add CSRF protection, durable session storage, rate limiting, security headers review, and append-only audit persistence.
