#!/usr/bin/env bash
# 이슈 번호로 작업 브랜치 + Draft PR 생성.
# 프로젝트 보드(#3)가 PR 링크를 감지해 자동으로 In Progress 전환.
#
# 사용법: ./scripts/start-issue.sh <issue#> [type]
#   type 기본값: feat (feat|fix|chore|docs|refactor|test|ci|perf|style)
set -euo pipefail

ISSUE="${1:-}"
TYPE="${2:-feat}"

if [[ -z "$ISSUE" ]]; then
  echo "사용법: $0 <issue#> [type]" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI가 필요합니다: https://cli.github.com/" >&2
  exit 1
fi

REPO="decodedcorp/decoded"
BASE="dev"

# 이슈 메타데이터 조회
META="$(gh issue view "$ISSUE" --repo "$REPO" --json title,state,assignees 2>/dev/null || true)"
if [[ -z "$META" ]]; then
  echo "이슈 #$ISSUE 를 찾을 수 없음 ($REPO)" >&2
  exit 1
fi

TITLE="$(echo "$META" | jq -r .title)"
STATE="$(echo "$META" | jq -r .state)"
if [[ "$STATE" != "OPEN" ]]; then
  echo "경고: 이슈 #$ISSUE 는 $STATE 상태" >&2
fi

# 브랜치 이름: feat/<issue#>-<slug>
SLUG="$(echo "$TITLE" \
  | sed -E 's/^[a-z]+(\([^)]+\))?:[[:space:]]*//' \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
  | cut -c1-40)"
BRANCH="${TYPE}/${ISSUE}-${SLUG}"

echo "▶ 브랜치: $BRANCH"
echo "▶ 이슈:   #$ISSUE — $TITLE"

# 현재 브랜치가 dev가 아니면 경고
CURRENT="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT" != "$BASE" ]]; then
  echo "경고: 현재 브랜치 '$CURRENT' ≠ '$BASE'. 계속하려면 Enter, 중단하려면 Ctrl+C" >&2
  read -r
fi

# dev 최신화
git fetch origin "$BASE" --quiet
git checkout -B "$BRANCH" "origin/$BASE"

# 빈 커밋으로 Draft PR 생성 가능하게
git commit --allow-empty -m "${TYPE}(#${ISSUE}): start work — ${TITLE}" --quiet
git push -u origin "$BRANCH" --quiet

# Draft PR
PR_BODY="$(cat <<EOF
## Summary
Closes #${ISSUE}

## Changes
- [ ] TODO

## Test Plan
- [ ] TODO
EOF
)"

gh pr create \
  --repo "$REPO" \
  --base "$BASE" \
  --head "$BRANCH" \
  --draft \
  --title "${TYPE}(#${ISSUE}): ${TITLE}" \
  --body "$PR_BODY"

echo "✅ Draft PR 생성 완료 — 프로젝트 보드가 In Progress로 자동 전환됩니다."
