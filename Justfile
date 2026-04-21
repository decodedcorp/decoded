# 로컬 개발 — 모노레포 루트에서 실행: https://github.com/casey/just
# 설치: brew install just  (또는 cargo install just)
# 목록: just --list

repo := justfile_directory()

default:
    @just --list

# Next.js web dev server (foreground)
local-fe:
    bun run dev:local-fe

# api-server (Rust) + ai-server (Python) 동시 기동, 로그는 .logs/local/{api,ai}.log 로만
local-be:
    bun run dev:local-be

# 의존 스택 + env 자동 셋업 (Supabase CLI + meili/redis/searxng + 네트워크 alias + env sync)
local-deps:
    bash "{{ repo }}/scripts/local-deps-up.sh"

# 의존 스택 중지 (볼륨/데이터는 유지)
local-deps-down:
    bash "{{ repo }}/scripts/local-deps-down.sh"

# .env.* 파일만 재동기화 (Supabase 키 변경 시)
local-env-sync:
    bash "{{ repo }}/scripts/local-env-sync.sh"

# 🚀 원커맨드 풀 로컬 개발 스택 (deps + BE + FE, Ctrl+C 로 전체 종료)
dev:
    #!/usr/bin/env bash
    set -euo pipefail

    # ---- prereq 체크 ------------------------------------------------------
    missing=()
    command -v supabase >/dev/null 2>&1 || missing+=("supabase (brew install supabase/tap/supabase)")
    command -v docker   >/dev/null 2>&1 || missing+=("docker (Docker Desktop)")
    command -v bun      >/dev/null 2>&1 || missing+=("bun (https://bun.sh)")
    if (( ${#missing[@]} > 0 )); then
        echo "❌ 누락된 도구:"
        printf '   - %s\n' "${missing[@]}"
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker 데몬이 실행 중이 아닙니다. Docker Desktop 을 먼저 기동하세요."
        exit 1
    fi

    # ---- 앱 포트 선점 체크 (Supabase/meili 포트는 local-deps 가 관리) ----
    for port in 8000 3000; do
        if lsof -i :$port -sTCP:LISTEN >/dev/null 2>&1; then
            echo "⚠️  포트 $port 가 이미 사용 중 — 기존 프로세스 종료 후 재시도"
            echo "    $(lsof -i :$port -sTCP:LISTEN 2>/dev/null | tail -n +2 | awk '{print $1, $2}' | head -1)"
            exit 1
        fi
    done

    # ---- 1. deps + env --------------------------------------------------
    just local-deps

    # ---- 2. BE + FE -------------------------------------------------------
    echo ""
    echo "🚀 Starting api-server + ai-server + web. Ctrl+C 로 전체 종료."
    echo "   📡 http://localhost:3000  (web)"
    echo "   🔧 http://localhost:8000  (api-server)"
    echo "   📋 tail -f .logs/local/api.log   # api-server 로그"
    echo "   📋 tail -f .logs/local/ai.log    # ai-server 로그"
    echo ""
    trap 'kill 0' SIGINT SIGTERM EXIT
    just local-be &
    just local-fe &
    wait

# 전체 로컬 인프라 종료
dev-down:
    bash "{{ repo }}/scripts/local-deps-down.sh"

# DB 초기화 + 마이그레이션 + seed — 깨끗한 상태로 리셋 (Supabase CLI 필요)
dev-reset:
    #!/usr/bin/env bash
    set -euo pipefail
    if ! command -v supabase >/dev/null 2>&1; then
        echo "❌ supabase CLI not found. Install: brew install supabase/tap/supabase"
        exit 1
    fi
    echo "⚠️  Supabase 로컬 DB 를 리셋합니다 (볼륨 유지, schema 재적용)..."
    ( cd "{{ repo }}" && supabase db reset ) || true
    echo "⏳ Waiting 3s for postgres..."
    sleep 3
    # supabase db reset 은 컨테이너를 재시작하므로 decoded-backend 네트워크 재연결 필요
    bash "{{ repo }}/scripts/local-deps-connect.sh"
    just seed || echo "⚠️  seed 실패 (Auth 유저 FK 등) — Studio 에서 유저 생성 후 재시도"
    echo "✅ DB reset 완료. Start apps with: just dev"

# seed.sql 적용 — postgres 가 기동 중이어야 함 (Supabase CLI 기본 DB)
seed DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres":
    #!/usr/bin/env bash
    set -euo pipefail
    if ! command -v psql >/dev/null 2>&1; then
        echo "❌ psql not found. Install with: brew install libpq && brew link --force libpq"
        exit 1
    fi
    psql "{{ DATABASE_URL }}" -f "{{ repo }}/scripts/seed.sql"
    echo "✅ Seed applied to {{ DATABASE_URL }}"

# Git pre-push — 모노레포 로컬 CI (프론트 슬롯 + ai-server + api-server)
hook:
    #!/usr/bin/env bash
    set -euo pipefail
    chmod +x "{{ repo }}/scripts/git-pre-push.sh" "{{ repo }}/.githooks/pre-push" "{{ repo }}/packages/ai-server/scripts/pre-push.sh" "{{ repo }}/packages/web/scripts/pre-push.sh"
    git -C "{{ repo }}" config core.hooksPath .githooks
    echo "OK: git config core.hooksPath=.githooks (repo: {{ repo }})"

# 온보딩용 안내
local-help:
    @echo "0) 사전 준비: brew install supabase/tap/supabase  (Supabase CLI)"
    @echo ""
    @echo "🚀 원커맨드:  just dev"
    @echo "   → deps + env 자동 셋업 + api-server + ai-server + web 전부 기동"
    @echo "   → Ctrl+C 로 전체 종료 (인프라는 백그라운드 유지)"
    @echo ""
    @echo "최초 1회: just dev-reset  (로컬 DB 스키마 초기화 + seed)"
    @echo ""
    @echo "Endpoints"
    @echo "  Web:      http://localhost:3000"
    @echo "  API:      http://localhost:8000"
    @echo "  Studio:   http://localhost:54323"
    @echo "  Inbucket: http://localhost:54324  (로컬 이메일)"
    @echo ""
    @echo "Logs (다른 터미널에서)"
    @echo "  tail -f .logs/local/api.log"
    @echo "  tail -f .logs/local/ai.log"
    @echo ""
    @echo "세부 타스크: just --list  |  push 전 CI: just hook"

# Web 프론트엔드 로컬 CI (lint + format + tsc)
ci-web:
    bash "{{ repo }}/packages/web/scripts/pre-push.sh"

# E2E 테스트 실행
e2e:
    cd "{{ repo }}/packages/web" && bunx playwright test

# E2E 특정 테스트만 실행 (예: just e2e-only "content")
e2e-only PATTERN:
    cd "{{ repo }}/packages/web" && bunx playwright test --grep "{{ PATTERN }}"

# 워크트리 부트스트랩 — env 심볼릭 링크 + bun install + 포트 안내
# 예:   just worktree-setup .worktrees/149-search-fix
#       just worktree-setup .worktrees/148-editorial-og 3001
worktree-setup PATH PORT="":
    #!/usr/bin/env bash
    set -euo pipefail
    args=("{{ PATH }}")
    if [[ -n "{{ PORT }}" ]]; then args+=(--port "{{ PORT }}"); fi
    bash "{{ repo }}/scripts/worktree-bootstrap.sh" "${args[@]}"

# 현재 워크트리(cwd)에서 즉시 부트스트랩
worktree-setup-here PORT="":
    #!/usr/bin/env bash
    set -euo pipefail
    args=(--here)
    if [[ -n "{{ PORT }}" ]]; then args+=(--port "{{ PORT }}"); fi
    bash "{{ repo }}/scripts/worktree-bootstrap.sh" "${args[@]}"


