---
name: meeting-prep
description: >
  주간 미팅 준비용 업데이트 요약을 Notion 호환 마크다운으로 생성.
  git 커밋, 브랜치, 워크트리, PR, 이슈(등록+할당), GSD 프로젝트 상태를 수집하여 정리.
  Use when: "meeting prep", "주간 업데이트", "weekly update", "미팅 준비",
  "이번 주 뭐 했지", "주간 보고", "weekly report", "이번 주 작업 정리".
  Optional arg: --since YYYY-MM-DD to override date range.
---

# Meeting Prep

매주 목요일 9시 미팅 전 주간 업데이트를 Notion에 붙여넣기 가능한 마크다운으로 생성한다.

## 실행 흐름

### 1. 날짜 범위

- 기본: 전주 목요일 ~ 현재
- `--since YYYY-MM-DD` 인자가 있으면 해당 날짜 사용
- macOS: `date -v-thu -v-7d +%Y-%m-%d`, Linux fallback: `date -d "last thursday -7 days"`

### 2. 데이터 수집 (5개 소스, 각각 독립 실행)

**a. Git Commits** — `git log --author="$(git config user.name)" --since="$SINCE" --oneline --no-merges`
- conventional commit type별 그룹핑: feat → fix → refactor/docs/chore/test/perf

**b. Worktree & Branch** — `git worktree list`, 각 워크트리별 `git -C <path> log --oneline -3` + `git -C <path> status --short | head -5`
- 워크트리 없으면 현재 브랜치만 표시
- uncommitted 변경사항, stash 포함

**c. PRs** — `gh pr list --author=@me --state=all --limit=20 --json number,title,state,updatedAt`
- state별 정렬: open → merged → closed

**d. Issues** — 두 쿼리를 합산하고 중복 제거:
- `gh issue list --author=@me --state=all --limit=20 --json number,title,state,labels,createdAt` (등록한 이슈)
- `gh issue list --assignee=@me --state=open --limit=10 --json number,title,labels` (할당된 이슈)
- priority label별 그룹핑: critical → high → medium → enhancement → 기타
- 이번 기간에 새로 등록한 이슈는 **(NEW)** 표시

**e. GSD Artifacts** — `.planning/STATE.md` + `.planning/ROADMAP.md` (있을 때만, `2>/dev/null`)
- 마일스톤, 진행률, 현재 페이즈 추출
- `.planning/` 없으면 섹션 자체 생략 (Cursor 사용자 고려)

**gh CLI 없으면** PRs/Issues 섹션 생략 + "gh CLI 미설치" 안내.

### 3. 출력 템플릿

```markdown
# Weekly Update — {name} ({from} ~ {to})

## Done (완료)
### Features
- feat(scope): description (PR #N)
### Fixes
- fix(scope): description
### Other
- refactor/docs/chore/test items

## In Progress (진행 중)
### Worktrees
| Worktree | Branch | 상태 |
|----------|--------|------|
| main (root) | `feat/xxx` | 설명 — N files uncommitted |
| `wt-name` | `branch` | 최근 작업 요약 |

### WIP
- Uncommitted: N files modified
- Stash: N entries

## PRs
| # | Title | Status |
|---|-------|--------|

## Issues (등록 + 할당)
### Priority: Critical
| # | Title | Labels |
|---|-------|--------|

### Priority: High
| # | Title | Labels |
|---|-------|--------|

### Enhancement
| # | Title | Labels |
|---|-------|--------|

## Project Status (GSD)
> .planning/ 있을 때만 표시
- Milestone: vX.X Name
- Progress: ██████░░░░ N/M phases
- Current: Phase N (name) — STATUS

## Next Week Plan
- (열린 PR/이슈/GSD 상태 기반 AI 추론, 불확실시 "TBD — 미팅에서 논의")
```

### 출력 규칙

- 데이터 없는 섹션은 통째로 생략 (빈 테이블 출력 금지)
- 섹션 헤더: 한국어 병기, 내용: 원문 그대로
- 커밋은 마일스톤/테마별로 추가 그룹핑 가능 (동일 스코프 커밋 5개 이상 시)
