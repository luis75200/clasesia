#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      echo "Uso: ./seed.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $arg"
      echo "Uso: ./seed.sh [--dry-run]"
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  # shellcheck disable=SC1091
  source ".env"
elif [[ -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  source ".env.local"
fi

if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

info() {
  printf "%b[INFO]%b %s\n" "$BLUE" "$NC" "$1"
}

warn() {
  printf "%b[WARN]%b %s\n" "$YELLOW" "$NC" "$1"
}

ok() {
  printf "%b[OK]%b %s\n" "$GREEN" "$NC" "$1"
}

fail() {
  printf "%b[ERROR]%b %s\n" "$RED" "$NC" "$1" >&2
  exit 1
}

MODE=""
SQLITE_DB_PATH="${SQLITE_DB_PATH:-$ROOT_DIR/data/minijira.db}"
DB_URL="${DATABASE_URL:-}"

if [[ -n "$DB_URL" ]] && command -v psql >/dev/null 2>&1; then
  if [[ "$DB_URL" == *"supabase.co"* ]]; then
    MODE="supabase-sql"
  else
    MODE="postgres-sql"
  fi
elif [[ -f "$SQLITE_DB_PATH" ]] && command -v sqlite3 >/dev/null 2>&1; then
  MODE="sqlite-sql"
fi

if [[ -z "$MODE" ]]; then
  fail "No se pudo detectar un backend disponible. Requiere psql + DATABASE_URL o sqlite3 + $SQLITE_DB_PATH"
fi

POSTGRES_SQL=$(cat <<'SQL'
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

INSERT INTO auth_sessions (id, user_id, session_token, status, expires_at, created_at, updated_at) VALUES
  ('s-admin', 'u-admin', 'seed-session-admin', 'ACTIVE', NOW() + INTERVAL '30 days', NOW(), NOW());

INSERT INTO projects (id, name, key, description, status, owner_id, created_at, updated_at) VALUES
  ('p-alpha', 'Alpha', 'ALPHA', 'Proyecto principal del tablero', 'ACTIVE', 'u-admin', NOW(), NOW()),
  ('p-beta', 'Beta', 'BETA', 'Proyecto secundario', 'ACTIVE', 'u-admin', NOW(), NOW());

INSERT INTO tickets (id, title, description, status, priority, is_blocked, version, created_by, project_id, created_at, updated_at) VALUES
  ('t-100', 'Configurar OAuth corporativo', 'Integrar login con proveedor corporativo', 'TODO', 'HIGH', false, 1, 'u-admin', 'p-alpha', NOW(), NOW()),
  ('t-101', 'Implementar tablero Kanban', 'Arrastrar y soltar entre columnas', 'IN_PROGRESS', 'MEDIUM', false, 1, 'u-luis', 'p-alpha', NOW(), NOW()),
  ('t-102', 'Exportar métricas CSV', 'Exportación progresiva para volumen alto', 'REVIEW', 'HIGH', true, 1, 'u-ana', 'p-beta', NOW(), NOW());

INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES
  ('t-100', 'u-luis', NOW()),
  ('t-101', 'u-ana', NOW()),
  ('t-102', 'u-luis', NOW());

INSERT INTO ticket_labels (ticket_id, label, created_at) VALUES
  ('t-100', 'auth', NOW()),
  ('t-101', 'kanban', NOW()),
  ('t-102', 'metrics', NOW());

INSERT INTO comments (id, ticket_id, author_id, body, created_at, updated_at) VALUES
  ('c-100', 't-101', 'u-luis', 'Necesito feedback de @ana para cerrar este ticket', NOW(), NOW()),
  ('c-101', 't-102', 'u-ana', 'Se agregó primera versión del export CSV', NOW(), NOW());

INSERT INTO comment_mentions (comment_id, mentioned_user_id, created_at) VALUES
  ('c-100', 'u-ana', NOW());

INSERT INTO notifications (id, recipient_id, ticket_id, comment_id, type, status, message, created_at) VALUES
  ('n-100', 'u-ana', 't-101', 'c-100', 'COMMENT_MENTION', 'PENDING', 'Has sido mencionado en un comentario', NOW());

COMMIT;
SQL
)

SQLITE_SQL=$(cat <<'SQL'
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

INSERT INTO auth_sessions (id, user_id, session_token, status, expires_at, created_at, updated_at) VALUES
  ('s-admin', 'u-admin', 'seed-session-admin', 'ACTIVE', datetime('now', '+30 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO projects (id, name, key, description, status, owner_id, created_at, updated_at) VALUES
  ('p-alpha', 'Alpha', 'ALPHA', 'Proyecto principal del tablero', 'ACTIVE', 'u-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('p-beta', 'Beta', 'BETA', 'Proyecto secundario', 'ACTIVE', 'u-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO tickets (id, title, description, status, priority, is_blocked, version, created_by, project_id, created_at, updated_at) VALUES
  ('t-100', 'Configurar OAuth corporativo', 'Integrar login con proveedor corporativo', 'TODO', 'HIGH', 0, 1, 'u-admin', 'p-alpha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-101', 'Implementar tablero Kanban', 'Arrastrar y soltar entre columnas', 'IN_PROGRESS', 'MEDIUM', 0, 1, 'u-luis', 'p-alpha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('t-102', 'Exportar métricas CSV', 'Exportación progresiva para volumen alto', 'REVIEW', 'HIGH', 1, 1, 'u-ana', 'p-beta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES
  ('t-100', 'u-luis', CURRENT_TIMESTAMP),
  ('t-101', 'u-ana', CURRENT_TIMESTAMP),
  ('t-102', 'u-luis', CURRENT_TIMESTAMP);

INSERT INTO ticket_labels (ticket_id, label, created_at) VALUES
  ('t-100', 'auth', CURRENT_TIMESTAMP),
  ('t-101', 'kanban', CURRENT_TIMESTAMP),
  ('t-102', 'metrics', CURRENT_TIMESTAMP);

INSERT INTO comments (id, ticket_id, author_id, body, created_at, updated_at) VALUES
  ('c-100', 't-101', 'u-luis', 'Necesito feedback de @ana para cerrar este ticket', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c-101', 't-102', 'u-ana', 'Se agregó primera versión del export CSV', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO comment_mentions (comment_id, mentioned_user_id, created_at) VALUES
  ('c-100', 'u-ana', CURRENT_TIMESTAMP);

INSERT INTO notifications (id, recipient_id, ticket_id, comment_id, type, status, message, created_at) VALUES
  ('n-100', 'u-ana', 't-101', 'c-100', 'COMMENT_MENTION', 'PENDING', 'Has sido mencionado en un comentario', CURRENT_TIMESTAMP);

COMMIT;
PRAGMA foreign_keys = ON;
SQL
)

if [[ "$MODE" == "supabase-sql" ]]; then
  info "Modo detectado: Supabase SQL directo (Postgres)"
elif [[ "$MODE" == "postgres-sql" ]]; then
  info "Modo detectado: Postgres SQL directo"
else
  info "Modo detectado: SQLite SQL directo"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  warn "Ejecutando en modo --dry-run. No se escriben cambios en BD."
  echo ""
  if [[ "$MODE" == "sqlite-sql" ]]; then
    printf "%s\n" "$SQLITE_SQL"
  else
    printf "%s\n" "$POSTGRES_SQL"
  fi
  ok "Dry-run completado."
  exit 0
fi

info "Iniciando seed idempotente..."
if [[ "$MODE" == "sqlite-sql" ]]; then
  info "Aplicando SQL sobre SQLite: $SQLITE_DB_PATH"
  printf "%s\n" "$SQLITE_SQL" | sqlite3 -bail "$SQLITE_DB_PATH"
else
  if [[ -z "$DB_URL" ]]; then
    fail "DATABASE_URL no está definido"
  fi
  info "Aplicando SQL sobre Postgres/Supabase usando DATABASE_URL"
  printf "%s\n" "$POSTGRES_SQL" | psql "$DB_URL" -v ON_ERROR_STOP=1 -q
fi

ok "Seed finalizado correctamente."
