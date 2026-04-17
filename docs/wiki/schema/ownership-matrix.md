---
title: Ownership Matrix
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
  - docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md
---

# Ownership Matrix

정보 카테고리별 정본(Canonical) 파일과 pointer 파일의 매핑. 각 카테고리는 정본 1곳만 가진다.

## 매트릭스

| 정보 카테고리                                 | 정본 (C)                                                    | Pointer (P)                                                                  |
| --------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Stack / 버전                                  | `.planning/codebase/STACK.md`                               | `CLAUDE.md`, `docs/wiki/schema/conventions.md`, `.cursor/rules/monorepo.mdc` |
| 코딩 컨벤션 (공용)                            | `docs/wiki/schema/conventions.md`                           | `CLAUDE.md`, `.cursor/rules/monorepo.mdc`                                    |
| 빌드·명령                                     | `Justfile` + `package.json:scripts`                         | `CLAUDE.md`, `docs/wiki/schema/conventions.md`                               |
| 디렉토리 구조                                 | `.planning/codebase/STRUCTURE.md`                           | `docs/agent/monorepo.md`                                                     |
| 아키텍처 상세 (설계 의도)                     | `docs/architecture/README.md`                               | `docs/agent/architecture-summary.md`                                         |
| 아키텍처 스냅샷 (자동 분석)                   | `.planning/codebase/ARCHITECTURE.md`                        | `docs/agent/architecture-summary.md`                                         |
| API 라우트                                    | `docs/agent/api-v1-routes.md`                               | `docs/agent/api-summary.md`                                                  |
| DB 사용법                                     | `docs/database/01-schema-usage.md` 등                       | `docs/agent/database-summary.md`                                             |
| Warehouse 스키마                              | `docs/agent/warehouse-schema.md`                            | `docs/agent/database-summary.md`                                             |
| 디자인 시스템                                 | `docs/design-system/**` + `docs/agent/design-system-llm.md` | `docs/agent/design-system-summary.md`                                        |
| 에이전트 운영·Gotchas                         | `docs/wiki/wiki/**`                                         | `docs/agent/README.md`                                                       |
| 에이전트별 프로필                             | `docs/ai-playbook/*.md`                                     | `docs/agent/ai-playbook-summary.md`                                          |
| 하네스 규칙 (gstack·Superpowers·OMC·GSD 경계) | `docs/wiki/schema/harness.md`                               | `CLAUDE.md`, `.cursor/rules`                                                 |
| Git workflow                                  | `docs/GIT-WORKFLOW.md`                                      | `CLAUDE.md`                                                                  |
| React/API/Rust 코드 패턴                      | `.cursor/rules/{react-components,api-routes,rust-api}.mdc`  | `docs/wiki/schema/conventions.md` (요약 링크)                                |

## 원칙

1. 각 카테고리는 **정본 1개**만 가진다.
2. Pointer 파일은 2~5줄 요약 + "Canonical: <경로>" 라인만 가진다.
3. `docs/agent/` 내 기존 substantive 파일(`warehouse-schema.md`, `api-v1-routes.md`, `web-hooks-and-stores.md`)은 정본으로 승격된다.
4. Sub-3 linter가 카테고리별 정본 참조 일관성을 검증한다.
