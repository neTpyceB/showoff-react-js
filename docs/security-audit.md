# Security Audit

## Baseline review

- `/:locale/login` is the only public UI surface.
- `/:locale/app/*` routes are protected by proxy-level session checks and route-level scoped authorization.
- Authenticated-but-out-of-scope users are redirected to an explicit forbidden screen rather than silently falling back.
- Sensitive APIs return explicit `401` or `403` responses.
- SSE under `/api/stream` requires authentication and filters events by scope key.
- Session ownership stays server-side through the `product_platform_session` HTTP-only cookie.

## Module access review

- `jobs` is limited to `owner`, `admin`, and `engineer`.
- `observability` is limited to `owner`, `admin`, `engineer`, and `analyst`.
- `experiments` is limited to `owner`, `admin`, `product_manager`, and `analyst`.
- Search, feed, notifications, collaboration, and dashboards require scoped membership but no elevated role.

## Exposure notes

- Local verification surfaces:
  - `127.0.0.1:5173`
  - `127.0.0.1:4173`
- `/api/search` rejects anonymous requests with `401`.
- `/api/observability/query` rejects unauthorized scoped roles with `403`.
- External integrations are intentionally emulated inside the repository.
- Current state is in-memory and local-only; a real deployment would need durable session storage, CSRF controls, rate limiting, and hardened headers.
