---
name: meeting-prep
description: >
  주간 미팅 준비용 업데이트 요약을 Notion 호환 마크다운으로 생성.
  git 커밋, 브랜치, 워크트리, PR, 이슈(등록+할당), GSD 프로젝트 상태,
  Superpowers 아티팩트, Vercel 배포, GitHub Projects를 수집하여 정리.
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

### 2. 데이터 수집 (8개 소스, 각각 독립 실행 — 병렬 가능한 것은 병렬로)

**a. Git Commits** — `git log --author="$(git config user.name)" --since="$SINCE" --oneline --no-merges`
- conventional commit type별 그룹핑: feat → fix → refactor/docs/chore/test/perf

**b. Worktree & Branch** — `git worktree list`, 각 워크트리별 `git -C <path> log --oneline -3` + `git -C <path> status --short | head -5`
- 워크트리 없으면 현재 브랜치만 표시
- uncommitted 변경사항, stash 포함

**c. PRs** — `gh pr list --author=@me --state=all --limit=20 --json number,title,state,updatedAt,headRefName`
- state별 정렬: open → merged → closed

**d. Issues** — 두 쿼리를 합산하고 중복 제거:
- `gh issue list --author=@me --state=all --limit=20 --json number,title,state,labels,createdAt` (등록한 이슈)
- `gh issue list --assignee=@me --state=open --limit=10 --json number,title,labels` (할당된 이슈)
- priority label별 그룹핑: critical → high → medium → enhancement → 기타
- 이번 기간에 새로 등록한 이슈는 **(NEW)** 표시

**e. GSD Artifacts** — `.planning/STATE.md` + `.planning/ROADMAP.md` (있을 때만, `2>/dev/null`)
- 마일스톤, 진행률, 현재 페이즈 추출
- `.planning/` 없으면 섹션 자체 생략 (Cursor 사용자 고려)

**f. Superpowers Artifacts** — `docs/superpowers/specs/` + `docs/superpowers/plans/` (있을 때만)
- `$SINCE` 이후 날짜의 파일만 수집: `ls docs/superpowers/specs/ docs/superpowers/plans/ | grep "^$(date range)"`
- 파일명에서 날짜·제목 추출 (예: `2026-04-09-auth-stabilization-design.md` → Auth Stabilization)
- specs = 설계 문서, plans = 실행 계획으로 구분
- archive/ 하위는 제외
- `docs/superpowers/` 없으면 섹션 생략

**g. Vercel Deployments** — `gh api repos/{owner}/{repo}/deployments --jq '.[:20]'`
- environment별 분류: Production vs Preview
- `$SINCE` 이후 배포만 필터
- Production 배포는 **굵게** 강조
- 총 Preview/Production 배포 수 요약

**h. GitHub Projects** — `gh project item-list {number} --owner {org} --format json --limit 30`
- org 프로젝트 목록: `gh project list --owner {org} --format json`
- status별 그룹핑: Done / In Progress / Todo
- 각 그룹에서 상위 5개 항목만 표시, 총 카운트 포함
- 프로젝트 없으면 섹션 생략

**gh CLI 없으면** PRs/Issues/Vercel/Projects 섹션 생략 + "gh CLI 미설치" 안내.

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

## Vercel Deployments
> gh API로 deployments 조회 가능할 때만 표시
| 시간 (UTC) | 환경 | Commit | 내용 |
|------------|------|--------|------|
| MM-DD HH:MM | **Production** | `sha7` | **릴리즈 내용** |
| MM-DD HH:MM | Preview | `sha7` | 커밋 내용 |
> 총 N Preview, N Production 배포

## GitHub Project — {project_name} (#{number})
> gh project 조회 가능할 때만 표시, 총 N개 아이템
| Status | Count | 주요 항목 |
|--------|-------|----------|
| Done | N | item1, item2, ... |
| In Progress | N | item1, ... |
| Todo | N | item1, item2, ... |

## Superpowers Artifacts (설계 & 계획)
> docs/superpowers/ 있을 때만 표시
### Specs (설계 문서)
| 날짜 | 제목 |
|------|------|
| YYYY-MM-DD | 설계 제목 (파일명에서 추출) |

### Plans (실행 계획)
| 날짜 | 제목 |
|------|------|
| YYYY-MM-DD | 계획 제목 (파일명에서 추출) |

## Project Status (GSD)
> .planning/ 있을 때만 표시
- Milestone: vX.X Name
- Progress: ██████░░░░ N/M phases
- Current: Phase N (name) — STATUS

## Next Week Plan
- (열린 PR/이슈/GSD/Project 상태 기반 AI 추론, 불확실시 "TBD — 미팅에서 논의")
```

### 출력 규칙

- 데이터 없는 섹션은 통째로 생략 (빈 테이블 출력 금지)
- 섹션 헤더: 한국어 병기, 내용: 원문 그대로
- 커밋은 마일스톤/테마별로 추가 그룹핑 가능 (동일 스코프 커밋 5개 이상 시)
