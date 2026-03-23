#!/usr/bin/env bash
# ai-server 로컬 CI — 루트 scripts/git-pre-push.sh 에서 호출.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if ! command -v uv >/dev/null 2>&1; then
  echo "error: uv 가 필요합니다. https://docs.astral.sh/uv/" >&2
  exit 1
fi

echo "=== ai-server: flake8 ==="
uv run flake8 src

echo "=== ai-server: black --check ==="
uv run black --check src tests

echo "=== ai-server: pytest (CI 서브집합) ==="
set +e
uv run pytest -m "not integration and not e2e and not performance and not external_api and not requires_redis and not requires_network"
_py_ec=$?
set -e
# 5 = 수집된 테스트 없음 — 마커만 맞춰 두었을 때 허용
if [[ "$_py_ec" -ne 0 && "$_py_ec" -ne 5 ]]; then
  exit "$_py_ec"
fi

echo "=== ai-server: 체크 통과 ==="
