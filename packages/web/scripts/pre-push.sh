#!/usr/bin/env bash
# web 프론트엔드 로컬 CI — 단독 실행 가능. 모노레포에서는 루트 `scripts/git-pre-push.sh`가 호출합니다.
# 훅 설치: 모노레포 루트에서 `git config core.hooksPath .githooks` (또는 `just hook`)
set -euo pipefail

# 심볼릭 링크 추적하여 실제 scripts/ 디렉터리 기준으로 이동
_self="${BASH_SOURCE[0]:-$0}"
while [ -h "$_self" ]; do
  _dir="$(cd -P "$(dirname "$_self")" && pwd)"
  _link="$(readlink "$_self" || true)"
  case "$_link" in
    /*) _self="$_link" ;;
    *) _self="$_dir/$_link" ;;
  esac
done
SCRIPT_DIR="$(cd -P "$(dirname "$_self")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== 0. API Spec Drift Check ==="
if [ -f "../api-server/openapi.json" ]; then
  bun run generate:api
  echo "    Regeneration complete — TypeScript check will catch drift"
else
  echo "    WARNING: ../api-server/openapi.json not found — skipping generation"
  echo "    (api-server directory required for spec drift detection)"
fi

echo "=== 1. ESLint ==="
bun run lint

echo "=== 2. Prettier ==="
bun run format:check

echo "=== 3. TypeScript ==="
bun run typecheck

if [[ -n "${RUN_FE_BUILD:-}" ]]; then
  echo "=== 4. Build ==="
  bun run build
else
  echo "=== 4. Build 건너뜀 (기본 — 켜려면 RUN_FE_BUILD=1) ==="
fi

echo "=== web: 모든 체크 통과 ==="
