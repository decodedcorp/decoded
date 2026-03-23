#!/usr/bin/env bash
# Decoded backend Docker 배포 (api + ai + meili + redis + searxng) — dev / staging / prod
#
# 사용 (모노레포 루트에서):
#   bash scripts/deploy-backend.sh dev up
#   bash scripts/deploy-backend.sh staging up --build
#   bash scripts/deploy-backend.sh prod down
#   bash scripts/deploy-backend.sh dev logs
#   bash scripts/deploy-backend.sh prod ps
#
# 액션: up | down | build | pull | ps | logs | restart | config
# 기본 액션: up -d
#
# 필수 env 파일:
#   dev:     packages/api-server/.env.dev      + packages/ai-server/.dev.env
#   staging: packages/api-server/.env.staging  + packages/ai-server/.staging.env
#   prod:    packages/api-server/.env.prod     + packages/ai-server/.prod.env
#
# Meilisearch: compose의 ${MEILISEARCH_MASTER_KEY}는 API env 파일로 보간됨 (--env-file).
#   prod는 .env.prod에 MEILISEARCH_MASTER_KEY 필수(:?).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK="$ROOT/packages/api-server/docker/stack"

usage() {
  echo "Usage: $0 <dev|staging|prod> [up|down|build|pull|ps|logs|restart|config] [extra docker compose args...]" >&2
  echo "Examples: $0 dev up --build   $0 staging logs -f   $0 prod restart" >&2
  exit 1
}

ENV="${1:-}"
shift || true
ACTION="${1:-up}"
[[ -n "$ENV" ]] || usage
if [[ "$ACTION" =~ ^(up|down|build|pull|ps|logs|restart|config)$ ]]; then
  shift || true
else
  ACTION="up"
fi
EXTRA=("$@")

case "$ENV" in
  dev)
    COMPOSE="$STACK/docker-compose.yml"
    API_ENV="$ROOT/packages/api-server/.env.dev"
    AI_ENV="$ROOT/packages/ai-server/.dev.env"
    ;;
  staging)
    COMPOSE="$STACK/docker-compose.staging.yml"
    API_ENV="$ROOT/packages/api-server/.env.staging"
    AI_ENV="$ROOT/packages/ai-server/.staging.env"
    ;;
  prod)
    COMPOSE="$STACK/docker-compose.prod.yml"
    API_ENV="$ROOT/packages/api-server/.env.prod"
    AI_ENV="$ROOT/packages/ai-server/.prod.env"
    ;;
  *)
    usage
    ;;
esac

require_env_files() {
  local missing=0
  if [[ ! -f "$API_ENV" ]]; then
    echo "Missing: $API_ENV (copy from packages/api-server/.env.dev.example or sibling)" >&2
    missing=1
  fi
  if [[ ! -f "$AI_ENV" ]]; then
    echo "Missing: $AI_ENV (copy from packages/ai-server/.dev.env.example or sibling)" >&2
    missing=1
  fi
  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

compose() {
  # --env-file: ${MEILISEARCH_MASTER_KEY} 등 compose 파일 내 보간용 (컨테이너 전체에 노출되지 않음)
  # set -u + 빈 EXTRA[@]는 일부 bash(예: macOS 3.2)에서 실패하므로 배열로 합쳐서 실행
  local -a cmd
  if [[ -f "$API_ENV" ]]; then
    cmd=(docker compose --env-file "$API_ENV" -f "$COMPOSE" "$@")
  else
    cmd=(docker compose -f "$COMPOSE" "$@")
  fi
  if (( ${#EXTRA[@]} > 0 )); then
    cmd+=("${EXTRA[@]}")
  fi
  "${cmd[@]}"
}

cd "$ROOT"

case "$ACTION" in
  up)
    require_env_files
    compose up -d
    echo "OK ($ENV): docker compose -f ${COMPOSE#$ROOT/} up -d"
    ;;
  down)
    compose down
    echo "OK ($ENV): stack stopped"
    ;;
  build)
    require_env_files
    compose build
    ;;
  pull)
    compose pull
    ;;
  ps)
    compose ps
    ;;
  logs)
    compose logs
    ;;
  restart)
    compose restart
    ;;
  config)
    require_env_files
    compose config
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    usage
    ;;
esac
