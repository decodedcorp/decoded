---
title: "ADR-0002: LLM Wiki Foundation"
owner: human
status: approved
updated: 2026-04-17
tags: [architecture, harness, agent]
related:
  - docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md
  - docs/wiki/schema/README.md
---

# ADR-0002: LLM Wiki Foundation

- **Status:** Accepted (2026-04-17)
- **Supersedes:** —
- **Related:** Issue #153, PR #223, Spec `docs/superpowers/specs/2026-04-17-llm-wiki-foundation-design.md`

## Context

decoded-monorepo는 현재 4개 이상의 문서 소스가 공존한다: 루트 `CLAUDE.md`, `.cursor/rules/*.mdc`, `docs/agent/`, `docs/ai-playbook/`, `.planning/codebase/`. 각각 부분적으로 중복된 컨벤션·아키텍처·에이전트 규칙을 담고 있으며 정본(SSOT) 규칙이 없다. 이슈 #153은 이 상태를 정비하면서 Karpathy LLM wiki 컨셉(LLM이 markdown 위키를 자동 ingest/lint/update하는 구조)에서 영감을 얻어 에이전트 하네스 프로그래밍을 업그레이드한다.

## Decision

`docs/` 하위에 LLM wiki 2계층 구조(`docs/wiki/wiki/` + `docs/wiki/schema/`)를 도입한다. Karpathy의 3계층(source/wiki/schema) 중 `source`는 "source = code"인 이 repo 특성상 생략한다. 기존 `docs/agent/`는 topic summary 허브로 확장하고, 기존 topic 폴더(`docs/architecture/` 등)에 distributed `agent.md`를 두지 않는다. 컨벤션·하네스 규칙은 `docs/wiki/schema/`로 정본화하고 `CLAUDE.md`·`.cursor/rules/`는 pointer로 축소한다.

## Alternatives Considered

1. **Do nothing** — 현 상태 유지. 드리프트 지속.
2. **Flatten everything into `docs/agent/`** — Karpathy 컨셉 포기, 성장 경로 상실.
3. **Full Karpathy 3계층(source/wiki/schema)** — `source` 계층 억지 적용.
4. **Consolidation only** (schema 도입 없이 중복만 줄임) — SSOT 구조화 기회 상실.

## Rationale

에이전트 작업 지식의 누적을 허용(hybrid D 기반)하면서, OMC critic·architect 리뷰가 지적한 3가지 위험(distributed `agent.md`, `source` 계층 억지, 자동화 지연)을 동시 회피한다.

## Consequences

### Positive

- 컨벤션 조회 시 정본 1곳으로 수렴 (현재 4+).
- LLM·Cursor·Claude가 공통 규약 파일을 참조.
- 에이전트 지식 누적을 받아내는 전용 공간(`wiki/wiki/`) 확보.

### Negative

- 새 디렉토리 도입으로 초기 learning curve.
- Phase 1 산출물이 Sub-3 자동화 없이 수동 유지. Sub-3 지연 시 drift 위험.
- 기존 파일 프론트매터 추가·pointer 축소 migration 비용.

## Reversibility

Phase 1 후 2~3개월 내 이 구조가 overhead로 드러나면:

1. 이 ADR을 `Superseded`로 변경하고 사유 기록.
2. `docs/wiki/schema/**` 삭제 또는 `/archive/` 이동.
3. PR-C에서 축소한 `CLAUDE.md`·`.cursor/rules/` 컨벤션 섹션을 `git revert`로 복원.
4. `docs/agent/*-summary.md` 파일은 유지 여부를 파일별로 재평가.
5. `.planning/codebase/`와 기존 `docs/agent/` 인벤토리는 변경 없이 잔존.

## Implementation

- Plan: `docs/superpowers/plans/2026-04-17-llm-wiki-foundation.md`
- Follow-ups: Sub-3 (자동화), Sub-4 (CLAUDE.md·.cursor/rules 전면 리팩토링)
