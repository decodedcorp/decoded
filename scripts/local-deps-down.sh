#!/usr/bin/env bash
# local-deps-up 으로 올린 의존 컨테이너만 중지 (제거는 하지 않음).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK_COMPOSE="$ROOT/packages/api-server/docker/stack/docker-compose.yml"
docker compose -f "$STACK_COMPOSE" stop meilisearch redis searxng 2>/dev/null || true
echo "Stopped: meilisearch, redis, searxng (if they were running)."
