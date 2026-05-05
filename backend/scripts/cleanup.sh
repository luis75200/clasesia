#!/bin/bash
set -e

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      echo "Uso: scripts/cleanup.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $arg"
      echo "Uso: scripts/cleanup.sh [--dry-run]"
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
elif [ -f .env.local ]; then
  # shellcheck disable=SC1091
  source .env.local
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR]${NC} $1"; }

SQL_POSTGRES=$(cat <<'SQL'
BEGIN;
TRUNCATE TABLE
  comment_mentions,
  notifications,
  comments,
  ticket_labels,
  ticket_assignees,
  tickets,
  projects,
  auth_sessions,
  users
RESTART IDENTITY CASCADE;
COMMIT;
SQL
)

SQL_SQLITE=$(cat <<'SQL'
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
DELETE FROM comment_mentions;
DELETE FROM notifications;
DELETE FROM comments;
DELETE FROM ticket_labels;
DELETE FROM ticket_assignees;
DELETE FROM tickets;
DELETE FROM projects;
DELETE FROM auth_sessions;
DELETE FROM users;
COMMIT;
PRAGMA foreign_keys = ON;
SQL
)

if [ "$DRY_RUN" = true ]; then
  log_warn "Modo dry-run activado. No se aplicarán cambios."
fi

if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  log_info "Limpiando tablas en Postgres/Supabase"
  if [ "$DRY_RUN" = true ]; then
    printf "%s\n" "$SQL_POSTGRES"
  else
    printf "%s\n" "$SQL_POSTGRES" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q
  fi
elif [ -f "$ROOT_DIR/data/minijira.db" ] && command -v sqlite3 >/dev/null 2>&1; then
  log_info "Limpiando tablas en SQLite"
  if [ "$DRY_RUN" = true ]; then
    printf "%s\n" "$SQL_SQLITE"
  else
    printf "%s\n" "$SQL_SQLITE" | sqlite3 -bail "$ROOT_DIR/data/minijira.db"
  fi
else
  log_err "No hay backend SQL disponible para cleanup"
  exit 1
fi

if [ -d "$ROOT_DIR/tmp" ]; then
  log_info "Eliminando contenido de tmp/"
  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] rm -rf \"$ROOT_DIR/tmp\"/*"
  else
    rm -rf "$ROOT_DIR/tmp"/*
  fi
else
  log_warn "No existe tmp/, se omite"
fi

log_ok "cleanup.sh completado"
