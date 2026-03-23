#!/usr/bin/env bash
# Meilisearch(api-server) + Redis·SearXNG(ai-server)만 Docker로 기동. 앱 런타임은 로컬.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker compose -f "$ROOT/packages/api-server/docker/dev/docker-compose.yml" up -d meilisearch
docker compose -f "$ROOT/packages/ai-server/docker-compose-ai-dev.yml" up -d redis-server searxng
echo "OK: Meilisearch (api dev compose), redis-server + searxng (ai-dev compose). Ports: see those YAML files / .env (e.g. 7700, 6303, 4000)."
