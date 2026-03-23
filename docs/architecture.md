# Architecture

## Overview

The app is structured around a same-origin React SSR storefront plus a local Express backend:

- `src/commerce/model.ts` defines the shared typed contracts for catalog, cart, orders, account, admin, promotions, checkout, and analytics.
- `src/commerce/catalog.ts` owns pure pricing, availability, sorting, filtering, and cart summary derivation.
- `server/store.ts` owns seeded commerce data, sessions, carts, orders, promotions, checkout sessions, and admin mutations.
- `server/index.ts` exposes authenticated HTTP routes and server-side renders route-specific HTML with metadata and embedded initial state.
- `src/commerce/api.ts` is the browser HTTP boundary.
- `src/commerce/client.tsx` owns client state refresh flows for cart, account, and admin surfaces.
- `src/components/CommercePages.tsx` contains the routed storefront, cart, checkout, account, and admin UI surfaces.

## Routing and access

- Public routes:
  - `/`
  - `/catalog`
  - `/catalog/:slug`
  - `/search`
  - `/cart`
  - `/checkout`
  - `/checkout/success`
  - `/login`
- Customer-only routes:
  - `/account/orders`
  - `/account/profile`
  - `/account/addresses`
- Admin-only routes:
  - `/admin`
  - `/admin/products`
  - `/admin/inventory`
  - `/admin/orders`
  - `/admin/promotions`
  - `/admin/customers`

## SSR and SEO

- The Express server renders HTML for each storefront, account, and admin route before hydration.
- Route-level metadata is selected server-side from the resolved path and request query.
- PDP routes include product structured data.
- The client hydrates from `window.__APP_STATE__` so initial route data is preserved across SSR and browser takeover.

## Backend contracts

- Session:
  - `GET /api/session`
  - `POST /api/session/login`
  - `POST /api/session/logout`
- Storefront:
  - `GET /api/bootstrap`
  - `GET /api/catalog`
  - `GET /api/products/:slug`
  - `GET /api/search`
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:itemId`
  - `DELETE /api/cart/items/:itemId`
  - `POST /api/cart/promo`
  - `POST /api/checkout/session`
  - `POST /api/checkout/confirm`
- Account:
  - `GET /api/account/orders`
  - `GET /api/account/profile`
- Admin:
  - `GET /api/admin/summary`
  - `GET /api/admin/products`
  - `PATCH /api/admin/products/:productId`
  - `GET /api/admin/orders`
  - `PATCH /api/admin/orders/:orderId`
  - `GET /api/admin/inventory`
  - `PATCH /api/admin/inventory/:sku`
  - `GET /api/admin/promotions`
  - `POST /api/admin/promotions`
  - `GET /api/admin/customers`
- Analytics:
  - `POST /api/analytics/events`

## State model

- The server owns source-of-truth commerce state in memory for the seeded demo.
- SSR embeds an initial `AppState` snapshot for the requested route.
- Client refresh paths update cart, account, and admin slices after mutations.
- Checkout confirmation is completed by navigating to the success route with a checkout session id, which allows the server to finalize the seeded order in the same-origin flow.
