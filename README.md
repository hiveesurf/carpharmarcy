# CARNALYSYS (car_rent)

Monorepo with:
- Frontend: React + Vite (repository root)
- Backend: Spring Boot API (`backend/`)

## Deployment quick links

- Local runbook:
  - `docs/run-local.md`
- API testing runbook:
  - `docs/run-api-testing.md`
- UAT/prod deployment runbook:
  - `docs/run-deploy.md`
- Config reference (local/UAT/prod):
  - `docs/config-reference.md`

## Backend Server Docker Deployment

Use `docker-compose.app-prod.yml` to run the backend with host-mounted folders so config and uploads persist across deploys.

## Full-stack Docker (frontend + backend + Postgres)

Run the entire stack locally in containers:

```bash
docker compose -f docker-compose.fullstack.yml up -d --build
```

Endpoints:
- Frontend: `http://127.0.0.1:5199`
- Backend API: `http://127.0.0.1:8080/api/v1/health`

### Server folder layout

Create this structure on server (default root: `/opt/carnalysys/backend`):

- `config/application-prod.yml`
- `.env.prod`
- `uploads/vehicles/`
- `uploads/receipts/`
- `uploads/avatars/`
- `logs/`

### One-command restart

From repo root:

```bash
./scripts/restart-backend-prod.sh
```

Useful override:

```bash
CARNALYSYS_SERVER_ROOT=/your/path ./scripts/restart-backend-prod.sh
```

### Notes

- Backend reads external config from `config/application-prod.yml` (mounted inside container at `/app/config`).
- After editing properties, run restart script and changes apply on next startup.
- Keep `APP_JWT_SECRET` only in server `.env.prod` and keep JWT access tokens time-bounded.

### Admin access

Operators sign in through the storefront **phone + OTP** flow (`POST /api/v1/auth/send-otp`, `POST /api/v1/auth/verify-otp`). Admin APIs require `Authorization: Bearer <JWT>` when the verified phone matches `admin_users.phone_e164`. See `docs/API.md` for details. There is no email/password admin login.
