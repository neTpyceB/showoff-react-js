# Engineering Rules

- Start every task with an explicit plan, even for small changes.
- Keep the plan current when scope or implementation details change.
- Record completed middle steps and remaining planned steps in project docs when the task is material enough to need tracking.
- Verify each completed implementation step instead of waiting to test only at the end.
- Keep domain logic pure and deterministic.
- Put access checks, board movement rules, and server-sync contracts outside view components.
- Validate both user input and hydrated persistence payloads with schemas.
- Prefer explicit protected-route behavior over client-side convenience shortcuts.
- Route and URL exposure must be documented and verified whenever new navigable surfaces are added.
- Do not add fallback behavior that masks defects. If a feature cannot operate correctly, fail explicitly and surface the issue.
- Every UI-affecting change must be verified through tests and an actual localhost/browser check.
- Any new URL, route, or externally reachable surface must be reviewed for correct access scope and security expectations.
- New user instructions that affect workflow, quality, architecture, testing, security, or delivery rules must be written into the repository docs in the same turn.
- User communication should emphasize results and follow-up actions rather than implementation narration.
- Repository instruction docs are the persistence layer for future AI threads and must remain current.
