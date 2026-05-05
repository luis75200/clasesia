#!/bin/bash
set -e

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      echo "Uso: scripts/seed.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $arg"
      echo "Uso: scripts/seed.sh [--dry-run]"
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

INSERT INTO users (id, email, name, handle, role, is_active, created_at, updated_at) VALUES
  ('u-admin', 'admin@empresa.com', 'Admin Root', 'admin', 'admin', true, NOW(), NOW()),
  ('u-luis', 'luis@empresa.com', 'Luis Alvarado', 'luis', 'member', true, NOW(), NOW()),
  ('u-ana', 'ana@empresa.com', 'Ana Torres', 'ana', 'member', true, NOW(), NOW());

INSERT INTO projects (id, name, key, description, status, owner_id, created_at, updated_at) VALUES
  ('p-alpha', 'Alpha', 'ALPHA', 'Proyecto principal', 'ACTIVE', 'u-admin', NOW(), NOW()),
  ('p-beta', 'Beta', 'BETA', 'Proyecto secundario', 'ACTIVE', 'u-admin', NOW(), NOW());

INSERT INTO tickets (id, title, description, status, priority, is_blocked, version, created_by, project_id, created_at, updated_at) VALUES
  ('t-100', 'Configurar OAuth corporativo', 'Integrar login corporativo', 'TODO', 'HIGH', false, 1, 'u-admin', 'p-alpha', NOW(), NOW()),
  ('t-101', 'Implementar drag and drop', 'Mover tickets entre columnas', 'IN_PROGRESS', 'MEDIUM', false, 1, 'u-luis', 'p-alpha', NOW(), NOW()),
  ('t-102', 'QA de export CSV', 'Validar rango y volumen', 'REVIEW', 'HIGH', false, 1, 'u-ana', 'p-beta', NOW(), NOW()),
  ('t-103', 'Documentar API de metrics', 'Agregar ejemplos de uso', 'DONE', 'LOW', false, 1, 'u-admin', 'p-beta', NOW(), NOW()),
  ('t-104', 'Investigar bug de sesión', 'Revisar expiración en frontend', 'TODO', 'MEDIUM', true, 1, 'u-luis', 'p-alpha', NOW(), NOW());

INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES
  ('t-100', 'u-luis', NOW()),
  ('t-101', 'u-ana', NOW()),
  ('t-102', 'u-luis', NOW()),
  ('t-103', 'u-admin', NOW()),
  ('t-104', 'u-ana', NOW());

INSERT INTO ticket_labels (ticket_id, label, created_at) VALUES
  ('t-100', 'auth', NOW()),
  ('t-101', 'kanban', NOW()),
  ('t-102', 'metrics', NOW()),
  ('t-103', 'docs', NOW()),
  ('t-104', 'session', NOW());

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

INSERT INTO users (id, email, name, handle, role, is_active, created_at, updated_at) VALUES
  ('u-admin', 'admin@empresa.com', 'Admin Root', 'admin', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('u-luis', 'luis@empresa.com', 'Luis Alvarado', 'luis', 'member', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('u-ana', 'ana@empresa.com', 'Ana Torres', 'ana', 'member', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO projects (id, name, key, description, status, owner_id, created_at, updated_at) VALUES
  ('p-alpha', 'Alpha', 'ALPHA', 'Proyecto principal', 'ACTIVE', 'u-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p-beta', 'Beta', 'BETA', 'Proyecto secundario', 'ACTIVE', 'u-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO tickets (id, title, description, status, priority, is_blocked, version, created_by, project_id, created_at, updated_at) VALUES
  ('t-100', 'Configurar OAuth corporativo', 'Integrar login corporativo', 'TODO', 'HIGH', 0, 1, 'u-admin', 'p-alpha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-101', 'Implementar drag and drop', 'Mover tickets entre columnas', 'IN_PROGRESS', 'MEDIUM', 0, 1, 'u-luis', 'p-alpha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-102', 'QA de export CSV', 'Validar rango y volumen', 'REVIEW', 'HIGH', 0, 1, 'u-ana', 'p-beta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-103', 'Documentar API de metrics', 'Agregar ejemplos de uso', 'DONE', 'LOW', 0, 1, 'u-admin', 'p-beta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-104', 'Investigar bug de sesión', 'Revisar expiración en frontend', 'TODO', 'MEDIUM', 1, 1, 'u-luis', 'p-alpha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES
  ('t-100', 'u-luis', CURRENT_TIMESTAMP),
  ('t-101', 'u-ana', CURRENT_TIMESTAMP),
  ('t-102', 'u-luis', CURRENT_TIMESTAMP),
  ('t-103', 'u-admin', CURRENT_TIMESTAMP),
  ('t-104', 'u-ana', CURRENT_TIMESTAMP);

INSERT INTO ticket_labels (ticket_id, label, created_at) VALUES
  ('t-100', 'auth', CURRENT_TIMESTAMP),
  ('t-101', 'kanban', CURRENT_TIMESTAMP),
  ('t-102', 'metrics', CURRENT_TIMESTAMP),
  ('t-103', 'docs', CURRENT_TIMESTAMP),
  ('t-104', 'session', CURRENT_TIMESTAMP);

COMMIT;
PRAGMA foreign_keys = ON;
SQL
)

run_supabase_mcp() {
  if [ -n "${SUPABASE_EXECUTE_SQL_CMD:-}" ]; then
    # SUPABASE_EXECUTE_SQL_CMD debe aceptar SQL por stdin
    printf "%s\n" "$1" | eval "$SUPABASE_EXECUTE_SQL_CMD"
    return 0
  fi
  return 1
}

if [ "$DRY_RUN" = true ]; then
  log_warn "Modo dry-run activado. No se aplicarán cambios."
fi

if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  log_info "Detectado Postgres/Supabase via DATABASE_URL + psql"
  if [ "$DRY_RUN" = true ]; then
    printf "%s\n" "$SQL_POSTGRES"
  else
    if run_supabase_mcp "$SQL_POSTGRES"; then
      log_ok "Seed aplicado via SUPABASE_EXECUTE_SQL_CMD (MCP wrapper)."
    else
      printf "%s\n" "$SQL_POSTGRES" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q
      log_ok "Seed aplicado con SQL directo via psql."
    fi
  fi
elif [ -f "$ROOT_DIR/data/minijira.db" ] && command -v sqlite3 >/dev/null 2>&1; then
  log_info "Detectado SQLite local"
  if [ "$DRY_RUN" = true ]; then
    printf "%s\n" "$SQL_SQLITE"
  else
    printf "%s\n" "$SQL_SQLITE" | sqlite3 -bail "$ROOT_DIR/data/minijira.db"
    log_ok "Seed aplicado con SQL directo en SQLite."
  fi
else
  log_err "No hay backend SQL disponible. Configure DATABASE_URL+psql o sqlite3 con data/minijira.db"
  exit 1
fi

log_ok "seed.sh completado"
