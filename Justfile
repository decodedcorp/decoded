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

# Docker deps only — Supabase CLI + meili/redis/searxng (no app containers)
local-deps:
    bash "{{ repo }}/scripts/local-deps-up.sh"

local-deps-down:
    bash "{{ repo }}/scripts/local-deps-down.sh"

# 풀 로컬 개발 스택 — deps (컨테이너) + BE + FE 한 번에. Ctrl+C 로 BE/FE 동시 종료.
# 인프라(deps) 는 백그라운드에 그대로 남음 — 종료하려면 `just dev-down`
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    just local-deps
    echo ""
    echo "⏳ Waiting 3s for supabase stack / redis / meili to be ready..."
    sleep 3
    echo ""
    echo "🚀 Starting BE + FE. Ctrl+C to stop both."
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
    @echo "   Env: .env.dev + .dev.env (see .env.dev.example / .dev.env.example in each package)"
    @echo "   supabase status 로 anon / service_role / JWT secret 복사 → .env 에 붙여넣기"
    @echo "1) 의존 서비스: just local-deps  (Supabase CLI + meili + redis + searxng)"
    @echo "2) DB 스키마 초기화: just dev-reset  (최초 1회, supabase db reset + seed)"
    @echo "3) 터미널 A: just local-be  (API+AI 동시 기동, 로그는 파일로만)"
    @echo "   터미널 B: tail -f .logs/local/api.log"
    @echo "   터미널 C: tail -f .logs/local/ai.log"
    @echo "4) 터미널 D: just local-fe"
    @echo "   local-be 종료: 터미널 A에서 Ctrl+C"
    @echo "전체 한 터미널: bun run dev  (turbo, 로그 한 스트림)"
    @echo "Studio UI: http://localhost:54323  |  이메일 테스트: http://localhost:54324"
    @echo "push 전 로컬 CI: just hook  후 bun run ci:local  (또는 git push 가 훅 실행)"

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


