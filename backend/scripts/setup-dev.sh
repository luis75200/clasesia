#!/bin/bash
set -e

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      echo "Uso: scripts/setup-dev.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $arg"
      echo "Uso: scripts/setup-dev.sh [--dry-run]"
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR]${NC} $1"; }

run_cmd() {
  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] $*"
  else
    eval "$*"
  fi
}

log_info "Iniciando setup de desarrollo"

if ! command -v pnpm >/dev/null 2>&1; then
  log_err "pnpm no está instalado. Instálalo antes de continuar."
  exit 1
fi

log_info "Instalando dependencias con pnpm"
run_cmd "pnpm install"

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    log_info "Creando .env desde .env.example"
    run_cmd "cp .env.example .env"
  else
    log_err "No existe .env.example en $ROOT_DIR"
    exit 1
  fi
else
  log_warn ".env ya existe, no se sobrescribe"
fi

if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

log_info "Ejecutando migraciones con drizzle-kit migrate"
run_cmd "pnpm exec drizzle-kit migrate"

log_info "Comprobando conectividad de base de datos"
if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null 2>&1; then
  run_cmd "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -q -c 'SELECT 1;'"
elif [ -f "$ROOT_DIR/data/minijira.db" ] && command -v sqlite3 >/dev/null 2>&1; then
  run_cmd "sqlite3 \"$ROOT_DIR/data/minijira.db\" 'SELECT 1;'"
else
  log_err "No se pudo verificar la BD. Falta DATABASE_URL+psql o data/minijira.db+sqlite3"
  exit 1
fi

log_ok "setup-dev.sh completado"
