# AGENTS

## Purpose

This repository is a production-style React.js showcase. Every change should preserve a portfolio-grade quality bar across implementation, tests, Docker, CI, and documentation.

## Delivery rules

- Keep code minimal, explicit, and maintainable.
- Prefer accessible primitives and browser-native behavior where possible.
- Ship tests with every feature: unit, smoke, and browser e2e.
- Keep docs synchronized with implementation changes.
- Run the full verification path after code changes: lint, typecheck, tests, build, and e2e.
- Avoid speculative abstractions unless a component is already proving reuse.
- Domain logic should live in finance models, reducers, selectors, and hooks rather than in view components.

## Project map

- `src/`: application code and component primitives.
- `e2e/`: browser tests.
- `docs/`: architecture, roadmap, engineering rules, and security notes.
- `.github/workflows/`: CI automation.
