# decoded-monorepo Development Guidelines

짧은 **맵**입니다. 라우트/API/훅/디자인 시스템 **표·인벤토리**는 [`docs/agent/`](docs/agent/)에 두었습니다. 해당 작업을 할 때는 항상 해당 파일을 연 뒤 진행합니다.

## Overview

Monorepo for the decoded platform — image/item discovery and curation with behavioral intelligence, editorial magazine system, virtual try-on (VTON), admin dashboard, and design system (v2.0). AI-powered item detection, social actions, personalization, collection/studio.

## Monorepo (summary)

- **Root**: bun workspaces + Turborepo (`package.json`, `turbo.json`, `bunfig.toml`)
- **`packages/web`**: Next.js 16 app (main frontend)
- **`packages/shared`**: Shared types, hooks, Supabase queries
- **`packages/mobile`**: Expo app
- **`packages/api-server`**: Rust/Axum (Cargo; not a bun workspace member)
- **`packages/ai-server`**: Python AI / gRPC (`uv`)

**상세 트리·명령어·로컬 deps·포트**: [`docs/agent/monorepo.md`](docs/agent/monorepo.md)  
**기술 스택·버전**: [`.planning/codebase/STACK.md`](.planning/codebase/STACK.md)

## Agent reference (`docs/agent/`)

| 문서 | 용도 |
|------|------|
| [`docs/agent/README.md`](docs/agent/README.md) | 목차·언제 무엇을 읽을지 |
| [`docs/agent/web-routes-and-features.md`](docs/agent/web-routes-and-features.md) | 웹 라우트·기능 영역 |
| [`docs/agent/api-v1-routes.md`](docs/agent/api-v1-routes.md) | Next.js `/api/v1/*` 표 |
| [`docs/agent/web-hooks-and-stores.md`](docs/agent/web-hooks-and-stores.md) | 훅·스토어·주요 경로 |
| [`docs/agent/design-system-llm.md`](docs/agent/design-system-llm.md) | 디자인 시스템 import·컴포넌트 목록 |
| [`packages/api-server/AGENT.md`](packages/api-server/AGENT.md) | Rust API 크레이트 전용 |

## Tech stack (one line)

Next.js 16 / React 19 / TypeScript · Tailwind · Zustand · TanStack Query · Supabase · GSAP/Motion · Playwright · ESLint flat · bun · Node 22+ · Rust API (Axum) · Python AI (gRPC). 세부는 STACK.md.

## Code style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

## Important notes

- **Package manager**: **bun** with Turborepo — use `bun` commands (not yarn/npm)
- **ESLint**: flat config (`eslint.config.mjs`), Node 22+
- **Env**: `packages/web/.env.local` from `.env.local.example` (gitignored)
- **Supabase** required for typical data/auth flows
- **Next.js 16**: `proxy.ts` (not `middleware.ts`); see [`.cursor/rules/monorepo.mdc`](.cursor/rules/monorepo.mdc) for repo-wide conventions

## Generated API Code

> `packages/web/lib/api/generated/` is auto-generated. **NEVER manually edit** these files.

| Rule | Detail |
|------|--------|
| Source of truth | `packages/api-server/openapi.json` (Rust backend utoipa) |
| Generator | Orval 8.5.3 -- config: `packages/web/orval.config.ts` |
| Regenerate | `cd packages/web && bun run generate:api` |
| Git status | Gitignored (only `.gitkeep` tracked) -- always regenerated locally |
| Extend behavior | Edit `lib/api/mutator/custom-instance.ts` or `orval.config.ts` -- not generated files |
| Zod schemas | `lib/api/generated/zod/decodedApi.zod.ts` -- single file, all endpoint schemas |
| Upload endpoints | Excluded from generation (4 multipart POST endpoints) -- see `orval.config.ts` transformer |

When adding a new API endpoint:
1. Update the backend OpenAPI spec (`packages/api-server/`)
2. Copy the updated `openapi.json` to `packages/api-server/openapi.json`
3. Run `cd packages/web && bun run generate:api`
4. Import the generated hook from `@/lib/api/generated/{tag}/{operationId}`

## Git workflow

요약: `main` 직접 push 금지, PR로만 머지. 브랜치 접두사·커밋·리뷰 절차는 **[docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md)**.

## Codebase documentation

| 문서 | 내용 |
|------|------|
| [STACK.md](.planning/codebase/STACK.md) | 기술 스택, 의존성, 설정 |
| [ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | 아키텍처, 레이어, 데이터 흐름 |
| [STRUCTURE.md](.planning/codebase/STRUCTURE.md) | 디렉토리 구조 |
| [CONVENTIONS.md](.planning/codebase/CONVENTIONS.md) | 코딩 컨벤션 |
| [TESTING.md](.planning/codebase/TESTING.md) | 테스트 |
| [INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) | 외부 연동 |
| [CONCERNS.md](.planning/codebase/CONCERNS.md) | 기술 부채 |

## GSD Workflow

```bash
/gsd:progress          # 전체 진행 상황
/gsd:discuss-phase N   # 페이즈 N 논의
/gsd:plan-phase N      # 페이즈 N 계획
/gsd:execute-phase N   # 페이즈 N 실행
/gsd:verify-work       # 작업 검증
/gsd:help              # 명령어 목록
/gsd:quick             # 빠른 작업
```

## SpecKit Integration

- Specs: `specs/` (feature별)
- Commands: `/speckit.*` (Claude Code)

## Documentation

- [docs/README.md](docs/README.md) — 문서 인덱스
- [docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md) — 브랜치, 커밋, PR
- [docs/agent/](docs/agent/) — 에이전트용 참조 (표·인벤토리)
- [docs/design-system/](docs/design-system/) — 디자인 토큰
- [.planning/](.planning/) — GSD 아티팩트
- docs/adr/, docs/api/, docs/ai-playbook/

<!-- Last Updated: 2026-03-23 -->

<!-- MANUAL ADDITIONS START -->

- [Antigravity Rules](file:///Users/kiyeol/development/decoded/decoded-app/.antigravity/rules.md) - Autonomous execution policy and language preferences.
<!-- MANUAL ADDITIONS END -->
