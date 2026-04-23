---
title: Wiki Schema — SSOT for Docs Conventions
owner: human
status: approved
updated: 2026-04-17
tags: [harness, agent]
related:
  - docs/wiki/schema/frontmatter.md
  - docs/wiki/schema/tags.md
  - docs/wiki/schema/links.md
  - docs/wiki/schema/ownership-matrix.md
  - docs/wiki/schema/conventions.md
---

# Wiki Schema — SSOT for Docs Conventions

decoded-monorepo의 문서 규약 SSOT (Single Source of Truth).

## Files

| 파일                                           | 역할                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| [`frontmatter.md`](./frontmatter.md)           | agent-consumable 파일 프론트매터 필수/선택 필드          |
| [`tags.md`](./tags.md)                         | 고정 태그 어휘 (임의 태그 금지)                          |
| [`links.md`](./links.md)                       | 내부 링크 규약 (repo 상대 경로, Obsidian `[[]]` 금지)    |
| [`ownership-matrix.md`](./ownership-matrix.md) | 정보 카테고리별 정본(SSOT) 매트릭스                      |
| [`conventions.md`](./conventions.md)           | 공통 코딩·빌드 컨벤션 (CLAUDE.md · .cursor/rules 수렴처) |
| [`harness.md`](./harness.md)                   | 하네스 경계 (gstack · Superpowers · OMC · GSD)           |

## 사용 원칙

1. 규약은 여기서만 **정의**한다. 다른 파일은 이 schema를 **참조**한다.
2. 규약 개정은 schema 파일 PR로 진행한다.
3. Sub-3 linter가 도입되면 이 파일들이 검증 기준이 된다.

## 관련

- 전체 Phase 1 설계: [`docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`](../../superpowers/specs/2026-04-17-llm-wiki-foundation-design.md)
- 결정 기록: [`docs/adr/ADR-0002-llm-wiki-foundation.md`](../../adr/ADR-0002-llm-wiki-foundation.md)
