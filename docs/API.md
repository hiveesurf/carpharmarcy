# CARNALYSYS API

## Run (Spring Boot)

1. PostgreSQL on `localhost:5432`, database `carnalysys` (see repo `docker-compose` / Flyway migrations in `backend/`).
2. From **`backend/`**: `./mvnw spring-boot:run` → **http://localhost:8080**. **spring-boot-devtools** is enabled: after you save Java or resource files, the app restarts automatically once they are compiled (use Cursor/VS Code with the Java extension and **autobuild** on, or IntelliJ **Build project automatically** + allow auto-make while running).
3. From repo root: **`npm run dev`** (Vite port **5199**). The dev server proxies **`/api` → http://127.0.0.1:8080**, so the UI uses **`/api/v1/...`** with no CORS issues.

Optional: set **`VITE_API_BASE=http://localhost:8080`** (or full URL ending in `/api/v1`) for static builds; CORS must allow your origin (Spring config includes common dev origins).

**Demo:** OTP from backend config (e.g. `123456` when enabled) · Admin `admin@carnalysys.com` / `admin123` (seed).

Override proxy target: **`VITE_DEV_API_PROXY=http://127.0.0.1:9090`**

## Validation (Spring)

Request bodies for **`POST /auth/send-otp`**, **`POST /auth/verify-otp`**, and **`POST /admin/auth/login`** use Jakarta Bean Validation (`@Valid`). Failures return **`400`** with envelope code **`VALIDATION_ERROR`** and a field message (see `GlobalExceptionHandler`).

## Envelope

```json
{ "success": true, "data": { }, "meta": { "requestId": "…", "timestamp": "…" } }
```

Auth **verify** / **refresh** `data` includes `accessToken` (refresh is **httpOnly** `refreshToken` cookie, not in JSON).

## Frontend layering

1. **`src/api/*`** — thin `fetch` (Bearer + `X-Guest-Session` + `credentials: 'include'`).
2. **`src/services/*`** — app rules and token handling (requires a configured API in dev/prod).
3. **`src/store/AuthProvider.jsx`** — auth UI state; **access token** via `src/lib/authTokens.js` (memory only).

## Core routes (`/api/v1`)

| Area | Routes |
|------|--------|
| Auth | `POST /auth/send-otp`, `/auth/verify-otp`, `/auth/refresh-token`, `/auth/logout`, `GET /auth/me` |
| User | `GET\|PUT /user/profile`, `GET /addresses`, `POST /addresses`, `PUT\|DELETE /addresses/:id` |
| Catalog | `GET /products`, `GET /products/:id`, `GET /categories` |
| Cart | `GET /cart`, `POST /cart`, `PUT /cart/:itemId`, `DELETE /cart/:itemId` |
| Wishlist | `GET /wishlist`, `POST /wishlist/toggle` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id` |
| Admin | `POST /admin/auth/login`, products/categories CRUD, `PATCH .../publish`, orders, users, `GET /admin/dashboard` |
| Legacy | Hero fitment `/vehicle/*`, `/search/*`, `/leads/seller`, `/compat/vehicle-enquiry/:carId` |

OpenAPI sketch: **`server/openapi.yaml`** (import into Postman or update servers URL to match your Spring host).
