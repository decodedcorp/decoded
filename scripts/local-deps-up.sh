#!/usr/bin/env bash
# 로컬 개발 의존 스택 기동 (#282):
#   - Supabase self-hosted (postgres + gotrue + postgrest + storage + realtime + studio + kong)
#     via Supabase CLI using repo-root `supabase/config.toml`
#   - Meilisearch / Redis / SearXNG via packages/api-server/docker/stack/docker-compose.yml
#   - Supabase 핵심 컨테이너(db, kong)를 `decoded-backend` 네트워크에 연결 →
#     컨테이너로 실행되는 api/ai 가 호스트명으로 접근 가능
#
# 앱 런타임(api-server / ai-server / web)은 호스트에서 실행.
# 전체 백엔드 컨테이너(prod-like): scripts/deploy-backend.sh dev up
#
# Prereqs:
#   - Docker Desktop 실행 중
#   - `brew install supabase/tap/supabase` (CLI >= 2.0)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK_COMPOSE="$ROOT/packages/api-server/docker/stack/docker-compose.yml"
BACKEND_NETWORK="decoded-backend_decoded-backend"

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ supabase CLI not found. Install: brew install supabase/tap/supabase" >&2
  exit 1
fi

echo "🟢 Supabase self-hosted stack 기동 (supabase/config.toml 사용)..."
( cd "$ROOT" && supabase start )

echo ""
echo "🟢 Meilisearch / Redis / SearXNG 기동..."
docker compose -f "$STACK_COMPOSE" up -d meilisearch redis searxng

echo ""
echo "🔗 Supabase 컨테이너를 ${BACKEND_NETWORK} 네트워크에 연결..."
# 컨테이너 alias 로 접근 가능: supabase-db:5432, supabase-kong:8000
connect_to_backend() {
  local container="$1"
  local alias="$2"
  if ! docker network inspect "$BACKEND_NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -qw "$container"; then
    docker network connect --alias "$alias" "$BACKEND_NETWORK" "$container" 2>/dev/null \
      && echo "   ✓ ${container} (alias: ${alias})" \
      || echo "   ⚠️  ${container} 연결 실패 (이미 연결되었거나 네트워크 없음)"
  else
    echo "   · ${container} 이미 연결됨"
  fi
}
connect_to_backend supabase_db_decoded-monorepo supabase-db
connect_to_backend supabase_kong_decoded-monorepo supabase-kong
connect_to_backend supabase_auth_decoded-monorepo supabase-auth

echo ""
echo "✅ 로컬 의존 스택 준비 완료"
echo "   [호스트에서 접근]"
echo "   - Postgres:    localhost:54322  (user=postgres / password=postgres / db=postgres)"
echo "   - Auth API:    http://localhost:54321"
echo "   - Studio UI:   http://localhost:54323"
echo "   - Inbucket:    http://localhost:54324  (이메일 테스트)"
echo "   - Meilisearch: http://localhost:7700"
echo "   - Redis:       localhost:6303"
echo "   - SearXNG:     http://localhost:4000"
echo ""
echo "   [${BACKEND_NETWORK} 네트워크 내부 접근]"
echo "   - Postgres:    supabase-db:5432"
echo "   - Auth API:    supabase-kong:8000  (REST / Auth / Storage 게이트웨이)"
echo ""
echo "💡 JWT secret / anon / service_role key 확인: supabase status -o env"
