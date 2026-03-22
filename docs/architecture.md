# Architecture

## Overview

The app is structured around a client-rendered UI plus a typed mock API boundary:

- `src/kanban/model.ts` defines users, team spaces, tasks, roles, and persisted schemas.
- `src/kanban/api.ts` is the server-sync boundary used by the UI. It enforces access and persistence rules.
- `src/kanban/hooks.ts` owns query keys, cached data access, optimistic task movement, and mutations.
- `src/kanban/permissions.ts` centralizes role checks.
- `src/kanban/board.ts` contains deterministic board movement logic used by both optimistic updates and the API.
- `src/components/` contains the routed UI shell, login surface, task composer, and Kanban board.

## Routing and access

- `/login` is the only public route.
- `/` redirects authenticated users to the first accessible team space.
- `/spaces/:spaceId` is protected and membership-scoped. Missing session redirects to `/login`. Missing membership returns an explicit board access error.

## State and sync

- TanStack Query handles session, team-space lists, and board caching.
- Column drag-and-drop task movement uses optimistic cache updates, then syncs through the API layer.
- Keyboard task movement is a first-class interaction and commits through the same mutation path as pointer drag.
- Failed task movement rolls back to the previous cached board state.
- Task creation is server-authoritative and invalidates board and space queries on success.
