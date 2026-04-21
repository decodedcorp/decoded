#!/usr/bin/env bash
# Supabase 핵심 컨테이너를 decoded-backend docker 네트워크에 alias 로 연결 (#282).
# Idempotent — 이미 연결되어 있으면 skip.
#
# Supabase CLI 가 컨테이너를 재시작할 때마다 (`supabase db reset`, `supabase stop`→`start` 등)
# 외부 네트워크 연결이 사라지므로 이 스크립트를 다시 실행해야 합니다.
#
# 제공되는 네트워크 alias (decoded-backend_decoded-backend 네트워크 내부):
#   - supabase-db:5432    Postgres
#   - supabase-kong:8000  API gateway (REST / Auth / Storage)
#   - supabase-auth:9999  GoTrue 직접 (디버깅용; 일반적으로 kong 경유)
set -euo pipefail
BACKEND_NETWORK="decoded-backend_decoded-backend"

if ! docker network inspect "$BACKEND_NETWORK" >/dev/null 2>&1; then
  echo "❌ 네트워크 ${BACKEND_NETWORK} 가 없습니다. 먼저 \`just local-deps\` 실행 필요." >&2
  exit 1
fi

echo "🔗 Supabase 컨테이너를 ${BACKEND_NETWORK} 네트워크에 연결..."
connect_to_backend() {
  local container="$1"
  local alias="$2"
  if ! docker ps --format '{{.Names}}' | grep -qw "$container"; then
    echo "   ⚠️  ${container} 컨테이너가 실행 중이 아님 (supabase start 필요)"
    return
  fi
  if docker network inspect "$BACKEND_NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -qw "$container"; then
    echo "   · ${container} 이미 연결됨"
    return
  fi
  if docker network connect --alias "$alias" "$BACKEND_NETWORK" "$container" 2>/dev/null; then
    echo "   ✓ ${container} (alias: ${alias})"
  else
    echo "   ⚠️  ${container} 연결 실패"
  fi
}
connect_to_backend supabase_db_decoded-backend supabase-db
connect_to_backend supabase_kong_decoded-backend supabase-kong
connect_to_backend supabase_auth_decoded-backend supabase-auth
