#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <backend_base_url> <frontend_base_url>"
  echo "Example: $0 https://car-rent-backend.onrender.com https://car-rent.vercel.app"
  exit 1
fi

BACKEND_URL="${1%/}"
FRONTEND_URL="${2%/}"

echo "==> Checking backend health: ${BACKEND_URL}/api/v1/health"
health_code="$(curl -sS -o /tmp/carnalysys_health.json -w "%{http_code}" "${BACKEND_URL}/api/v1/health")"
if [[ "${health_code}" != "200" ]]; then
  echo "Backend health check failed (HTTP ${health_code})"
  exit 2
fi

echo "==> Checking frontend root: ${FRONTEND_URL}/"
front_code="$(curl -sS -o /tmp/carnalysys_front.html -w "%{http_code}" "${FRONTEND_URL}/")"
if [[ "${front_code}" != "200" ]]; then
  echo "Frontend root check failed (HTTP ${front_code})"
  exit 3
fi

echo "==> Checking frontend proxy/API path: ${FRONTEND_URL}/api/v1/health"
api_code="$(curl -sS -o /tmp/carnalysys_api_health.json -w "%{http_code}" "${FRONTEND_URL}/api/v1/health")"
if [[ "${api_code}" != "200" ]]; then
  echo "API reachability check failed (HTTP ${api_code})"
  exit 4
fi

echo "Smoke checks passed."
