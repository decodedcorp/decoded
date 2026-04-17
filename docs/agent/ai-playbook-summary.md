---
title: AI Playbook — Agent Summary
owner: llm
status: draft
updated: 2026-04-17
tags: [agent, harness, claude-code, cursor]
related:
  - docs/ai-playbook/01-principles.md
  - docs/ai-playbook/02-workflow-overview.md
  - docs/ai-playbook/claude-profile.md
  - docs/ai-playbook/cursor-profile.md
---

# AI Playbook — Agent Summary

## Purpose

에이전트별(Claude / Cursor / Gemini / Codex) 사용 프로필 요약. 세션 시작 시 "어느 프로필을 읽어야 하는가"를 안내.

## Canonical sources

- 원칙: [`docs/ai-playbook/01-principles.md`](../ai-playbook/01-principles.md)
- 워크플로우: [`docs/ai-playbook/02-workflow-overview.md`](../ai-playbook/02-workflow-overview.md)
- Claude: [`docs/ai-playbook/claude-profile.md`](../ai-playbook/claude-profile.md)
- Cursor: [`docs/ai-playbook/cursor-profile.md`](../ai-playbook/cursor-profile.md)
- Gemini: [`docs/ai-playbook/gemini-profile.md`](../ai-playbook/gemini-profile.md)
- Codex: [`docs/ai-playbook/codex-profile.md`](../ai-playbook/codex-profile.md)

## Key files / concepts

- `CLAUDE.md` 루트 — Claude Code 진입점
- `.cursor/rules/*.mdc` — Cursor 규칙 (네이티브 포맷)
- `usage-log.md` — 세션 기록 (업데이트 시점에 따라 stale 가능)

## Gotchas

- Codex 프로필은 stale 가능성 있음 (구독 상태: "No Codex (미구독)"). Sub-4에서 deprecation 검토.
- Claude / Cursor는 같은 repo에서 공존. 충돌 영역은 `docs/wiki/schema/conventions.md`에서 관리.

## Recent changes

- 2026-04-17: 초기 작성 (Phase 1)
