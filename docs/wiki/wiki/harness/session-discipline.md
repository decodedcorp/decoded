---
title: Session Discipline — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-23
tags: [harness, agent, session, worktree]
related:
  - CLAUDE.md
  - docs/wiki/wiki/harness/claude-code.md
  - docs/wiki/schema/conventions.md
  - docs/GIT-WORKFLOW.md
---

# Session Discipline

한 repo를 여러 에이전트 세션이 동시에 다룬다는 가정에서 세션을 충돌 없이 운영하기 위한 규율 모음.

## Worktree per issue

- 작업 브랜치는 **반드시** 별도 worktree에서 다룬다: `.worktrees/<issue-or-slug>`
- 생성: `git worktree add -b <type>/<N>-<slug> .worktrees/<slug> origin/dev`
- 종료: `git worktree remove .worktrees/<slug>` (PR 머지 후)
- 루트 체크아웃은 오래 돌아가는 관찰 세션 전용. 실제 편집은 worktree에서.

## State / artifact 격리

- `.omc/`, `.claude/state`, `.planning/` 하위 세션 아티팩트(jsonl, state json 등)는 **현재 세션 산출물**. 다른 worktree로 끌고 오지 않는다.
- 루트에 남은 dirty `.omc/**` 변경은 worktree PR에 포함시키지 않는다 — worktree는 `origin/dev`에서 잘라낸 깨끗한 상태로 출발.
- `.omc/project-memory.json`, `.omc/notepad.md`, `.omc/logs/` 등 대부분의 state는 gitignore 대상이거나 agent-owned. PR diff에서 보이면 제거.

## cwd / 절대경로

- Bash 호출 간 `cd` 효과는 유지되지 않는다 (hook이 cwd를 초기화). 매 호출에 **절대경로** 사용.
- 어쩔 수 없이 `cd`가 필요하면 같은 호출에서 `&&`로 체이닝.
- Read/Edit/Write 도구 인자도 항상 절대경로. 상대경로는 예기치 않은 root에서 실패한다.

## Branching & push

- Feature 작업은 `feature/<N>-<slug>` → `dev` → `main`.
- `main`/`dev`에 **직접 push 금지**. dev는 PR 머지만 허용.
- 긴급 hotfix는 `hotfix/*` → `main` PR (상세: [`docs/GIT-WORKFLOW.md`](../../../GIT-WORKFLOW.md)).
- Draft PR은 `scripts/start-issue.sh <N> [type]`로 생성하면 프로젝트 보드가 자동 In Progress 전환.

## Session handoff

- `compact` / `clear` 전에 **무엇이 durable한지** 확인:
  - 커밋됨? 푸시됨? PR에 반영됨? 문서 업데이트됨?
- 휘발 상태(in-memory plan, unwritten todo)는 commit 또는 `.planning/` 아티팩트로 내려놔야 한다.
- `/gsd:pause-work`, `/gsd:resume-work`, memory 시스템(`.claude-pers/**`)이 공식 핸드오프 채널.

## Gotchas

- `EnterWorktree` 후에도 원래 브랜치의 dirty 파일은 그대로 남아 있다 — 의도적이지 않으면 버리거나 stash.
- worktree 안에서 `git fetch origin <branch>` 이후 `git rebase origin/<branch>`로 최신화. `git pull`은 기본 전략이 다를 수 있어 피한다.
- PR merge 후 worktree 제거를 잊으면 `.worktrees/` 폴더가 오래된 브랜치로 누적된다. 주기적 청소 필요.

## Recent changes

- 2026-04-23: 초기 작성 (Phase 1 Finding 2 follow-up, #232)
