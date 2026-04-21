# decoded-monorepo Development Guidelines

짧은 **맵**입니다. 라우트/API/훅/디자인 시스템 **표·인벤토리**는 [`docs/agent/`](docs/agent/)에 두었습니다. 해당 작업을 할 때는 항상 해당 파일을 연 뒤 진행합니다.

## Overview

Monorepo for the decoded platform — image/item discovery and curation with behavioral intelligence, editorial magazine system (news-referenced), virtual try-on (VTON), admin dashboard (seed pipeline, entity management, monitoring), SEO infrastructure, and design system (v2.0). AI-powered item detection (Ollama vision auto-tagging), social actions (like/save/comment/follow), personalization, rankings, collection/studio.

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

| 문서                                                                             | 용도                                   |
| -------------------------------------------------------------------------------- | -------------------------------------- |
| [`docs/agent/README.md`](docs/agent/README.md)                                   | 목차·언제 무엇을 읽을지                |
| [`docs/agent/environments.md`](docs/agent/environments.md)                       | **env matrix (dev=local / prod=Cloud Supabase)** |
| [`docs/DATABASE-MIGRATIONS.md`](docs/DATABASE-MIGRATIONS.md)                     | **DB 마이그레이션 SOT / 워크플로우**   |
| [`docs/agent/staging.md`](docs/agent/staging.md)                                 | staging 정의 (현재 없음)               |
| [`docs/agent/web-routes-and-features.md`](docs/agent/web-routes-and-features.md) | 웹 라우트·기능 영역                    |
| [`docs/agent/api-v1-routes.md`](docs/agent/api-v1-routes.md)                     | Next.js `/api/v1/*` 표                 |
| [`docs/agent/web-hooks-and-stores.md`](docs/agent/web-hooks-and-stores.md)       | 훅·스토어·주요 경로                    |
| [`docs/agent/design-system-llm.md`](docs/agent/design-system-llm.md)             | 디자인 시스템 import·컴포넌트 목록     |
| [`docs/agent/warehouse-schema.md`](docs/agent/warehouse-schema.md)               | Warehouse 스키마 (ETL·Seed 파이프라인) |
| [`packages/api-server/AGENT.md`](packages/api-server/AGENT.md)                   | Rust API 크레이트 전용                 |

## Conventions (SSOT)

상세 컨벤션은 [docs/wiki/schema/conventions.md](docs/wiki/schema/conventions.md)를 참조한다. 이 파일은 agent routing과 docs 맵만 담는다.

주요 규칙 요약:

- bun + Turborepo
- Conventional Commits
- Next.js 16은 `proxy.ts` 사용
- `packages/web/lib/api/generated/`는 자동 생성, 수동 편집 금지

## Git workflow

요약: `feature/*` → `dev` → `main` 플로우. `main` 직접 push 금지, `dev`→`main` PR 머지만 허용. 긴급 시 `hotfix/*`→`main` 예외. 상세는 **[docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md)**.

## Codebase documentation

| 문서                                                  | 내용                          |
| ----------------------------------------------------- | ----------------------------- |
| [STACK.md](.planning/codebase/STACK.md)               | 기술 스택, 의존성, 설정       |
| [ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | 아키텍처, 레이어, 데이터 흐름 |
| [STRUCTURE.md](.planning/codebase/STRUCTURE.md)       | 디렉토리 구조                 |
| [CONVENTIONS.md](.planning/codebase/CONVENTIONS.md)   | 코딩 컨벤션                   |
| [TESTING.md](.planning/codebase/TESTING.md)           | 테스트                        |
| [INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) | 외부 연동                     |
| [CONCERNS.md](.planning/codebase/CONCERNS.md)         | 기술 부채                     |

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

## Harness Workflow

| Tool        | Role                 | When                |
| ----------- | -------------------- | ------------------- |
| gstack      | 기획/리뷰/QA/배포    | Think → Plan → Ship |
| Superpowers | TDD, 코드 품질 강제  | Build (구현)        |
| OMC         | Claude + Gemini 듀얼 | 대규모 작업 보조    |
| GSD quick   | 원자적 단발 패치     | 유지보수            |

## Documentation

- [docs/README.md](docs/README.md) — 문서 인덱스
- [docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md) — 브랜치, 커밋, PR
- [docs/agent/](docs/agent/) — 에이전트용 참조 (표·인벤토리)
- [docs/design-system/](docs/design-system/) — 디자인 토큰
- [.planning/](.planning/) — GSD 아티팩트
- docs/adr/, docs/api/, docs/ai-playbook/

## gstack (Software Factory)

Use gstack slash commands for the sprint workflow: **Think → Plan → Build → Review → Test → Ship → Reflect**.

### Available Skills

| Phase   | Command                                      | Role                                      |
| ------- | -------------------------------------------- | ----------------------------------------- |
| Think   | `/office-hours`                              | YC Office Hours — reframe the product     |
| Plan    | `/plan-ceo-review`                           | CEO — rethink scope                       |
| Plan    | `/plan-eng-review`                           | Eng Manager — lock architecture           |
| Plan    | `/plan-design-review`                        | Designer — rate & improve design          |
| Plan    | `/design-consultation`                       | Design Partner — build design system      |
| Plan    | `/autoplan`                                  | Auto-review pipeline: CEO → design → eng  |
| Build   | `/browse`                                    | Browser automation (Playwright)           |
| Review  | `/review`                                    | Staff Engineer — find production bugs     |
| Review  | `/design-review`                             | Designer Who Codes — audit + fix          |
| Review  | `/cso`                                       | Security Officer — OWASP + STRIDE audit   |
| Test    | `/qa`                                        | QA Lead — real browser testing + auto-fix |
| Test    | `/qa-only`                                   | QA report only (no fixes)                 |
| Ship    | `/ship`                                      | Release Engineer — test, PR, ship         |
| Ship    | `/land-and-deploy`                           | Merge → deploy → canary verify            |
| Monitor | `/canary`                                    | Post-deploy monitoring                    |
| Monitor | `/benchmark`                                 | Performance regression detection          |
| Debug   | `/investigate`                               | Systematic root-cause debugging           |
| Reflect | `/retro`                                     | Sprint retrospective                      |
| Docs    | `/document-release`                          | Post-ship doc updates                     |
| Safety  | `/careful`, `/freeze`, `/guard`, `/unfreeze` | Destructive op protection                 |
| Setup   | `/setup-deploy`, `/setup-browser-cookies`    | One-time config                           |
| Utility | `/gstack-upgrade`                            | Update gstack                             |
| Utility | `/codex`                                     | Multi-AI second opinion                   |
| Utility | `/connect-chrome`                            | Connect Chrome for browsing               |

### Rules

- Use `/browse` for all web browsing — never use `mcp__claude-in-chrome__*` tools
- If gstack skills aren't working, run `cd ~/.claude/skills/gstack && ./setup`
- Follow the sprint order: Think → Plan → Build → Review → Test → Ship → Reflect

<!-- Last Updated: 2026-04-02 -->

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

<!-- MANUAL ADDITIONS START -->

- [Antigravity Rules](file:///Users/kiyeol/development/decoded/decoded-app/.antigravity/rules.md) - Autonomous execution policy and language preferences.
<!-- MANUAL ADDITIONS END -->
