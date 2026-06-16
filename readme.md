# NexCart

A full-stack e-commerce platform built with a PERN stack (PostgreSQL, Express, React, Node.js). Features a product catalog, secure checkout, order management, real-time customer support chat, and video calling — all wired together with production-grade tooling.

**Live demo:** [_add your Railway URL here_](https://nexcart-ecommerce-production.up.railway.app)

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express v5 |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Clerk |
| Payments | Polar |
| Chat / Video | Stream |
| Image Storage | ImageKit |
| Error Tracking | Sentry |
| Validation | Zod |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS + DaisyUI |
| State (server) | TanStack Query |
| State (cart) | Zustand (persisted) |
| Auth | Clerk React |
| Chat UI | Stream Chat React |
| Video UI | Stream Video React SDK |
| Error Tracking | Sentry React |

---

## Features

### Storefront

- Product catalog with category filtering (URL-persisted)
- Product detail page with ImageKit-optimized images and watermarked full-size view
- Persistent cart with quantity controls and stock validation
- Secure checkout via Polar — redirects to hosted payment page
- Checkout return page clears cart and invalidates order cache

### Orders

- Order list with product image previews, status badges, and totals
- Order detail page with line items, unit prices, and subtotals
- Staff users see all orders; customers see only their own

### Support

- Per-order Stream chat channel — unlocks after payment confirmed
- Staff can send video call invites directly in the chat thread
- Video call page using Stream Video SDK — same join link for all participants

### Admin Dashboard

- Product table with image previews, active/inactive status
- Create and edit products with ImageKit direct upload
- Delete products (blocked if product exists on any order)
- Role-based access — admin only

### Infrastructure

- Clerk webhooks sync users to local DB on signup, update, and delete
- Polar webhooks fulfill orders on `order.paid` event with idempotency and race condition handling via DB row locks
- Sentry error tracking on both frontend and backend with Clerk user context
- Keep-alive cron job pings `/health` every 14 minutes in production
- Multi-stage Docker build — frontend dist served as static files from Express

---

## Database Schema

```
users           — Clerk-synced user records with role (customer/support/admin)
products        — Catalog items with slug, price, stock, ImageKit file ID
checkoutSessions — Cart snapshot created before Polar redirect
orders          — Fulfilled after Polar webhook; status: pending/paid/failed
orderItems      — Line items per order with unit price snapshot
```

- Prices stored in cents (integer) — no floating point errors
- `pgEnum` for order status and user role — DB-level enforcement
- `onDelete: cascade` for orders/sessions, `onDelete: restrict` for order items (product cannot be deleted if referenced)
- Indexes on all foreign keys and frequently queried columns

---

## API Routes

### Public

```
GET  /api/products              — List active products (optional ?category=)
GET  /api/products/categories   — Distinct active categories
GET  /api/products/:slug        — Single product by slug
GET  /health                    — Keep-alive health check
```

### Authenticated

```
GET  /api/me                    — Current user profile
POST /api/stream/token          — Stream chat token
POST /api/checkout              — Create Polar checkout session
GET  /api/orders                — List orders (all for staff, own for customer)
GET  /api/orders/:id            — Order detail with line items
POST /api/orders/:id/stream-channel  — Create/join support chat channel
POST /api/orders/:id/video-invite    — Send video call invite (staff only)
```

### Admin

```
GET    /api/admin/products       — All products including inactive
POST   /api/admin/products       — Create product
PATCH  /api/admin/products/:id   — Update product
DELETE /api/admin/products/:id   — Delete product (blocked if on any order)
GET    /api/admin/imagekit/auth  — ImageKit upload auth params
```

### Webhooks

```
POST /webhooks/clerk   — User sync (created/updated/deleted)
POST /webhooks/polar   — Order fulfillment (order.paid)
```

---

## Environment Variables

### Backend (`/backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=

CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

FRONTEND_URL=http://localhost:5173

POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_API_BASE=https://api.polar.sh
POLAR_CHECKOUT_PRODUCT_ID=

STREAM_API_KEY=
STREAM_API_SECRET=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

SENTRY_DSN=
```

### Frontend (`/frontend/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SENTRY_DSN=
VITE_API_URL=http://localhost:5000
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- A [Neon](https://neon.tech) PostgreSQL database
- [Clerk](https://clerk.com) account
- [Polar](https://polar.sh) account
- [Stream](https://getstream.io) account
- [ImageKit](https://imagekit.io) account

### Installation

```bash
# Clone the repo
git clone https://github.com/abhishekKumar253/nexcart
cd nexcart

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Database Setup

```bash
cd backend
npm run db:push    # Push schema to Neon
npm run db:seed    # Seed 18 sample products
```

### Development

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

### Clerk Webhook Setup

1. Go to Clerk Dashboard → Webhooks → Add endpoint
2. URL: `https://your-domain/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret → `CLERK_WEBHOOK_SECRET`

### Polar Webhook Setup

1. Go to Polar Dashboard → Webhooks → Add endpoint
2. URL: `https://your-domain/webhooks/polar`
3. Events: `order.paid`
4. Copy signing secret → `POLAR_WEBHOOK_SECRET`

---

## Deployment (Railway)

The project includes a multi-stage Dockerfile:

1. Frontend builds to `/frontend/dist`
2. Backend compiles TypeScript to `/backend/dist`
3. Frontend dist is copied to `/backend/public` and served as static files

Set all backend environment variables in Railway. The frontend is served by the same Express server — no separate frontend deployment needed.

---

## Key Design Decisions

**Prices in cents** — Integer storage avoids floating point rounding errors in financial calculations.

**Checkout session table** — Cart state is snapshotted to DB before the Polar redirect. The Polar webhook reads this snapshot to fulfill the order, so cart data is never lost even if the user closes the browser.

**Idempotent webhook handling** — The Polar webhook handler checks for already-paid orders before and after the DB transaction, with row-level locking to prevent duplicate fulfillment from concurrent webhook deliveries.

**Stream channel per order** — Support chat is scoped to individual orders. Staff join the same channel as the customer. Video call invites are sent as messages in that thread with a join URL.

**ImageKit file ID storage** — When an admin uploads a product image, the ImageKit `fileId` is stored alongside the URL. This enables server-side deletion when a product is removed.

---

## License

MIT
