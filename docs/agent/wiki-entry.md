---
title: Wiki Entry — How Agents Use docs/wiki
owner: human
status: approved
updated: 2026-04-17
tags: [agent, harness]
related:
  - docs/agent/README.md
  - docs/wiki/schema/README.md
  - docs/wiki/wiki/INDEX.md
---

# Wiki Entry — How Agents Use docs/wiki

Claude / Cursor / 기타 에이전트가 `docs/wiki/`를 어떻게 사용하는지 진입 가이드.

## 구조

- `docs/wiki/schema/` — 규약 (SSOT). 먼저 읽는다.
- `docs/wiki/wiki/` — 누적 지식 노트. 주제별 디렉토리. INDEX.md가 목차.

## 에이전트 워크플로우

1. 세션 시작 시 `CLAUDE.md` → `docs/agent/README.md` → 이 파일 순으로 참조.
2. 주제별 knowledge는 `docs/wiki/wiki/INDEX.md`에서 진입.
3. 새 gotcha/운영 지식을 발견하면 `docs/wiki/wiki/<topic>/<note>.md`에 추가한다 (owner=llm).
4. 컨벤션 질문은 `docs/wiki/schema/conventions.md`만 참조한다 (다른 파일 중복 시 schema가 우선).

## 관련

- Ownership: [`docs/wiki/schema/ownership-matrix.md`](../wiki/schema/ownership-matrix.md)
- ADR: [`docs/adr/ADR-0002-llm-wiki-foundation.md`](../adr/ADR-0002-llm-wiki-foundation.md)
