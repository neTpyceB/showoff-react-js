# AGENTS

## Purpose

This repository is a production-style React.js showcase. Every change should preserve a portfolio-grade quality bar across implementation, tests, Docker, CI, and documentation.

## Delivery rules

- Always make a plan before starting a task, including small changes.
- Follow the plan and adjust it when the implementation reveals new constraints.
- Keep a written record of completed middle steps and the remaining planned steps so execution can be followed across turns.
- Test each completed implementation step, not only the final result.
- Keep code minimal, explicit, and maintainable.
- Prefer accessible primitives and browser-native behavior where possible.
- Ship tests with every feature: unit, smoke, and browser e2e.
- Keep docs synchronized with implementation changes.
- Keep docs synchronized with implementation changes and with newly introduced operating instructions from the user.
- Run the full verification path after code changes: lint, typecheck, tests, build, and e2e.
- Avoid speculative abstractions unless a component is already proving reuse.
- Domain logic should live in models, permissions, sync layers, and hooks rather than in view components.
- Do not implement functional fallbacks. Features should either work correctly or fail explicitly so defects are visible.
- Always verify localhost and browser behavior when the project exposes a UI surface.
- New URLs and routes must be checked for correct public or private exposure and safe default access.
- User-facing responses should stay result-focused rather than narrating each implementation step.
- New operating instructions must be written into repository docs immediately so they persist across future AI threads.

## Project map

- `src/`: application code and component primitives.
- `e2e/`: browser tests.
- `docs/`: architecture, roadmap, engineering rules, and security notes.
- `.github/workflows/`: CI automation.
