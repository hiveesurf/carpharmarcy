# UAT and Production Deploy Runbook

## 1) Backend deploy (UAT)

Prepare env:

```bash
cp backend/.env.uat.example backend/.env.uat
```

Deploy:

```bash
CARNALYSYS_API_IMAGE=registry.example.com/carnalysys-api:<tag> \
docker compose -f docker-compose.app-uat.yml up -d
```

## 2) Backend deploy (Prod)

Server-side env file path used by compose:

- `${CARNALYSYS_SERVER_ROOT:-/opt/carnalysys/backend}/.env.prod`

Deploy:

```bash
CARNALYSYS_API_IMAGE=registry.example.com/carnalysys-api:<tag> \
docker compose -f docker-compose.app-prod.yml up -d
```

## 3) Render + Vercel deployment model

- Backend and DB: `render.yaml`
- Frontend: Vercel static build
- API route handling in frontend domain:
  - browser calls `/api/v1/*`
  - `vercel.json` rewrites `/api/*` to Render backend

## 4) Required checks after deploy

- Backend health: `https://<backend-domain>/api/v1/health`
- Frontend loads and can call `/api/v1/health` through frontend domain
- Auth OTP, catalog, cart/order, and payment webhook smoke checks

## 5) Smoke command

```bash
./scripts/smoke-prod.sh \
  https://<backend-domain> \
  https://<frontend-domain>
```
