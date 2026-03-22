#!/usr/bin/env bash
# 실제 PostgreSQL + (선택) 시드가 있는 환경에서만 실행하세요.
#   DATABASE_URL=... ./scripts/run-integration-tests.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "오류: DATABASE_URL 이 설정되어 있어야 합니다." >&2
  echo "예: export DATABASE_URL=postgresql://..." >&2
  exit 1
fi

echo "=== 통합 테스트 (Feed / Rankings / Earnings, #[ignore] 해제) ==="
cargo test --test integration_feed --test integration_rankings --test integration_earnings -- --ignored --nocapture

echo "=== 통합 테스트 통과 ==="
