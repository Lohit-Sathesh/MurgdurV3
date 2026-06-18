# Murgdur

A luxury fashion e-commerce platform — Next.js 14 storefront/admin frontend with a NestJS + Prisma backend.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, NextAuth, GSAP/Lenis (smooth scroll)
- **Backend**: NestJS, Prisma ORM, PostgreSQL, Redis, BullMQ (background jobs)
- **Search**: Meilisearch
- **Media storage**: Cloudflare R2 (S3-compatible) — MinIO locally
- **Payments**: Razorpay + Cash on Delivery
- **Email**: SMTP (e.g. Gmail App Password) for OTP / order confirmation emails

## Project Structure

```
backend/         NestJS API (auth, products, orders, payments, admin, etc.)
frontend/        Next.js storefront + admin portal
infrastructure/  Docker Compose, Kubernetes manifests, CI/CD configs
```

## Prerequisites

- Node.js 20+
- npm
- Docker (for Postgres, Redis, Meilisearch, MinIO)

## 1. Start infrastructure (Postgres, Redis, Meilisearch, MinIO)

From the repo root:

```bash
cd infrastructure
docker compose -f docker-compose.local.yml up -d
```

This starts:
- Postgres on `5432`
- Redis on `6379`
- Meilisearch on `7700`
- MinIO on `9000` (S3-compatible storage for local media)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in/adjust:
- `DATABASE_URL` — Postgres connection string (matches docker-compose credentials)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `R2_*` — Cloudflare R2 (or MinIO) credentials for media storage
- `MEILISEARCH_*` — Meilisearch host/key
- `SMTP_*` — SMTP credentials for sending OTP/order emails (e.g. a Gmail App Password)
- `RAZORPAY_*` — Razorpay test keys (optional — Cash on Delivery works without them)

Run migrations and seed the database:

```bash
npx prisma migrate dev
npm run seed
```

Start the backend:

```bash
npm run start:dev
```

The API runs on `http://localhost:3001` by default.

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL` — point to the backend (`http://localhost:3001`)
- `NEXTAUTH_URL` — `http://localhost:3000`
- `NEXTAUTH_SECRET` — any long random string
- `NEXT_PUBLIC_MEILISEARCH_*` — same Meilisearch instance as the backend
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Razorpay test public key (optional)

Start the frontend:

```bash
npm run dev
```

The storefront runs on `http://localhost:3000`.

## 4. Creating an admin user

After registering a user normally through the UI, promote it to admin via Prisma Studio:

```bash
cd backend
npx prisma studio
```

Open the `User` table, find your user, and set `role` to `ADMIN`. The admin portal is available at `/admin`.

## Key Features

- Product catalog with categories, variants (size/color), stock tracking
- Cart, wishlist, address book
- Currency auto-detection by location (INR/USD/EUR) with manual override
- Discount pricing (compare-at price with strikethrough + % off badge)
- Delivery estimates by pincode
- Product filtering and sorting (price range, etc.)
- Checkout with Razorpay or Cash on Delivery
- Order tracking, cancellation, and PDF invoices
- Email OTP verification and order confirmation emails
- Full admin portal: dashboard analytics, order management, catalog management, user roles, homepage media

## Notes

- `node_modules/`, `dist/`, `.next/`, and `.env*` files (except `.env.example`) are gitignored — never commit real secrets.
- The `infrastructure/` directory contains Kubernetes manifests and CI/CD configs for production deployment; these are reference configs and require your own cloud accounts/credentials to use.
