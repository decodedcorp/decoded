#!/usr/bin/env bash
# 모노레포 루트 로컬 CI — `git push` 전 실행.
# 설치: 저장소 루트에서 `git config core.hooksPath .githooks` (또는 `just hook`)
# 수동: `bash scripts/git-pre-push.sh` / `bun run ci:local`
set -euo pipefail

_self="${BASH_SOURCE[0]:-$0}"
while [ -h "$_self" ]; do
  _dir="$(cd -P "$(dirname "$_self")" && pwd)"
  _link="$(readlink "$_self" || true)"
  case "$_link" in
    /*) _self="$_link" ;;
    *) _self="$_dir/$_link" ;;
  esac
done
REPO_ROOT="$(cd -P "$(dirname "$_self")/.." && pwd)"
cd "$REPO_ROOT"

# Git 훅 호출 시 stdin으로 ref 목록이 옴. 여기서 한 번 소비해 main/master 직접 push 차단.
# (api-server pre-push.sh에도 동일 블록이 있으나, stdin은 한 번만 읽을 수 있음)
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

if [[ -n "${SKIP_FE_CI:-}" ]]; then
  echo "=== [monorepo] web CI 건너뜀 (SKIP_FE_CI) ==="
else
  echo "=== [monorepo] web 로컬 CI ==="
  bash "$REPO_ROOT/packages/web/scripts/pre-push.sh"
fi

# ai-server 는 flake8 정리 등 팀 준비 전까지 기본 건너뜀. 켜기: RUN_AI_SERVER_CI=1
if [[ -n "${SKIP_AI_SERVER_CI:-}" ]]; then
  echo "=== [monorepo] ai-server CI 건너뜀 (SKIP_AI_SERVER_CI) ==="
elif [[ -n "${RUN_AI_SERVER_CI:-}" ]]; then
  echo "=== [monorepo] ai-server 로컬 CI ==="
  bash "$REPO_ROOT/packages/ai-server/scripts/pre-push.sh"
else
  echo "=== [monorepo] ai-server CI 건너뜀 (기본 — 켜려면 RUN_AI_SERVER_CI=1) ==="
fi

echo "=== [monorepo] api-server 로컬 CI ==="
bash "$REPO_ROOT/packages/api-server/scripts/pre-push.sh"

if [[ -n "${SKIP_WIKI_CI:-}" ]]; then
  echo "=== [monorepo] wiki lint 건너뜀 (SKIP_WIKI_CI) ==="
else
  echo "=== [monorepo] wiki lint ==="
  bun run wiki:lint
fi

echo "=== [monorepo] 모든 체크 통과 ==="
