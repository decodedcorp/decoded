# decoded-app AI 에이전트 맵

> **Purpose**: AI 에이전트가 이 모노레포에서 작업할 때의 **한국어 진입점**입니다. 장문·표는 [`docs/agent/`](docs/agent/)와 [`.planning/codebase/`](.planning/codebase/)에 두었습니다.

## 필수 진입 문서

| 문서 | 역할 |
|------|------|
| **[CLAUDE.md](CLAUDE.md)** | 영문 **맵** (항상 읽기 쉬운 요약, 규칙, `docs/agent` 인덱스) |
| **[docs/agent/README.md](docs/agent/README.md)** | 표·인벤토리 목차 (라우트, API, 훅, 디자인 시스템) |
| **[.planning/codebase/](.planning/codebase/)** | 아키텍처, 스택, 컨벤션, 테스트, 연동 |

## 작업 유형별로 열 파일

| 작업 | 문서 |
|------|------|
| 명령어·패키지 구조·로컬 deps | [docs/agent/monorepo.md](docs/agent/monorepo.md) |
| 웹 라우트·기능 영역 | [docs/agent/web-routes-and-features.md](docs/agent/web-routes-and-features.md) |
| Next.js `app/api/v1` | [docs/agent/api-v1-routes.md](docs/agent/api-v1-routes.md) |
| 훅·스토어·주요 경로 | [docs/agent/web-hooks-and-stores.md](docs/agent/web-hooks-and-stores.md) |
| 디자인 시스템 import·컴포넌트 목록 | [docs/agent/design-system-llm.md](docs/agent/design-system-llm.md) |
| Warehouse 스키마 (ETL·Seed) | [docs/agent/warehouse-schema.md](docs/agent/warehouse-schema.md) |
| Rust API 서버 (`api-server`) | [packages/api-server/AGENT.md](packages/api-server/AGENT.md) |
| DB 마이그레이션 역할(SeaORM vs `supabase/migrations`) | [packages/api-server/AGENT.md — §2.4](packages/api-server/AGENT.md) |

## 반드시 지킬 것

1. **패키지 매니저**: **bun** (`bun run`, `bun add`). yarn/npm 아님.
2. **상세 표의 SSOT**: `docs/agent/` — CLAUDE.md에는 링크만 있음.
3. **디자인 시스템**: 새 UI는 [docs/design-system/](docs/design-system/) 및 `docs/agent/design-system-llm.md` 확인.
4. **Supabase 쿼리**: 웹은 `packages/web/lib/supabase/queries/` 패턴 유지.

## 기타

- 디자인 시스템 토큰·UI 가이드: [docs/design-system/README.md](docs/design-system/README.md)
- 문서 인덱스: [docs/README.md](docs/README.md)

**마지막 업데이트**: 2026-04-21
