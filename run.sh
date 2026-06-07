#!/usr/bin/env bash
# Start SpacetimeDB, publish the nations module, and run the Vite frontend.
#
# Usage:
#   ./run.sh           Full stack (backend + frontend)
#   ./run.sh backend   SpacetimeDB only (publish + init, then keep running)
#   ./run.sh frontend  Frontend only (assumes backend is already up)
#
# Prerequisites:
#   - Node.js 18+
#   - SpacetimeDB CLI: curl -sSf https://install.spacetimedb.com | sh
#     https://spacetimedb.com/install

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NATIONS="$ROOT/nations"
MODULE="$NATIONS/spacetimedb"
SPACETIME_HOST="127.0.0.1"
SPACETIME_PORT="3000"
SPACETIME_DB="nations"

STARTED_SPACETIME=0
SPACETIME_PID=""

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }

cleanup() {
  if [[ "$STARTED_SPACETIME" -eq 1 && -n "$SPACETIME_PID" ]]; then
    yellow "Stopping SpacetimeDB (pid $SPACETIME_PID)…"
    kill "$SPACETIME_PID" 2>/dev/null || true
    wait "$SPACETIME_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_spacetime() {
  if command -v spacetime >/dev/null 2>&1; then
    return 0
  fi
  red "spacetime CLI not found on PATH."
  echo ""
  echo "Install it (macOS / Linux):"
  echo "  curl -sSf https://install.spacetimedb.com | sh"
  echo ""
  echo "Then restart your terminal and run this script again."
  echo "Docs: https://spacetimedb.com/install"
  exit 1
}

port_open() {
  if command -v nc >/dev/null 2>&1; then
    nc -z "$SPACETIME_HOST" "$SPACETIME_PORT" 2>/dev/null
    return $?
  fi
  (echo >/dev/tcp/"$SPACETIME_HOST"/"$SPACETIME_PORT") 2>/dev/null
}

wait_for_spacetime() {
  yellow "Waiting for SpacetimeDB on ${SPACETIME_HOST}:${SPACETIME_PORT}…"
  local i
  for i in $(seq 1 60); do
    if port_open; then
      green "SpacetimeDB is ready."
      return 0
    fi
    sleep 1
  done
  red "Timed out waiting for SpacetimeDB."
  exit 1
}

start_spacetime_if_needed() {
  if port_open; then
    green "SpacetimeDB already running on port ${SPACETIME_PORT}."
    return 0
  fi

  yellow "Starting SpacetimeDB in the background…"
  spacetime start &
  SPACETIME_PID=$!
  STARTED_SPACETIME=1
  wait_for_spacetime
}

publish_module() {
  yellow "Installing module dependencies…"
  (cd "$MODULE" && npm install --no-fund --no-audit)

  yellow "Publishing module '${SPACETIME_DB}' to local server…"
  spacetime publish --server local --module-path "$MODULE" "$SPACETIME_DB" -y

  yellow "Seeding world (safe to skip if already initialized)…"
  set +e
  spacetime call --server local "$SPACETIME_DB" init -y
  init_code=$?
  set -e
  if [[ "$init_code" -eq 0 ]]; then
    green "World initialized."
  else
    yellow "Init skipped (exit $init_code) — database may already be seeded."
  fi
}

setup_frontend_env() {
  if [[ ! -f "$NATIONS/.env" ]]; then
    cp "$NATIONS/.env.example" "$NATIONS/.env"
    green "Created nations/.env from .env.example"
    yellow "Optional: set GEMINI_API_KEY in nations/.env for AI features."
  fi
}

run_frontend() {
  yellow "Installing frontend dependencies…"
  (cd "$NATIONS" && npm install --no-fund --no-audit)
  setup_frontend_env
  green "Starting Vite dev server…"
  echo ""
  echo "  App:  http://localhost:5173 (or next free port)"
  echo "  DB:   ws://${SPACETIME_HOST}:${SPACETIME_PORT} / ${SPACETIME_DB}"
  echo ""
  (cd "$NATIONS" && npm run dev)
}

run_backend() {
  require_spacetime
  start_spacetime_if_needed
  publish_module
  if [[ "${1:-}" == "--detach" ]]; then
    green "Backend ready. SpacetimeDB is running."
    if [[ "$STARTED_SPACETIME" -eq 1 ]]; then
      yellow "Started by this script (pid $SPACETIME_PID). Press Ctrl+C here to stop it."
      wait "$SPACETIME_PID"
    else
      yellow "SpacetimeDB was already running — this script will exit."
      STARTED_SPACETIME=0
    fi
    return 0
  fi
  green "Backend ready."
}

mode="${1:-all}"

case "$mode" in
  backend|be|db)
    run_backend --detach
    ;;
  frontend|fe|ui|dev)
    run_frontend
    ;;
  all|"")
    run_backend
    run_frontend
    ;;
  help|-h|--help)
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    red "Unknown mode: $mode"
    echo "Usage: ./run.sh [all|backend|frontend|help]"
    exit 1
    ;;
esac
