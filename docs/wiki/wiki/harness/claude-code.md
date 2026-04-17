---
title: Claude Code — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-17
tags: [harness, agent, claude-code, gstack, superpowers, omc]
related:
  - CLAUDE.md
  - docs/wiki/schema/harness.md
  - docs/agent/ai-playbook-summary.md
source:
  - https://docs.claude.com/en/docs/claude-code
---

# Claude Code — Harness Knowledge

Claude Code에서 이 repo를 다룰 때 매 세션마다 재발견되는 규칙·gotcha를 누적 기록한다.

## Worktrees for parallel work

- `.worktrees/<issue-slug>` 규칙 (gitignored, 커밋 `5a37afb7` 이후)
- `git worktree add -b <type>/<N>-<slug> .worktrees/<slug> origin/dev`
- 세션 간 충돌 없이 병렬 처리 가능. 각 워크트리에 독립 상태.

## Draft PR convention

- `scripts/start-issue.sh <N> [type]` 이 브랜치 + 빈 커밋 + Draft PR까지 생성
- 프로젝트 보드(#3)가 PR 링크를 감지해 자동 In Progress 전환
- 워크트리는 이 스크립트가 만들지 않으므로 수동 `git worktree add` 필요

## Auto Mode interaction

- Auto mode는 destructive 작업(push, DB 변경, 대량 삭제) 승인만 요구
- push 권한은 세션별 1회 확인이 발생할 수 있으므로 batch 작업 시 유의

## Gotchas

- `cd` 후 다음 Bash 호출은 cwd가 초기화된다 — 항상 절대경로 사용
- `EnterWorktree`로 세션 이동 후에도 원 브랜치의 dirty 파일은 그대로 남는다
- `.cursor/rules/*.mdc`와 `CLAUDE.md`에 컨벤션 중복이 있다 — SSOT는 `docs/wiki/schema/conventions.md`

## Recent changes

- 2026-04-17: 초기 작성 (POC, Phase 1)
