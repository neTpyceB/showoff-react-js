# Security Audit

## Baseline review

- Public access is limited to `/login`.
- Channel routes require an authenticated session cookie.
- Attachment content is served through a protected route rather than a public static directory.
- Server APIs reject unauthenticated access before returning workspace, channel, thread, or upload data.
- Unsupported upload types fail explicitly.
- Invalid persisted session or local IndexedDB state does not silently impersonate a user session.

## Exposure notes

- `localhost:5173` and `localhost:4173` are intentional local-only development surfaces.
- `/ws` is same-origin and only upgrades when the session cookie maps to a valid user.
- `/api/uploads/:attachmentId/content` is private.
- No extra public routes beyond `/login` are intentionally exposed.
- When moved to a real backend, this app should add CSRF protection, durable session storage, rate limiting, and attachment scanning.
