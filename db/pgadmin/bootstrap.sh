#!/usr/bin/env bash
# Runs as root before the stock pgAdmin entrypoint.
# Writes libpq .pgpass so saved servers can connect without typing the DB password.
set -euo pipefail

U="${POSTGRES_USER:-carnalysys}"
P="${POSTGRES_PASSWORD:-carnalysys_dev}"
PGPASS_PATH="${PGADMIN_PGPASS_PATH:-/var/lib/pgadmin/.pgpass}"
mkdir -p "$(dirname "$PGPASS_PATH")"

# Same credentials for every route that can reach Postgres from this stack.
{
  printf '%s\n' "postgres:5432:*:${U}:${P}"
  printf '%s\n' "host.docker.internal:5432:*:${U}:${P}"
} > "$PGPASS_PATH"

chmod 600 "$PGPASS_PATH"
chown 5050:5050 "$PGPASS_PATH" 2>/dev/null || true

exec /entrypoint.sh "$@"
