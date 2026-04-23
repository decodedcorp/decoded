---
title: Design System — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [design-system, ui, agent]
related:
  - docs/design-system/README.md
  - docs/agent/design-system-llm.md
---

# Design System — Agent Summary

## Purpose

decoded DS v2.0 진입점. 컴포넌트·토큰·사용 규칙을 에이전트가 빠르게 파악하도록 안내.

## Canonical sources

- 토큰/컴포넌트 목록: [`docs/design-system/`](../design-system/)
- LLM용 상세 인벤토리: [`docs/agent/design-system-llm.md`](design-system-llm.md)

## Key files / concepts

- `packages/web/app/globals.css` — Tailwind + DS 토큰
- `packages/web/lib/design-system/` — DS 컴포넌트
- Pencil Screen 컨벤션: `docs/pencil-screen/` (레이아웃 레퍼런스)

## Gotchas

- DS 컴포넌트 import는 절대 경로 (`@/lib/design-system/...`).
- `docs/agent/design-system-llm.md`가 **컴포넌트 import 경로의 정본**이다. 코드에서 추정하지 말고 이 파일을 확인.
- Tailwind 3.4 기준. v4 계열 문법 사용 금지.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
