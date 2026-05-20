# API Testing Runbook

## Base URLs

- Local backend direct: `http://127.0.0.1:8080/api/v1`
- Deployed backend direct: `https://<backend-domain>/api/v1`
- Frontend-proxied API check (production-style): `https://<frontend-domain>/api/v1/health`

## Quick health checks

```bash
curl -i http://127.0.0.1:8080/api/v1/health
curl -i https://<backend-domain>/api/v1/health
```

## Full local smoke

Run from repo root:

```bash
./scripts/smoke-test-apis.sh
```

Override base URL if needed:

```bash
API_BASE=http://127.0.0.1:8080/api/v1 ./scripts/smoke-test-apis.sh
```

## Production/UAT smoke

```bash
./scripts/smoke-prod.sh \
  https://<backend-domain> \
  https://<frontend-domain>
```

## Core endpoints for manual testing

- Health: `GET /health`
- Auth: `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/refresh-token`, `POST /auth/logout`
- Profile: `GET /auth/me`, `GET|PUT /user/profile`
- Catalog: `GET /products`, `GET /products/:id`, `GET /categories`
- Cart: `GET /cart`, `POST /cart`, `PUT /cart/:itemId`, `DELETE /cart/:itemId`
- Orders: `POST /orders`, `GET /orders`, `GET /orders/:id`
- Admin access (phone + OTP, same as storefront):
  1. `POST /auth/send-otp` with `{ "phone": "9876543210" }` (or your `admin_users.phone_e164`)
  2. `POST /auth/verify-otp` with `{ "phone", "otp": "123456" }` (dev demo code) → copy `data.accessToken`
  3. Call `/admin/**` with header `Authorization: Bearer <accessToken>`
  4. Non-admin phones receive **403** on `/admin/**`

There is no `POST /admin/auth/login` or `adminSession` cookie.

All routes above are under `/api/v1`.
