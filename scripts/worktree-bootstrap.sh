#!/usr/bin/env bash
# scripts/worktree-bootstrap.sh — 워크트리에서 `bun dev`를 바로 돌릴 수 있도록
# env 파일을 메인 워크트리에서 심볼릭 링크하고 의존성을 재정비한다.
#
# 사용:
#   ./scripts/worktree-bootstrap.sh <worktree-path>           # 메인 워크트리 기준으로 자동 셋업
#   ./scripts/worktree-bootstrap.sh <worktree-path> --port 3001
#   ./scripts/worktree-bootstrap.sh --here                     # 현재 cwd가 워크트리라고 가정
#
# 규칙:
# - 메인 워크트리 = `git worktree list`의 첫 번째 (=원본 clone) 경로
# - 대상 워크트리의 `.env.local` / `.env.backend.dev` / `packages/web/.playwright`가 없으면 심볼릭 링크
# - `bun install`로 워크트리용 lockfile 동기화
# - --port 지정 시 `<worktree>/packages/web/.env.local.port`에 PORT 써두고 안내 출력
#
# 왜 symlink인가:
# - env 파일 수정이 모든 워크트리에 즉시 반영됨 (중복 없음)
# - git status에 추적 대상으로 잡히지 않음 (gitignored)
# - 실수로 커밋할 여지 최소화

set -euo pipefail

usage() {
  cat <<EOS
usage: $(basename "$0") <worktree-path> [--port <n>]
       $(basename "$0") --here [--port <n>]

options:
  --port <n>    dev 서버가 쓸 포트 (기본: 3000, 여러 워크트리 동시 실행 시 3001/3002…)
  --here        현재 cwd를 워크트리 경로로 사용
  -h, --help    이 메시지

예:
  $(basename "$0") .worktrees/149-search-fix --port 3001
EOS
}

WT=""
PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --here) WT="$(pwd)"; shift ;;
    --port) PORT="${2:?--port 값이 필요합니다}"; shift 2 ;;
    --port=*) PORT="${1#*=}"; shift ;;
    --) shift; break ;;
    -*) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [[ -z "$WT" ]]; then WT="$1"; shift
      else echo "unexpected argument: $1" >&2; usage >&2; exit 2
      fi
      ;;
  esac
done

if [[ -z "$WT" ]]; then
  echo "error: 워크트리 경로가 필요합니다." >&2
  usage >&2
  exit 2
fi

WT="$(cd "$WT" && pwd)"

# 현재 디렉토리 기준으로 git 메타 조회 (main worktree 판별)
MAIN_WT="$(git -C "$WT" worktree list --porcelain | awk '$1=="worktree"{print $2; exit}')"

if [[ -z "$MAIN_WT" ]]; then
  echo "error: $WT 는 git 워크트리가 아닙니다." >&2
  exit 1
fi

if [[ "$MAIN_WT" == "$WT" ]]; then
  echo "error: 메인 워크트리에서는 실행하지 마세요. 병렬 QA용 보조 워크트리에서만 돌립니다." >&2
  echo "       현재 MAIN=$MAIN_WT"
  exit 1
fi

echo "→ main worktree : $MAIN_WT"
echo "→ target worktree: $WT"
echo

# -- env 심볼릭 링크 대상 목록
# (source-relative-path | target-relative-path | required?)
link_entry() {
  local src_rel="$1"
  local dst_rel="$2"
  local required="${3:-false}"

  local src="$MAIN_WT/$src_rel"
  local dst="$WT/$dst_rel"

  if [[ ! -e "$src" ]]; then
    if [[ "$required" == "true" ]]; then
      echo "  ✗ $dst_rel 필요하지만 메인에 $src_rel 없음" >&2
      return 1
    else
      echo "  · $dst_rel skip (메인에 $src_rel 없음)"
      return 0
    fi
  fi

  # 이미 올바른 심볼릭 링크면 skip
  if [[ -L "$dst" ]] && [[ "$(readlink "$dst")" == "$src" ]]; then
    echo "  ✓ $dst_rel (이미 링크됨)"
    return 0
  fi

  # 파일이 이미 있으면 보존 (수동 세팅 존중)
  if [[ -e "$dst" ]] && [[ ! -L "$dst" ]]; then
    echo "  · $dst_rel 이미 존재 (파일) — 유지"
    return 0
  fi

  mkdir -p "$(dirname "$dst")"
  ln -sfn "$src" "$dst"
  echo "  ✓ $dst_rel → $src_rel"
}

echo "[1/3] env 파일 심볼릭 링크"
link_entry "packages/web/.env.local"        "packages/web/.env.local"        true
link_entry ".env.backend.dev"               ".env.backend.dev"
link_entry "packages/web/.env.development"  "packages/web/.env.development"
link_entry "packages/web/.playwright"       "packages/web/.playwright"

echo
echo "[2/3] bun install (워크트리 node_modules 동기화)"
if command -v bun >/dev/null 2>&1; then
  (cd "$WT" && bun install --silent)
  echo "  ✓ bun install 완료"
else
  echo "  ✗ bun이 설치되어 있지 않습니다. 'brew install oven-sh/bun/bun'으로 먼저 설치하세요." >&2
  exit 1
fi

echo
echo "[3/3] 포트 안내"
if [[ -n "$PORT" ]]; then
  # `.env.worktree.local`은 기존 `.env.*.local` gitignore 패턴에 포함됨 → 워크트리 로컬 전용
  PORT_ENV="$WT/packages/web/.env.worktree.local"
  printf "PORT=%s\n" "$PORT" > "$PORT_ENV"
  echo "  ✓ $PORT_ENV 생성 (gitignored)"
  echo "  ℹ dev 서버: (cd $WT/packages/web && PORT=$PORT bun dev)"
else
  echo "  ℹ --port 미지정 (기본 3000). 다른 워크트리와 동시 실행 시 --port 3001/3002… 사용"
  echo "  ℹ dev 서버: (cd $WT/packages/web && bun dev)"
fi

echo
echo "✅ bootstrap 완료: $WT"
