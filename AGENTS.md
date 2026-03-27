# AGENTS

## Purpose

This repository is a production-style React.js showcase. The current flagship product is a world-class product operations platform built on Next.js 16 App Router with locale-prefixed routes, server-owned sessions, scoped tenant boundaries, SSE-driven live surfaces, background jobs, observability, experimentation controls, and strict module-level authorization. Every change should preserve a portfolio-grade quality bar across implementation, tests, Docker, CI, browser validation, and documentation.

## Delivery rules

- Always make a plan before starting a task, including small changes.
- Follow the plan and adjust it when implementation reveals new constraints.
- Keep a written record of completed middle steps and remaining planned steps so execution can be followed across turns.
- Test each completed implementation step, not only the final result.
- Keep code minimal, explicit, and maintainable.
- Prefer accessible primitives and browser-native behavior where possible.
- Ship tests with every feature: unit, smoke, and browser e2e.
- Keep docs synchronized with implementation changes.
- Keep docs synchronized with implementation changes and with newly introduced operating instructions from the user.
- Run the full verification path after code changes: lint, typecheck, tests, build, and e2e.
- Avoid speculative abstractions unless the code already proves the need.
- Domain logic should live in shared platform models, access rules, server services, caching helpers, and state layers rather than in view components.
- Do not implement functional fallbacks. Features should either work correctly or fail explicitly so defects are visible.
- Always verify localhost and browser behavior when the project exposes a UI surface.
- New URLs and routes must be checked for correct public or private exposure and safe default access.
- User-facing responses should stay result-focused rather than narrating each implementation step.
- New operating instructions must be written into repository docs immediately so they persist across future AI threads.

## Project map

- `app/`: App Router routes, layouts, route handlers, loading and access boundaries.
- `src/modules/`: feature modules for feed, dashboards, search, notifications, collaboration, jobs, observability, experiments, and the product shell.
- `src/server/`: seeded in-memory services, auth, cache tags, runtime ticking, and server actions.
- `src/lib/`: shared types, locale dictionaries, and permission rules.
- `e2e/`: browser tests.
- `docs/`: architecture, roadmap, project planning, engineering rules, and security notes.
- `.github/workflows/`: CI automation.
