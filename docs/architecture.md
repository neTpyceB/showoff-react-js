# Architecture

## Overview

The app is a single-page React playground with a compact component architecture:

- `App.tsx` composes the demo surface and the activity feed.
- `src/components/` contains reusable UI primitives.
- `ToastProvider` offers cross-cutting notification state through context.
- `useControllableState` supports controlled and uncontrolled component APIs.

## Design choices

- Vite provides a lean production build and local developer loop.
- Components stay dependency-light unless a library materially reduces risk.
- `react-hook-form` and `zod` are used for concise, production-grade form validation.
- Playwright validates the browser experience instead of only checking process startup.

## Testing strategy

- Unit tests cover primitive behavior and keyboard interactions.
- Smoke tests validate the application shell render path.
- E2E tests exercise the real browser flow, including accessibility scanning.
