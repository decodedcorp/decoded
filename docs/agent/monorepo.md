---
title: Monorepo — Agent Reference
owner: human
status: approved
updated: 2026-04-17
tags: [agent, architecture]
---

# Monorepo — Agent Reference

Paths are relative to the repository root unless noted.

## Layout

```text
decoded-monorepo/
├── package.json          # Root — bun workspaces, Turborepo
├── turbo.json            # Build orchestration (build/dev/lint/test)
├── bunfig.toml           # Bun config (hoisted strategy)
├── packages/
│   ├── web/              # Next.js 16 frontend (main app)
│   ├── shared/           # Shared types, hooks, Supabase queries
│   ├── mobile/           # Expo 54 React Native app
│   ├── api-server/       # Rust/Axum API (Cargo workspace; not a bun workspace member)
│   └── ai-server/        # Python AI / gRPC (uv; former decoded-ai repo)
├── .planning/            # GSD workflow artifacts
├── docs/agent/           # Agent reference (this folder)
└── CLAUDE.md             # Short map → links here
```

- **Package manager**: bun 1.3.10+ (not yarn/npm)
- **Orchestration**: Turborepo
- **API server (Rust)**: `packages/api-server` — `cargo` (not bun workspaces)
- **AI server (Python)**: `packages/ai-server` — `uv`; thin `package.json` scripts for Turborepo only

## Tech stack (summary)

상세·버전 고정은 [`.planning/codebase/STACK.md`](../../.planning/codebase/STACK.md)를 SSOT로 둡니다.

- **Frontend**: Next.js 16.x, React 19.x, TypeScript 5.9.x
- **Styling**: Tailwind CSS, tailwind-merge, @tailwindcss/typography
- **State**: Zustand, TanStack React Query
- **Backend (app)**: Supabase (PostgreSQL, Auth, Storage)
- **Rust API**: Axum, SeaORM, tokio
- **AI**: Python, gRPC to `ai-server`
- **Node**: 22 LTS 권장
- **Lint/format**: ESLint 10 flat config, Prettier

## `packages/web` structure

```text
packages/web/
├── app/                    # Next.js App Router pages
│   ├── @modal/             # Parallel route for modals
│   ├── api/v1/             # API routes (posts, solutions, users, categories, spots, events, admin, vton, badges, rankings)
│   ├── admin/              # Admin dashboard (ai-cost, ai-audit, pipeline-logs, server-logs)
│   ├── debug/              # Debug tools (supabase)
│   ├── editorial/          # Daily editorial page
│   ├── explore/            # Explore grid view
│   ├── feed/               # Social feed
│   ├── images/             # Image discovery & detail
│   ├── login/              # OAuth authentication
│   ├── magazine/           # Personal magazine (editorial issue viewer)
│   ├── posts/              # Post detail
│   ├── profile/            # User profile with activity, badges, tries, collections
│   ├── request/            # Upload & AI detection flow
│   ├── search/             # Full-screen search overlay
│   └── lab/                # Experimental features
├── lib/
│   ├── api/                # API client functions
│   ├── components/         # Feature-based components
│   ├── design-system/      # v2.0 Design System
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── supabase/           # Supabase client + queries
│   └── utils/              # Utility functions
└── __tests__/              # Test files

packages/shared/
├── supabase/
│   ├── client.ts
│   ├── types.ts
│   └── queries/

specs/                      # Feature specifications
docs/                       # Documentation
.planning/                  # GSD workflow artifacts
```

더 넓은 트리는 [`.planning/codebase/STRUCTURE.md`](../../.planning/codebase/STRUCTURE.md)를 참고합니다.

## Commands

```bash
# Monorepo (from root)
bun run dev             # Development server (JS packages via Turborepo)
bun run dev:api-server  # Rust API (cargo watch)
bun run dev:ai-server   # Python AI server (uv)
bun run build           # Production build (via Turborepo)
bun run lint            # ESLint (and package scripts where configured)
bun run ci:local        # 로컬 CI (pre-push 와 동일: web + api-server; ai-server 는 RUN_AI_SERVER_CI=1 일 때만)
# 훅: 저장소 루트에서 `just hook` → core.hooksPath=.githooks

# Split local dev: Supabase CLI + Meilisearch·Redis·SearXNG = Docker first, then:
bun run dev:local-deps       # Supabase CLI + Docker deps (see scripts/local-deps-up.sh)
bun run dev:local-fe         # Next only (same as dev:web)
bun run dev:local-be         # API + AI together; logs -> .logs/local/api.log & ai.log (tail -f in other terminals)
# Prereq: brew install supabase/tap/supabase  (#282: dev 는 Supabase self-hosted)
# Local host env templates: packages/api-server/.env.dev.example , packages/ai-server/.dev.env.example
# Port alignment (호스트 실행):
#   DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres  (Supabase CLI Postgres)
#   DATABASE_API_URL=http://127.0.0.1:54321                                (로컬 GoTrue)
#   Studio UI: http://localhost:54323  |  Inbucket (email): http://localhost:54324
#   MEILISEARCH_URL=http://localhost:7700 ; AI_SERVER_GRPC_URL=http://localhost:50052 (AI APP_ENV=dev)
#   API API_SERVER_GRPC_PORT must equal AI API_SERVER_GRPC_PORT ; 레거시 GRPC_PORT / GRPC_BACKEND_* 도 아직 지원.
#   AI Redis localhost:6303 + SEARXNG localhost:4000 with local-deps
# `supabase status` 로 anon / service_role / JWT secret 조회 (최초 setup 시 .env 에 붙여넣기)
# just local-help            # prints tail -f hints (root Justfile)

# Web package only
cd packages/web
bun run dev           # Next.js dev server
bun run build         # Next.js production build
bun run lint          # ESLint
bun run format        # Prettier formatting
bun run typecheck     # TypeScript (tsc --noEmit)

# Frontend CI만 실행
just ci-web                         # lint + format + tsc
SKIP_FE_CI=1 git push               # 긴급 시 web CI 건너뛰기

# API server (Rust)
cd packages/api-server
cargo build           # Build API server
cargo run             # Run API server
cargo test            # Run tests

# AI server (Python)
cd packages/ai-server
uv sync
uv run python -m src.main
# or: bun run dev:ai-server  # from monorepo root
```

## Environment

- Web: copy `packages/web/.env.local.example` → `.env.local` (gitignored).
- Never commit secrets or full `.env` files.
- Supabase CLI required for local dev (#282): `brew install supabase/tap/supabase`. Postgres/Auth 모두 로컬에서 동작.
