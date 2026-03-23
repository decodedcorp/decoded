---
name: git-workflow
description: >-
  Git 워크플로우 컨벤션 가이드 및 검증.
  "브랜치 이름", "commit convention", "PR 준비", "git workflow" 요청 시 적용.
---

# Git Workflow

## 개요

`docs/GIT-WORKFLOW.md`를 기반으로 git 컨벤션을 검증하고 안내합니다.

## 트리거 조건

- "브랜치 이름", "branch naming"
- "커밋 컨벤션", "commit convention"
- "PR 준비", "PR readiness"
- "git workflow", "git 규칙"

## 기능

### 1. 브랜치명 검증

```bash
BRANCH=$(git branch --show-current)
```

허용 접두사: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`, `test/`, `ci/`

### 2. 커밋 메시지 검증

```bash
git log --oneline -10
```

Conventional Commits 형식 확인:
- `type(scope): description`
- 허용 타입: feat, fix, docs, refactor, test, chore, ci, perf, style

### 3. PR 준비 상태 체크

- [ ] 브랜치명 컨벤션 준수
- [ ] 커밋 메시지 형식 준수
- [ ] pre-push 체크 통과 (`bun run ci:local`)
- [ ] `/review` 코드 리뷰 완료
- [ ] P0 이슈 없음

### 4. 워크플로우 안내

`docs/GIT-WORKFLOW.md`를 참조하여 질문에 답변합니다.

## 참조

- `docs/GIT-WORKFLOW.md` — 팀 워크플로우 source of truth
- `scripts/git-pre-push.sh` — pre-push 훅

## 사용 예시

```
> 현재 브랜치 이름이 컨벤션에 맞는지 확인해줘
> PR 만들기 전 준비 상태 체크해줘
> 커밋 메시지 형식 알려줘
> git workflow 규칙이 뭐야?
```
