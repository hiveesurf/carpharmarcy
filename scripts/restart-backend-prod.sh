#!/usr/bin/env sh
set -eu

ROOT_DIR="${CARNALYSYS_SERVER_ROOT:-/opt/carnalysys/backend}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.app-prod.yml}"

echo "Preparing server directories under: ${ROOT_DIR}"
mkdir -p "${ROOT_DIR}/config"
mkdir -p "${ROOT_DIR}/uploads/vehicles"
mkdir -p "${ROOT_DIR}/uploads/receipts"
mkdir -p "${ROOT_DIR}/uploads/avatars"
mkdir -p "${ROOT_DIR}/logs"

if [ ! -f "${ROOT_DIR}/.env.prod" ]; then
  echo "Missing ${ROOT_DIR}/.env.prod"
  echo "Create this file with at least:"
  echo "  SPRING_DATASOURCE_URL=..."
  echo "  SPRING_DATASOURCE_USERNAME=..."
  echo "  SPRING_DATASOURCE_PASSWORD=..."
  echo "  APP_JWT_SECRET=..."
  exit 1
fi

if [ ! -f "${ROOT_DIR}/config/application-prod.yml" ]; then
  echo "Missing ${ROOT_DIR}/config/application-prod.yml"
  echo "Copy backend/src/main/resources/application-prod.yml and edit values."
  exit 1
fi

echo "Restarting backend container..."
CARNALYSYS_SERVER_ROOT="${ROOT_DIR}" docker compose -f "${COMPOSE_FILE}" up -d --build api
echo "Backend restart complete."
