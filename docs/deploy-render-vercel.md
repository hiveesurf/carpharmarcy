# Production Deployment (Render + Vercel)

This guide deploys backend and database on Render, then frontend on Vercel.

## 1) Prerequisites

- Vercel account + `vercel` CLI authenticated.
- Render account with GitHub repository access.
- Production values for:
  - `APP_JWT_SECRET`
  - `APP_PAYMENT_RAZORPAY_KEY_ID`
  - `APP_PAYMENT_RAZORPAY_KEY_SECRET`
  - `APP_PAYMENT_WEBHOOK_SECRET`

## 2) Deploy backend and DB on Render

1. In Render dashboard, create a **Blueprint** from this repository root.
2. Render reads `render.yaml` and provisions:
   - web service `car-rent-backend` (Docker runtime from `backend/Dockerfile`)
   - PostgreSQL database `car-rent-db`
3. Set required secret env vars on the backend service.
4. Set CORS:
   - `APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`
5. Wait for deploy to pass health check:
   - `GET https://<render-backend-domain>/api/v1/health`

Flyway migrations run automatically at backend startup using the managed Postgres connection.

## 3) Deploy frontend on Vercel

From repository root:

```bash
vercel login
vercel link
vercel env add VITE_BASE_PATH production
vercel env add VITE_API_BASE production
vercel deploy --prod --yes
```

Recommended values:
- `VITE_BASE_PATH` = `/`
- `VITE_API_BASE` = `https://<render-backend-domain>`

## 4) Smoke checks

Run:

```bash
./scripts/smoke-prod.sh \
  https://<render-backend-domain> \
  https://<vercel-frontend-domain>
```

## 5) Go-live checklist

- Backend health endpoint returns success.
- Frontend loads and can reach backend API.
- Auth, catalog, cart/order, and payment webhook paths verified.
- Render DB backup policy enabled.
