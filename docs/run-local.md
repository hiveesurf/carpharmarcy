# Local Runbook

This project supports two local workflows:

- JVM backend + Vite frontend (fast dev loop)
- Full Docker stack (frontend + backend + postgres)

## Service URLs (local)

- Frontend (Vite or Docker): `http://127.0.0.1:5199`
- Backend health: `http://127.0.0.1:8080/api/v1/health`
- API base: `http://127.0.0.1:8080/api/v1`
- Postgres: `127.0.0.1:5432` (db: `carnalysys`)
- pgAdmin (when using `docker-compose.yml`): `http://127.0.0.1:5050`

## Option A: JVM backend + Vite frontend

### 1) Start Postgres + pgAdmin

```bash
docker compose up -d postgres pgadmin
```

### 2) Start backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

### 3) Start frontend

```bash
npm run dev:local
```

`npm run dev:local` uses Vite `local` mode and reads root `.env.local`.

## Option B: Full Docker stack

```bash
docker compose -f docker-compose.fullstack.yml up -d --build
```

This starts frontend, backend, and postgres in one command.

## Local profile behavior

- Backend profile: `local`
- Backend config file: `backend/src/main/resources/application-local.yml`
- Frontend env file: `.env.local`
- API calls in browser use `/api/v1` (proxied by Vite in dev, or by nginx in Docker frontend)

## Stop services

```bash
docker compose down
docker compose -f docker-compose.fullstack.yml down
```
