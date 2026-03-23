#!/usr/bin/env bash
# local-deps-up 으로 올린 의존 컨테이너만 중지 (제거는 하지 않음).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker compose -f "$ROOT/packages/api-server/docker/dev/docker-compose.yml" stop meilisearch 2>/dev/null || true
docker compose -f "$ROOT/packages/ai-server/docker-compose-ai-dev.yml" stop redis-server searxng 2>/dev/null || true
echo "Stopped: meilisearch, redis-server, searxng (if they were running)."
