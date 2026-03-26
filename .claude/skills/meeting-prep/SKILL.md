---
name: meeting-prep
description: >
  주간 미팅 준비용 업데이트 요약 생성.
  "meeting prep", "주간 업데이트", "weekly update", "미팅 준비" 요청 시 적용.
allowed-tools: Read, Grep, Glob, Bash
model: claude-sonnet-4-20250514
---

# Meeting Prep (주간 미팅 준비)

## 개요

매주 목요일 9시 SSC 미팅 전 주간 업데이트를 자동 생성하는 스킬.
지난 주 목요일부터 현재까지의 활동을 수집하여 Notion에 바로 붙여넣을 수 있는 마크다운으로 출력합니다.

`/meeting-prep` 명령 또는 자연어로 트리거합니다.

## 트리거 조건

- "meeting prep"
- "주간 업데이트"
- "weekly update"
- "미팅 준비"
- "이번 주 뭐 했지"
- "주간 보고"

## 실행 방법

### Step 1: 날짜 범위 계산

기본 기간은 전주 목요일 00:00 ~ 현재입니다.

```bash
# macOS (date -v 플래그)
LAST_THU=$(date -v-thu -v-7d +%Y-%m-%d 2>/dev/null)

# GNU date fallback (Linux)
if [ -z "$LAST_THU" ]; then
  LAST_THU=$(date -d "last thursday -7 days" +%Y-%m-%d 2>/dev/null)
fi

# 최종 fallback: 7일 전
if [ -z "$LAST_THU" ]; then
  LAST_THU=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)
fi

echo "Since: $LAST_THU"
```

사용자가 `--since 2026-03-15` 같이 날짜를 직접 지정하면 그 값을 `LAST_THU`로 사용합니다.

### Step 2: 데이터 수집

#### a. Git Commits

```bash
AUTHOR=$(git config user.name)
git log --author="$AUTHOR" --since="$LAST_THU" --oneline --no-merges
```

수집한 커밋을 conventional commit type 별로 그룹핑합니다:
- `feat` → Features (완료)
- `fix` → Fixes (완료)
- `refactor` / `docs` / `chore` / `test` / `perf` → Other (완료)

#### b. Branch Status (WIP)

```bash
# 활성 브랜치 목록 (최근 커밋 순)
git branch --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' | head -10

# Worktree 목록
git worktree list 2>/dev/null

# 현재 브랜치의 원격 대비 상태
git status --short
git stash list
```

#### c. PRs & Issues (gh CLI 필요)

```bash
# gh CLI 설치 여부 확인
if ! command -v gh &> /dev/null; then
  echo "gh CLI not installed — skipping PR/Issue section"
else
  # 내 PR 목록 (최근 20개, 이번 기간 포함)
  gh pr list --author=@me --state=all --limit=20 \
    --json number,title,state,updatedAt

  # 내 이슈 목록 (열린 것)
  gh issue list --assignee=@me --state=open --limit=10 \
    --json number,title,labels
fi
```

gh CLI가 없으면 PR/Issue 섹션을 생략하고 "gh CLI가 설치되지 않아 PR/Issue 정보를 가져올 수 없습니다." 안내만 출력합니다.

#### d. WIP (Uncommitted Changes)

```bash
# 스테이징되지 않은 변경사항
git status --short

# 임시 저장된 작업
git stash list
```

#### e. GSD Artifacts (.planning/ 존재 시에만)

```bash
# STATE.md에서 현재 포지션, 진행률 추출
cat .planning/STATE.md 2>/dev/null | head -30

# ROADMAP.md에서 현재 마일스톤 요약
cat .planning/ROADMAP.md 2>/dev/null | head -50
```

`.planning/` 디렉토리가 없는 경우 (Cursor 사용자 등) 이 섹션 전체를 출력에서 생략합니다.
항상 `2>/dev/null`을 사용하여 에러가 출력에 노출되지 않도록 합니다.

### Step 3: 출력 생성

수집한 데이터를 아래 템플릿으로 조합하여 출력합니다.

---

## 출력 템플릿 (Notion 호환 마크다운)

```markdown
# Weekly Update — {author_name} ({date_from} ~ {date_to})

## Done (완료)

### Features
- feat(scope): description (PR #N)

### Fixes
- fix(scope): description

### Other
- refactor/docs/chore items

## In Progress (진행 중)

- Branch: `feat/xxx` — N commits ahead of main
- Uncommitted changes: N files modified
- Stash: N entries

## PRs

| # | Title | Status |
|---|-------|--------|
| 123 | Title | merged |
| 124 | Title | open |

## Issues

| # | Title | Labels |
|---|-------|--------|
| 45 | Title | bug, priority |

## Project Status (GSD)
> 이 섹션은 .planning/ 디렉토리가 있을 때만 표시

- Milestone: v10.0 Profile Completion
- Progress: 43/50 phases (████████████████████████████░░░░░░░░░░)
- Current: Phase 44 (auth-guard) — PLANNED

## Next Week Plan

- (커밋 로그, 열린 PR/Issue, GSD 상태를 기반으로 추론한 다음 주 계획)
```

---

## 출력 규칙

1. **섹션 생략 조건**
   - gh CLI 없음 → PRs, Issues 섹션 생략 + 안내 메시지
   - .planning/ 없음 → Project Status (GSD) 섹션 생략
   - 해당 기간 커밋 없음 → "이 기간에 커밋이 없습니다." 표시

2. **언어**
   - 섹션 헤더: 한국어 포함 (Done (완료), In Progress (진행 중))
   - 커밋/PR/이슈 내용: 원문 그대로

3. **그룹핑**
   - 커밋은 type 별로 분류 (feat > fix > refactor > docs > chore 순서)
   - PR은 state 별로 정렬 (open → merged → closed)

4. **Next Week Plan**
   - 열린 PR, 열린 이슈, GSD의 다음 페이즈를 기반으로 AI가 추론
   - 불확실하면 "TBD — 미팅에서 논의" 표기

## 사용 예시

```
> /meeting-prep
> 이번 주 미팅 준비해줘
> 주간 업데이트 정리해줘
> weekly update 만들어줘
> meeting prep --since 2026-03-10
> 이번 주 뭐 했지?
```

## 참조

- `git log` — 커밋 이력
- `gh pr list` / `gh issue list` — GitHub PR/이슈 (gh CLI 필요)
- `.planning/STATE.md` — GSD 프로젝트 상태
- `.planning/ROADMAP.md` — GSD 마일스톤 로드맵
