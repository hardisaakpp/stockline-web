#!/usr/bin/env bash
# Runs Xia (the assistant's engine, a separate project) for Stockline: its own database, its own signing key
# and only the documents in assistant/knowledge. Usage: npm run dev:xia [-- index|serve|all]  (default: all)
#   index  create the database if needed and (re)index the knowledge base
#   serve  start the HTTP API on the port the web app expects
set -euo pipefail

# Docker Engine, whatever context Docker Desktop (if installed) left selected.
export DOCKER_CONTEXT="${STOCKLINE_DOCKER_CONTEXT:-default}"

HERE="$(cd "$(dirname "$0")/.." && pwd)"
XIA_DIR="${STOCKLINE_XIA_DIR:-$(cd "$HERE/../xia" && pwd)}"
PORT="${STOCKLINE_XIA_PORT:-8901}"
DB="${STOCKLINE_XIA_DB:-xia_stockline}"
PG_CONTAINER="${STOCKLINE_XIA_PG_CONTAINER:-xia-db-1}"
PY="${XIA_DIR}/.venv/bin/python"

[ -x "$PY" ] || { echo "Xia needs its virtualenv: cd $XIA_DIR && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'" >&2; exit 1; }

# Configuration is passed through the environment, so nothing is read from Xia's own .env (that one belongs to another deployment).
export XIA_DATABASE_URL="${STOCKLINE_XIA_DATABASE_URL:-postgresql://xia:xia@127.0.0.1:5433/${DB}}"
export XIA_SOURCES_FILE="$HERE/assistant/sources.yaml"
export XIA_ORGANIZACION="Stockline"
export XIA_AUTENTICACION="jwt"
export XIA_JWT_SECRET="${XIA_JWT_SECRET:-local-dev-xia-signing-key-local-dev-xia-signing-key}"
export XIA_JWT_ISSUER="stockline-web"
export XIA_JWT_AUDIENCE="xia"
cd "$HERE" # not Xia's folder: its .env would otherwise be picked up

ensure_database() {
  docker exec "$PG_CONTAINER" psql -U xia -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB}'" | grep -q 1 \
    || docker exec "$PG_CONTAINER" psql -U xia -d postgres -c "CREATE DATABASE ${DB}"
}

index() {
  ensure_database
  "$PY" -m xia.indexer
}

serve() {
  echo "Xia (Stockline) → http://localhost:${PORT}  (database: ${DB})"
  exec "$PY" -m uvicorn xia.api:app --host 127.0.0.1 --port "$PORT"
}

case "${1:-all}" in
  index) index ;;
  serve) serve ;;
  all) index && serve ;;
  *) echo "usage: dev-xia.sh [index|serve|all]" >&2; exit 2 ;;
esac
