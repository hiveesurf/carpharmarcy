# Configuration Reference (Local/UAT/Prod)

## Environment contract

| Target | Backend profile | Backend env file | Frontend env mode/file | Compose file |
|---|---|---|---|---|
| Local (JVM+Vite) | `local` | optional `backend/.env.local` | `local` -> `.env.local` | `docker-compose.yml` (db/pgadmin) |
| Local (full Docker) | `local` | optional `backend/.env.local` | Docker build args | `docker-compose.fullstack.yml` |
| UAT | `uat` | `backend/.env.uat` | `uat` -> `.env.uat` | `docker-compose.app-uat.yml` |
| Prod | `prod` | server `.env.prod` | `production` -> `.env.production` | `docker-compose.app-prod.yml` |

## Backend config files

- Base defaults: `backend/src/main/resources/application.yml`
- Local overrides: `backend/src/main/resources/application-local.yml`
- UAT overrides: `backend/src/main/resources/application-uat.yml`
- Prod overrides: `backend/src/main/resources/application-prod.yml`

## Required backend variables for UAT/Prod

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `APP_PAYMENT_WEBHOOK_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

## Firebase OTP variables

Frontend (`.env.local`, `.env.uat`, `.env.production` as applicable):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`

Backend (choose one credential mode):

- Inline:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- Or file path:
  - `FIREBASE_SERVICE_ACCOUNT_PATH`

Notes:

- Firebase is used only for login OTP.
- Twilio remains in use for WhatsApp order status and low-stock alerts.
- Legacy `POST /auth/send-otp` and `POST /auth/verify-otp` remain available for rollback.

## Frontend API strategy (canonical)

Use relative API base (`/api/v1`) for UAT/prod builds.

- `.env.uat` -> `VITE_API_BASE=/api/v1`
- `.env.production` -> `VITE_API_BASE=/api/v1`

For Vercel, `/api/*` is forwarded by `vercel.json` to backend.

For local Vite dev, when `VITE_API_BASE` is blank, proxy `/api` uses `VITE_DEV_API_PROXY` (default `http://127.0.0.1:8080`).

## Storage path rules

- Local defaults come from `application-local.yml`.
- UAT/prod use env-driven paths (`CARNALYSYS_STORAGE_*`) with sane defaults in profile files.
- Production compose mounts server folders into `/app/storage/*`.

## Port defaults

- Frontend: `5199`
- Backend: `8080`
- Postgres: `5432`
- pgAdmin: `5050`
