# Security Audit

## Baseline review

- No dangerous HTML injection paths are present.
- No client-side secrets are stored in source.
- Form inputs are validated through a schema before submission handling.
- External runtime dependencies are limited to commonly maintained libraries.

## Operational notes

- Continue dependency review during version upgrades.
- Add `npm audit` or SCA integration if this evolves beyond a showcase app.
- Reassess CSP and header strategy when the app is deployed behind a real web server.
