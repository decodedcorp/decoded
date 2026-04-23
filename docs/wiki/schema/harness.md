---
title: Harness Boundaries
owner: human
status: draft
updated: 2026-04-23
tags: [harness, agent, gstack, superpowers, omc, gsd]
related:
  - CLAUDE.md
  - docs/wiki/schema/conventions.md
  - .claude/commands/ingest.md
  - .claude/commands/wiki.md
---

# Harness Boundaries

decoded-monorepo에서 사용하는 에이전트 하네스 도구의 역할과 경계.

> **Status:** Phase 1 초기 골격. Sub-4(하네스 전면 리팩토링)에서 상세화.

## 도구별 역할

| 도구        | 용도                                         | 사용 시점        |
| ----------- | -------------------------------------------- | ---------------- |
| gstack      | 스프린트 워크플로우 (Think → Ship → Reflect) | 기획·배포 전반   |
| Superpowers | TDD, 코드 품질 게이트                        | 구현 단계        |
| OMC         | Claude + Gemini 듀얼 멀티프로바이더          | 대규모 병렬 작업 |
| GSD (quick) | 원자적 단발 패치                             | 유지보수         |

## 중복 회피

각 도구는 같은 작업 영역을 중복해서 수행하지 않는다. 같은 의도를 다른 도구로 수행할 때의 기본값은 Sub-4에서 정의한다.

## 세션 규율

- 복잡한 작업은 워크트리 분리 (`.worktrees/<slug>` 패턴)
- 이슈 시작은 `scripts/start-issue.sh <N> [type]` 통한 Draft PR 자동화
- main/master 직접 push 금지

## Custom slash commands (`.claude/commands/`)

Sub-4 에서 Claude Code 프로젝트 스코프 커스텀 커맨드를 정의. Sub-3 CLI(`tools/wiki/`) 를 래핑해 세션 knowledge 를 `docs/wiki/wiki/**` 로 축적한다.

| 커맨드 | 역할 | 래핑 대상 |
| --- | --- | --- |
| `/ingest <topic> <title>` | 새 노트 skeleton 생성 + 본문 LLM 채움 | `bun run wiki:ingest` |
| `/wiki [lint\|links\|list\|search]` | 조회·검증·검색 (읽기 전용) | `bun run wiki:lint` / `wiki:links` |

- 정의 위치: [.claude/commands/ingest.md](../../../.claude/commands/ingest.md) · [.claude/commands/wiki.md](../../../.claude/commands/wiki.md)
- CI / pre-push 통합: `scripts/git-pre-push.sh`, `.github/workflows/wiki-lint.yml` (Sub-3 소관)
