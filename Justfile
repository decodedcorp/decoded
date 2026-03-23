# 로컬 개발 — 모노레포 루트에서 실행: https://github.com/casey/just
# 설치: brew install just  (또는 cargo install just)
# 목록: just --list

repo := justfile_directory()

default:
    @just --list

# Split terminals: API / AI / Web logs stay separate (see local-help)
local-fe:
    bun run dev:local-fe

# API + AI together; logs -> .logs/local/api.log and .logs/local/ai.log (tail -f in other terminals)
local-be:
    bun run dev:local-be

# Docker deps only — no app containers
local-deps:
    bash "{{ repo }}/scripts/local-deps-up.sh"

local-deps-down:
    bash "{{ repo }}/scripts/local-deps-down.sh"

# Git pre-push — 모노레포 로컬 CI (프론트 슬롯 + ai-server + api-server)
hook:
    #!/usr/bin/env bash
    set -euo pipefail
    chmod +x "{{ repo }}/scripts/git-pre-push.sh" "{{ repo }}/.githooks/pre-push" "{{ repo }}/packages/ai-server/scripts/pre-push.sh" "{{ repo }}/packages/web/scripts/pre-push.sh"
    git -C "{{ repo }}" config core.hooksPath .githooks
    echo "OK: git config core.hooksPath=.githooks (repo: {{ repo }})"

# 온보딩용 안내
local-help:
    @echo "0) Env: .env.dev + .dev.env (see .env.dev.example / .dev.env.example in each package)"
    @echo "1) 의존 서비스: just local-deps  (또는: bun run dev:local-deps)"
    @echo "2) 터미널 A: just local-be  (API+AI 동시 기동, 로그는 파일로만)"
    @echo "   터미널 B: tail -f .logs/local/api.log"
    @echo "   터미널 C: tail -f .logs/local/ai.log"
    @echo "3) 터미널 D: just local-fe"
    @echo "   local-be 종료: 터미널 A에서 Ctrl+C"
    @echo "전체 한 터미널: bun run dev  (turbo, 로그 한 스트림)"
    @echo "push 전 로컬 CI: just hook  후 bun run ci:local  (또는 git push 가 훅 실행)"

# Web 프론트엔드 로컬 CI (lint + format + tsc)
ci-web:
    bash "{{ repo }}/packages/web/scripts/pre-push.sh"

