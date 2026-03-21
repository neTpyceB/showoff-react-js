# Architecture

## Overview

The app is organized around a finance domain rather than page-local state:

- `src/finance/model.ts` defines categories, schemas, seeded data, and persisted state shape.
- `src/finance/reducer.ts` owns transaction and filter mutations through a pure reducer.
- `src/finance/selectors.ts` computes filtered transactions, summary metrics, breakdowns, and chart series.
- `src/hooks/usePersistentReducer.ts` hydrates and persists reducer state to local storage with schema validation.
- `src/components/` contains presentation surfaces for the form, filters, charts, summary cards, and ledger.

## State strategy

- Source of truth is a single reducer state containing transactions, filters, and the deterministic `nextId`.
- Derived values are calculated through selector functions instead of duplicated in component state.
- Filter updates are wrapped in transitions to keep the UI responsive as analytics recalculate.

## Rendering strategy

- Charts are implemented with native SVG and CSS instead of a charting dependency to keep the bundle lean.
- Toasts remain a provider-level concern because they cross-cut form, delete, and reset actions.
- Persistence is local-first and validated before hydration to avoid corrupt state entering the UI.
