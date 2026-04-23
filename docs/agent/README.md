---
title: Agent reference (`docs/agent/`)
owner: human
status: approved
updated: 2026-04-21
tags: [agent, harness]
---

# Agent reference (`docs/agent/`)

버전 관리되는 **에이전트·LLM용 참조** 모음입니다. 루트 [`CLAUDE.md`](../../CLAUDE.md)는 짧은 **맵**만 두고, 표·인벤토리·긴 트리는 이 폴더에 둡니다.

## When to read what

| Task                                           | Document                                                 |
| ---------------------------------------------- | -------------------------------------------------------- |
| **env matrix (dev/prod) + env 파일 매핑**      | [**environments.md**](environments.md)                   |
| **DB 마이그레이션 SOT / 워크플로우**           | [**../DATABASE-MIGRATIONS.md**](../DATABASE-MIGRATIONS.md) |
| staging 정의 (현재 없음)                       | [staging.md](staging.md)                                 |
| `docs/wiki/` 진입 가이드 (에이전트 워크플로우) | [wiki-entry.md](wiki-entry.md)                           |
| 아키텍처 summary (설계 의도 vs 스냅샷)         | [architecture-summary.md](architecture-summary.md)       |
| API summary (Next.js + Rust 레이어)            | [api-summary.md](api-summary.md)                         |
| DB summary (public / warehouse 이중 스키마)    | [database-summary.md](database-summary.md)               |
| 디자인 시스템 summary                          | [design-system-summary.md](design-system-summary.md)     |
| AI playbook summary (에이전트별 프로필)        | [ai-playbook-summary.md](ai-playbook-summary.md)         |
| 패키지 구조, 명령어, 로컬 deps / 포트          | [monorepo.md](monorepo.md)                               |
| 웹 라우트·기능 영역                            | [web-routes-and-features.md](web-routes-and-features.md) |
| Next.js `app/api/v1/*` 라우트 표               | [api-v1-routes.md](api-v1-routes.md)                     |
| 훅 목록, 스토어·주요 경로                      | [web-hooks-and-stores.md](web-hooks-and-stores.md)       |
| 디자인 시스템 import·컴포넌트 인벤토리         | [design-system-llm.md](design-system-llm.md)             |
| Warehouse 스키마 (ETL·Seed 파이프라인)         | [warehouse-schema.md](warehouse-schema.md)               |
| E2E 테스트 인프라·검증 항목                    | [e2e-testing.md](e2e-testing.md)                         |
| 아키텍처·컨벤션·스택 심층                      | [`.planning/codebase/`](../../.planning/codebase/)       |
| 디자인 토큰·UI 상세                            | [`docs/design-system/`](../design-system/)               |

## Rust API crate

`packages/api-server` 전용 가이드는 [`packages/api-server/AGENT.md`](../../packages/api-server/AGENT.md)를 사용합니다.
