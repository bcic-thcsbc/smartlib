#!/bin/sh
set -eu

if [ ! -s "$DATABASE_PATH" ]; then
  mkdir -p "$(dirname "$DATABASE_PATH")"
  cp /app/schema.sqlite "$DATABASE_PATH"
  echo '{"event":"database_initialized_from_schema"}'
fi

exec "$@"
