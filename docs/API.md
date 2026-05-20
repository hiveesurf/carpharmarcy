# CARNALYSYS API

Primary run/testing guides:
- `docs/run-local.md`
- `docs/run-api-testing.md`
- `docs/config-reference.md`

## Run (Spring Boot)

1. PostgreSQL on `localhost:5432`, database `carnalysys` (see repo `docker-compose` / Flyway migrations in `backend/`).
2. From **`backend/`**: `./mvnw spring-boot:run` → **http://localhost:8080**. **spring-boot-devtools** is enabled: after you save Java or resource files, the app restarts automatically once they are compiled (use Cursor/VS Code with the Java extension and **autobuild** on, or IntelliJ **Build project automatically** + allow auto-make while running).
3. From repo root: **`npm run dev`** (Vite port **5199**). The dev server proxies **`/api` → http://127.0.0.1:8080**, so the UI uses **`/api/v1/...`** with no CORS issues.

Optional: set **`VITE_API_BASE=http://localhost:8080/api/v1`** for static builds; CORS must allow your origin (Spring config includes common dev origins).

**Demo OTP:** `123456` when `app.otp.demo-code` is enabled (typical local profile).

**Demo admin (seed):** sign in with phone **`9876543210`** and OTP **`123456`**. The seeded super-admin row uses contact email `admin@carnalysys.com` (not used for login). Ensure `admin_users.phone_e164` is set for that operator.

Override proxy target: **`VITE_DEV_API_PROXY=http://127.0.0.1:9090`**

## Admin authentication (phone + OTP)

Admins and employees use the **same** OTP endpoints as storefront users. There is no email/password admin login and no `adminSession` cookie.

| Step | Endpoint | Result |
|------|----------|--------|
| 1 | `POST /auth/send-otp` | OTP sent (demo code in dev response when applicable) |
| 2 | `POST /auth/verify-otp` | `accessToken` in JSON; `refreshToken` httpOnly cookie |
| 3 | (automatic) | If phone matches `admin_users.phone_e164`, `users.role` is set from `admin_users.role` (`super_admin`, `sales`, `delivery`) |
| 4 | Admin UI / APIs | `Authorization: Bearer <accessToken>` on `/api/v1/admin/**` |
| 5 | Denied | Phones not linked in `admin_users` get **403** on admin routes |

`admin_users.email` is retained for notifications and employee records only.

Sign out: `POST /auth/logout` (shared with storefront).

## Validation (Spring)

Request bodies for **`POST /auth/send-otp`** and **`POST /auth/verify-otp`** use Jakarta Bean Validation (`@Valid`). Failures return **`400`** with envelope code **`VALIDATION_ERROR`** and a field message (see `GlobalExceptionHandler`).

## Envelope

```json
{ "success": true, "data": { }, "meta": { "requestId": "…", "timestamp": "…" } }
```

Auth **verify** / **refresh** `data` includes `accessToken` (refresh is **httpOnly** `refreshToken` cookie, not in JSON).

## Frontend layering

1. **`src/api/*`** — thin `fetch` (Bearer + `X-Guest-Session` + `credentials: 'include'`).
2. **`src/services/*`** — app rules and token handling (requires a configured API in dev/prod).
3. **`src/store/AuthProvider.jsx`** — auth UI state; **access token** via `src/lib/authTokens.js` (memory only). Admin access is derived from JWT/`users.role` after OTP (`isAdmin`).

## Core routes (`/api/v1`)

| Area | Routes |
|------|--------|
| Auth | `POST /auth/send-otp`, `/auth/verify-otp`, `/auth/refresh-token`, `/auth/logout`, `GET /auth/me` |
| User | `GET\|PUT /user/profile`, `GET /addresses`, `POST /addresses`, `PUT\|DELETE /addresses/:id` |
| Catalog | `GET /products`, `GET /products/:id`, `GET /categories` |
| Cart | `GET /cart`, `POST /cart`, `PUT /cart/:itemId`, `DELETE /cart/:itemId` |
| Wishlist | `GET /wishlist`, `POST /wishlist/toggle` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id` |
| Admin | `/admin/**` (dashboard, products, categories, orders, users, employees, notifications) — **Bearer JWT** with admin role; no `/admin/auth/*` |
| Legacy | Hero fitment `/vehicle/*`, `/search/*`, `/leads/seller`, `/compat/vehicle-enquiry/:carId` |

OpenAPI sketch: **`server/openapi.yaml`** (import into Postman or update servers URL to match your Spring host).
