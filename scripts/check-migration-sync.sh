#!/usr/bin/env bash
# Supabase/Postgres의 seaql_migrations 와 migration/src/lib.rs 에 등록된 마이그레이션 목록을 비교합니다.
# DATABASE_URL 필수(또는 backend/.env / .env.dev). psql 필수.
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIB_RS="${BACKEND_ROOT}/migration/src/lib.rs"

# DATABASE_URL 이 비어 있으면 backend/.env → .env.dev 순으로 로드 (도커 개발과 동일하게 .env.dev 지원)
_load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}
if [[ -z "${DATABASE_URL:-}" ]]; then
  _load_env_file "${BACKEND_ROOT}/.env"
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  _load_env_file "${BACKEND_ROOT}/.env.dev"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "error: DATABASE_URL 이 필요합니다. .env 또는 .env.dev 에 설정하거나 export 하세요. (예: postgresql://user:pass@host:5432/db)" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "error: psql 이 필요합니다. PostgreSQL 클라이언트를 설치하세요 (예: brew install libpq && brew link --force libpq)." >&2
  exit 1
fi

if [[ ! -f "$LIB_RS" ]]; then
  echo "migration/src/lib.rs 를 찾을 수 없습니다: $LIB_RS" >&2
  exit 1
fi

# lib.rs 의 `mod mYYYYMMDD_...;` 목록 (macOS 기본 bash 3.2: mapfile 미지원 → while read)
CODE_MIGS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && CODE_MIGS+=("$line")
done < <(grep -E '^\s*mod m[0-9]{8}_[0-9]{6}_' "$LIB_RS" | sed -E 's/.*mod (m[0-9]{8}_[0-9]{6}_[a-zA-Z0-9_]+);.*/\1/' | sort -u)

TMP_DB="$(mktemp)"
trap 'rm -f "$TMP_DB"' EXIT

# SeaORM 기본 테이블 seaql_migrations, 컬럼 version
psql "$DATABASE_URL" -t -A -c "SELECT version FROM seaql_migrations ORDER BY version;" 2>/dev/null >"$TMP_DB" || {
  echo "check-migration-sync: seaql_migrations 조회 실패 (권한/연결 확인)." >&2
  exit 1
}

DB_MIGS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && DB_MIGS+=("$line")
done < <(sed '/^$/d' "$TMP_DB" | sort -u)

only_in_db=()
only_in_code=()

for v in "${DB_MIGS[@]}"; do
  found=0
  for c in "${CODE_MIGS[@]}"; do
    [[ "$v" == "$c" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && only_in_db+=("$v")
done

for c in "${CODE_MIGS[@]}"; do
  found=0
  for v in "${DB_MIGS[@]}"; do
    [[ "$c" == "$v" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && only_in_code+=("$c")
done

if [[ ${#only_in_db[@]} -gt 0 || ${#only_in_code[@]} -gt 0 ]]; then
  echo "=== 마이그레이션 불일치 ===" >&2
  if [[ ${#only_in_db[@]} -gt 0 ]]; then
    echo "DB에만 있음 (코드에 반영 필요):" >&2
    printf '  %s\n' "${only_in_db[@]}" >&2
  fi
  if [[ ${#only_in_code[@]} -gt 0 ]]; then
    echo "코드에만 있음 (DB에 아직 적용 안 됨 또는 브랜치 불일치):" >&2
    printf '  %s\n' "${only_in_code[@]}" >&2
  fi
  exit 1
fi

echo "check-migration-sync: DB와 코드 마이그레이션 목록 일치 (${#CODE_MIGS[@]}개)."
exit 0
