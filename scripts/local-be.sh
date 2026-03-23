#!/usr/bin/env bash
# API + ai-server 동시 기동. stdout/stderr는 파일로만 쓰고, 터미널에서는 tail -f 로 각각 본다.
# Dev env: packages/api-server/.env.dev , packages/ai-server/.dev.env (앱이 자동 로드)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# 로그인 셸이 아닐 때 bun 이 PATH에 없는 경우가 있어 일반 설치 경로를 보강
export PATH="${HOME}/.bun/bin:${HOME}/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"
if ! command -v bun >/dev/null 2>&1; then
  echo "local-be: bun 을 찾을 수 없습니다. 설치: https://bun.sh — 또는 PATH에 bun 을 추가하세요." >&2
  exit 1
fi

LOGDIR="$ROOT/.logs/local"
mkdir -p "$LOGDIR"

API_LOG="$LOGDIR/api.log"
AI_LOG="$LOGDIR/ai.log"

: >"$API_LOG"
: >"$AI_LOG"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${AI_PID:-}" ]] && kill -0 "$AI_PID" 2>/dev/null; then
    kill "$AI_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$ROOT"

echo "=== $(date '+%Y-%m-%dT%H:%M:%S%z') local-be: starting API (see $API_LOG)" >>"$API_LOG"
echo "=== $(date '+%Y-%m-%dT%H:%M:%S%z') local-be: starting AI (see $AI_LOG)" >>"$AI_LOG"

bun run dev:api-server >>"$API_LOG" 2>&1 &
API_PID=$!

bun run dev:ai-server >>"$AI_LOG" 2>&1 &
AI_PID=$!

echo ""
echo "local-be: API (pid $API_PID) and AI (pid $AI_PID) are running."
echo "  Log files (open in other terminals):"
echo "    tail -f $API_LOG"
echo "    tail -f $AI_LOG"
echo "  Stop both: Ctrl+C in this terminal."
echo ""

wait
