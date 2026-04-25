#!/usr/bin/env bash
# 로컬 env 파일 자동 셋업 (#282):
#   1. `.env.backend.dev`, `packages/api-server/.env.dev`, `packages/web/.env.local`
#      이 없으면 각 `*.example` 에서 복사.
#   2. `supabase status -o env` 에서 현재 CLI 기동된 ANON / SERVICE_ROLE / JWT_SECRET 을
#      가져와서 위 파일들의 Supabase 관련 키만 in-place 로 업데이트.
#   3. OPENAI / R2 / Rakuten 등 개인 secret 은 절대 건드리지 않음 (키 allowlist 기반).
#
# Idempotent — 매번 실행해도 안전. 값이 다르면 갱신, 같으면 no-op.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "⚠️  supabase CLI not found — env sync 스킵" >&2
  exit 0
fi

# Supabase 기동 여부 확인 (status 가 실패하면 스킵 — local-deps-up 이 먼저 start 호출했어야 함)
if ! supabase status -o env >/dev/null 2>&1; then
  echo "⚠️  supabase not running — env sync 스킵. \`supabase start\` 먼저 실행 필요." >&2
  exit 0
fi

SB_STATUS="$(supabase status -o env 2>/dev/null)"
# 형식: KEY="value"  — 큰따옴표 벗겨서 추출
read_sb() {
  printf '%s\n' "$SB_STATUS" | awk -F'=' -v k="$1" '$1==k { sub(/^"/,"",$2); sub(/"$/,"",$2); print $2; exit }'
}
ANON="$(read_sb ANON_KEY)"
SERVICE="$(read_sb SERVICE_ROLE_KEY)"
JWT="$(read_sb JWT_SECRET)"
DB_URL="$(read_sb DB_URL)"
API_URL="$(read_sb API_URL)"
: "${DB_URL:=postgresql://postgres:postgres@localhost:54322/postgres}"
: "${API_URL:=http://127.0.0.1:54321}"

if [[ -z "$ANON" || -z "$SERVICE" || -z "$JWT" ]]; then
  echo "⚠️  supabase status 에서 키를 읽지 못함 — env sync 스킵" >&2
  exit 0
fi

# ---- helpers ---------------------------------------------------------------
ensure_from_example() {
  local target="$1" example="$2"
  if [[ -f "$target" ]]; then return 0; fi
  if [[ ! -f "$example" ]]; then
    echo "   ⚠️  $example 없음 — $target 생성 불가" >&2
    return 1
  fi
  cp "$example" "$target"
  echo "   ✓ $target 생성 (from $example)"
}

# KEY=VALUE 를 in-place 로 업데이트. KEY 가 없으면 append.
# allowlist 매칭되는 키만 받음 (호출 쪽 책임).
set_key() {
  local file="$1" key="$2" value="$3"
  # sed 에서 쓸 수 있도록 & 와 | 이스케이프
  local esc
  esc=$(printf '%s' "$value" | sed 's/[&|]/\\&/g')
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    # macOS/BSD sed 호환: -i '' 또는 -i.bak
    sed -i.bak "s|^${key}=.*|${key}=${esc}|" "$file" && rm -f "${file}.bak"
  else
    # 빈 줄 후 append
    [[ -s "$file" ]] && tail -c1 "$file" | read -r _ && printf '\n' >> "$file" || true
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

# 여러 키 일괄 세팅 (파일마다 다른 키 이름 대응 가능)
sync_supabase_keys() {
  local file="$1"; shift
  [[ -f "$file" ]] || return 0
  echo "   · $file"
  for kv in "$@"; do
    local k="${kv%%=*}" v="${kv#*=}"
    set_key "$file" "$k" "$v"
  done
}

# ---- 1. 파일 부트스트랩 ---------------------------------------------------
echo "🔧 로컬 env 파일 셋업..."
ensure_from_example "$ROOT/.env.backend.dev"               "$ROOT/.env.backend.example"
ensure_from_example "$ROOT/packages/api-server/.env.dev"   "$ROOT/packages/api-server/.env.dev.example"
ensure_from_example "$ROOT/packages/web/.env.local"        "$ROOT/packages/web/.env.local.example"

# ---- 2. Supabase 키 동기화 ------------------------------------------------
echo ""
echo "🔄 Supabase 관련 키 동기화 (supabase status -o env 기준)..."

# Backend / API server 공통 키 세트 (DATABASE_* 만 — #345 에서 SUPABASE_* legacy 제거)
BACKEND_KEYS=(
  "DATABASE_URL=$DB_URL"
  "DATABASE_API_URL=$API_URL"
  "DATABASE_ANON_KEY=$ANON"
  "DATABASE_SERVICE_ROLE_KEY=$SERVICE"
  "DATABASE_JWT_SECRET=$JWT"
  # B.3 완료 전까지 supabase/migrations 가 SOT
  "SKIP_DB_MIGRATIONS=1"
  # #333 — APP_ENV=local 가드로 verify 시 cloud assets 쓰기 스킵
  "APP_ENV=local"
)
# #333 — ASSETS_DATABASE_URL 은 cloud assets 프로젝트 시크릿이므로 자동 주입하지 않는다.
# 이미 값이 있으면 보존, 없으면 빈 줄 추가만 (개발자가 1Password 등에서 받아 채움).
# 비-production 에선 비어있어도 DATABASE_URL 로 fallback (api-server / ai-server WARN).
ensure_assets_placeholder() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if ! grep -q "^ASSETS_DATABASE_URL=" "$file" 2>/dev/null; then
    {
      printf '\n# #333 assets 프로젝트 (cloud) — 미설정 시 DATABASE_URL fallback + WARN.\n'
      printf 'ASSETS_DATABASE_URL=\n'
    } >> "$file"
  fi
}
ensure_assets_placeholder "$ROOT/.env.backend.dev"
ensure_assets_placeholder "$ROOT/packages/api-server/.env.dev"
sync_supabase_keys "$ROOT/.env.backend.dev"             "${BACKEND_KEYS[@]}"
sync_supabase_keys "$ROOT/packages/api-server/.env.dev" "${BACKEND_KEYS[@]}"

# Web 공개 키 (DATABASE_* 만 — #345 에서 SUPABASE_* legacy 제거)
WEB_KEYS=(
  "NEXT_PUBLIC_DATABASE_API_URL=$API_URL"
  "NEXT_PUBLIC_DATABASE_ANON_KEY=$ANON"
  "DATABASE_SERVICE_ROLE_KEY=$SERVICE"
  "API_BASE_URL=http://localhost:8000"
)
sync_supabase_keys "$ROOT/packages/web/.env.local" "${WEB_KEYS[@]}"

echo ""
echo "✅ env sync 완료. 개인 secret (OPENAI / R2 / Rakuten 등)은 그대로 유지됨."
