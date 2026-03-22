# Security Audit

## Baseline review

- Public access is limited to `/login`.
- Team-space routes require an authenticated session.
- Space access is checked server-side in the mock API before board data is returned.
- Viewer roles cannot create or move tasks.
- Invalid persisted session or database data throws explicit errors rather than silently recovering.

## Exposure notes

- `localhost:5173` and `localhost:4173` are intentional local-only development surfaces.
- No additional public URLs or unprotected routes are exposed by the app.
- When moved to a real backend, route protection must be enforced on the server as well as in the client.
