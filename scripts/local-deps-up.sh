#!/usr/bin/env bash
# Postgres + Meilisearch + Redis + SearXNG 만 Docker로 기동 (전체 스택과 동일한 compose, 서비스만 부분 기동). 앱 런타임은 로컬.
# 전체 백엔드 컨테이너: scripts/deploy-backend.sh dev up
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK_COMPOSE="$ROOT/packages/api-server/docker/stack/docker-compose.yml"
docker compose -f "$STACK_COMPOSE" up -d postgres meilisearch redis searxng
echo "OK: postgres + meilisearch + redis + searxng. Ports: 5432, 7700, 6303, 4000."
