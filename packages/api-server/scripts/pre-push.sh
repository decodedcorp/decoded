#!/usr/bin/env bash
# 로컬 CI — git push 전에 실행 권장:
#   (api-server 디렉터리에서) ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
set -euo pipefail

# Git이 이 스크립트를 pre-push 훅으로 호출할 때만 stdin으로 ref 정보가 옴.
# 수동 실행(`./pre-push.sh`)은 TTY라서 이 검사를 건너뜀.
if ! [ -t 0 ]; then
  while read -r local_ref local_sha remote_ref remote_sha; do
    [ -z "${remote_ref:-}" ] && continue
    case "$remote_ref" in
      refs/heads/main | refs/heads/master)
        printf '%s\n' "error: remote '${remote_ref#refs/heads/}'(으)로 직접 push 할 수 없습니다. 브랜치를 만들고 PR로 머지하세요." >&2
        exit 1
        ;;
    esac
  done
fi

# `.git/hooks/pre-push` → `scripts/pre-push.sh` 심볼릭 링크로 호출될 때도 실제 `scripts/` 기준
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

echo "=== 1. 포맷팅 ==="
cargo fmt --check

echo "=== 2. Clippy ==="
# `Cargo.toml` [lints.rust] unused_imports=deny — 사용하지 않는 import 시 실패
# migration / entity: 각 디렉터리 `clippy.toml` (unwrap 비금지)
cargo clippy -p migration -p entity --all-targets -- -D warnings
# decoded-api: `clippy.toml` disallowed_methods (런타임 unwrap 금지; SeaORM/json! 등은 모듈 단위 allow)
cargo clippy -p decoded-api --all-targets -- -D warnings

echo "=== 3. 단위 테스트 (lib — DB 불필요) ==="
cargo test --lib

echo "=== 4. cargo-deny ==="
if ! command -v cargo-deny >/dev/null 2>&1; then
  echo "error: cargo-deny 가 필요합니다. 설치: cargo install cargo-deny" >&2
  exit 1
fi
cargo deny check

echo "=== 5. 커버리지 (tarpaulin, lib, 엔티티 제외, 10% 미만 시 실패) ==="
if ! command -v cargo-tarpaulin >/dev/null 2>&1; then
  echo "error: cargo-tarpaulin 이 필요합니다. 설치: cargo install cargo-tarpaulin" >&2
  exit 1
fi
# SeaORM 엔티티 파일은 생성 코드 위주라 단위 커버리지 분모에서 제외
# 필요 시: TARPAULIN_FAIL_UNDER=9 ./scripts/pre-push.sh (임시 완화)
: "${TARPAULIN_FAIL_UNDER:=10}"
cargo tarpaulin --lib \
  --exclude-files 'src/entities/*' \
  --fail-under "${TARPAULIN_FAIL_UNDER}" \
  --out Stdout

echo "=== 6. Supabase / DB 마이그레이션 sync ==="
bash "$SCRIPT_DIR/check-migration-sync.sh"

echo "=== 모든 체크 통과 ==="
