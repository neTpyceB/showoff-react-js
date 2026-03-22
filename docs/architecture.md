# Architecture

## Overview

The app is structured around a same-origin React client plus a local Express and WebSocket backend:

- `src/chat/model.ts` defines the shared typed contract for users, channels, messages, replies, uploads, cursors, and socket events.
- `server/store.ts` owns seeded workspace data, message and thread persistence, unread calculations, presence state, and idempotent delivery keyed by client IDs.
- `server/index.ts` exposes authenticated HTTP routes and `/ws` realtime events from the same origin used by the browser.
- `src/chat/api.ts` is the client HTTP boundary.
- `src/chat/hooks.ts` owns query keys, pagination, optimistic sends, uploads, read mutations, and draft persistence wiring.
- `src/chat/socket.tsx` merges websocket events into TanStack Query cache ownership and reconnect reconciliation.
- `src/chat/outbox.ts` persists drafts and pending sends in IndexedDB.
- `src/components/` contains the routed login, workspace shell, channel stream, composer, and thread panel.

## Routing and access

- `/login` is the only public route.
- `/` redirects authenticated users to the default workspace channel.
- `/channels/:channelId` is protected. Missing session redirects to `/login`.
- `/api/uploads/:attachmentId/content` is protected and requires the session cookie before attachment content is served.

## State and sync

- TanStack Query handles session state, workspace bootstrap, channel pagination, and thread pagination.
- WebSocket events update cached bootstrap, channel message pages, thread pages, typing state, and read state without bypassing cache ownership.
- Channel messages and replies are optimistic on the client, then reconciled by shared `clientId` when the server ACK and canonical event arrive.
- Reconnect invalidates and refetches active channel and thread data so the UI resynchronizes after dropped realtime events.
- IndexedDB stores drafts and queued sends per user and scope.

## Backend contracts

- Session:
  - `POST /api/session/login`
  - `POST /api/session/logout`
  - `GET /api/session`
- Workspace bootstrap:
  - `GET /api/bootstrap`
- Channels and threads:
  - `GET /api/channels/:channelId/messages`
  - `GET /api/messages/:messageId/thread`
  - `POST /api/channels/:channelId/messages`
  - `POST /api/messages/:messageId/replies`
  - `POST /api/channels/:channelId/read`
  - `POST /api/messages/:messageId/thread/read`
- Uploads:
  - `POST /api/uploads`
  - `GET /api/uploads/:attachmentId/content`

## Realtime events

- `presence.updated`
- `typing.started`
- `typing.stopped`
- `message.created`
- `reply.created`
- `message.acknowledged`
- `read.updated`
- `channel.updated`
