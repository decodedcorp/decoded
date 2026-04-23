#!/usr/bin/env bash
# local-deps-up.sh 로 올린 스택을 중지 (컨테이너 제거는 하지 않음).
# 볼륨/데이터는 유지 — 완전 리셋은 `just dev-reset`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK_COMPOSE="$ROOT/packages/api-server/docker/stack/docker-compose.yml"

if command -v supabase >/dev/null 2>&1; then
  ( cd "$ROOT" && supabase stop ) || true
fi

docker compose -f "$STACK_COMPOSE" stop meilisearch redis searxng 2>/dev/null || true
echo "Stopped: supabase stack + meilisearch + redis + searxng (if they were running)."
