#!/usr/bin/env bash
# Daily digest for decoded monorepo → Telegram
# Required env:
#   GH_TOKEN            (github actions token)
#   ANTHROPIC_API_KEY
#   TELEGRAM_BOT_TOKEN
#   TELEGRAM_CHAT_ID
#   GITHUB_REPOSITORY   (owner/repo)
set -eo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"
WINDOW_HOURS="${WINDOW_HOURS:-24}"

# GNU date (ubuntu runner). SINCE is ISO-8601 UTC for gh search filtering.
SINCE_ISO=$(date -u -d "${WINDOW_HOURS} hours ago" +%Y-%m-%dT%H:%M:%SZ)
SINCE_GIT=$(date -u -d "${WINDOW_HOURS} hours ago" +%Y-%m-%d\ %H:%M:%S)
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)

echo "::group::collect"
echo "window: since=${SINCE_ISO} (${WINDOW_HOURS}h)"

# --- commits on main/dev ---
git fetch --quiet origin main dev 2>/dev/null || git fetch --quiet origin main

commits_json() {
  local ref="$1"
  git log "$ref" --since="$SINCE_GIT" --pretty=format:'%H%x09%h%x09%s%x09%an' 2>/dev/null \
    | jq -R -s 'split("\n") | map(select(length > 0) | split("\t") | {sha:.[0], short:.[1], subject:.[2], author:.[3]})'
}

COMMITS_MAIN=$(commits_json origin/main)
COMMITS_DEV=$(commits_json origin/dev 2>/dev/null || echo "[]")

# --- PRs and issues via gh ---
MERGED_PRS=$(gh pr list --repo "$REPO" --state merged --limit 50 \
  --json number,title,author,mergedAt,baseRefName,headRefName,additions,deletions \
  | jq --arg since "$SINCE_ISO" '[.[] | select(.mergedAt >= $since)]')

OPEN_PRS=$(gh pr list --repo "$REPO" --state open --limit 50 \
  --json number,title,author,isDraft,reviewDecision,createdAt,updatedAt,headRefName,baseRefName)

NEW_ISSUES=$(gh issue list --repo "$REPO" --state all --limit 50 \
  --json number,title,author,labels,createdAt,state \
  | jq --arg since "$SINCE_ISO" '[.[] | select(.createdAt >= $since)]')

OPEN_ISSUES_ASSIGNED=$(gh issue list --repo "$REPO" --state open --limit 50 \
  --json number,title,author,assignees,labels \
  | jq '[.[] | select(.assignees | length > 0)]')

MERGED_COUNT=$(echo "$MERGED_PRS" | jq 'length')
OPEN_COUNT=$(echo "$OPEN_PRS" | jq 'length')
ISSUES_COUNT=$(echo "$NEW_ISSUES" | jq 'length')
COMMITS_MAIN_COUNT=$(echo "$COMMITS_MAIN" | jq 'length')
COMMITS_DEV_COUNT=$(echo "$COMMITS_DEV" | jq 'length')

echo "merged PRs: $MERGED_COUNT"
echo "open PRs: $OPEN_COUNT"
echo "new issues: $ISSUES_COUNT"
echo "commits main/dev: $COMMITS_MAIN_COUNT/$COMMITS_DEV_COUNT"
echo "::endgroup::"

# --- Claude Haiku summary ---
echo "::group::summarize"

DATA_JSON=$(jq -n \
  --argjson merged_prs "$MERGED_PRS" \
  --argjson open_prs "$OPEN_PRS" \
  --argjson new_issues "$NEW_ISSUES" \
  --argjson open_issues_assigned "$OPEN_ISSUES_ASSIGNED" \
  --argjson commits_main "$COMMITS_MAIN" \
  --argjson commits_dev "$COMMITS_DEV" \
  '{
    merged_prs: $merged_prs,
    open_prs: $open_prs,
    new_issues: $new_issues,
    open_issues_assigned: $open_issues_assigned,
    commits_main: $commits_main,
    commits_dev: $commits_dev
  }')

PROMPT_TEXT='당신은 decoded 모노레포의 일일 리포트를 한국어로 작성합니다.
아래 JSON은 지난 24시간의 GitHub 활동입니다.

브랜치 맥락: decoded는 `feature/* → dev → main` 플로우. 대부분 작업은 dev에 병합되고, main은 릴리즈/CI 전용.

요청:
- 주요 변화 3~5개 bullet (가장 임팩트 큰 것부터)
- 각 항목 끝에 **어느 브랜치로 갔는지** 명시 (예: "(→dev)", "(→main)")
- open PR 언급 시 base 브랜치도 함께 명시
- review 대기중이거나 오래된 open PR 있으면 "주의" 섹션
- 전체 350자 이내, plain text (마크다운 금지)
- 형식:
✨ 하이라이트
• 내용 요약 (#PR번호, →baseBranch)

⚠️ 주의
• ... (해당 없으면 이 섹션 생략)'

CLAUDE_REQ=$(jq -n \
  --arg model "claude-haiku-4-5-20251001" \
  --arg prompt "$PROMPT_TEXT" \
  --arg data "$DATA_JSON" \
  '{
    model: $model,
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: "\($prompt)\n\n데이터:\n\($data)"
    }]
  }')

CLAUDE_RESP=$(curl -sS -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: ${ANTHROPIC_API_KEY}" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "$CLAUDE_REQ")

SUMMARY=$(echo "$CLAUDE_RESP" | jq -r '.content[0].text // empty')
if [ -z "$SUMMARY" ]; then
  echo "::warning::Claude API 응답 파싱 실패"
  echo "$CLAUDE_RESP" | jq . || echo "$CLAUDE_RESP"
  SUMMARY="(AI 요약 생성 실패 — raw 데이터만 전송)"
fi
echo "::endgroup::"

# --- compose top-N bullet lists for telegram body ---

top_merged=$(echo "$MERGED_PRS" | jq -r '
  .[:5] | map("• #\(.number) \(.title) (→\(.baseRefName), by \(.author.login))") | join("\n")')
top_open=$(echo "$OPEN_PRS" | jq -r '
  .[:5] | map(
    "• #\(.number) \(.title) (→\(.baseRefName), by \(.author.login))" +
    (if .isDraft then " [draft]" else "" end)
  ) | join("\n")')
top_commits_main=$(echo "$COMMITS_MAIN" | jq -r '
  .[:3] | map("• \(.short) \(.subject) (by \(.author))") | join("\n")')
top_commits_dev=$(echo "$COMMITS_DEV" | jq -r '
  .[:3] | map("• \(.short) \(.subject) (by \(.author))") | join("\n")')
top_issues=$(echo "$NEW_ISSUES" | jq -r '
  .[:5] | map("• #\(.number) \(.title) by \(.author.login)") | join("\n")')

BODY=""
if [ -n "$top_commits_main" ]; then
  BODY+="📦 commits → main (${COMMITS_MAIN_COUNT})"$'\n'"$top_commits_main"$'\n\n'
fi
if [ -n "$top_commits_dev" ]; then
  BODY+="📦 commits → dev (${COMMITS_DEV_COUNT})"$'\n'"$top_commits_dev"$'\n\n'
fi
if [ -n "$top_merged" ]; then
  BODY+="🔀 merged PRs (${MERGED_COUNT})"$'\n'"$top_merged"$'\n\n'
fi
if [ -n "$top_open" ]; then
  BODY+="📝 open PRs (${OPEN_COUNT})"$'\n'"$top_open"$'\n\n'
fi
if [ -n "$top_issues" ]; then
  BODY+="📌 new issues (${ISSUES_COUNT})"$'\n'"$top_issues"$'\n\n'
fi

MSG=$(cat <<EOF
🌅 decoded 일일 요약 — ${TODAY_KST}
━━━━━━━━━━━━━━━━
📦 commits: main ${COMMITS_MAIN_COUNT} / dev ${COMMITS_DEV_COUNT}
🔀 merged PRs: ${MERGED_COUNT}
📝 open PRs: ${OPEN_COUNT}
📌 new issues: ${ISSUES_COUNT}

${BODY}${SUMMARY}

🔗 https://github.com/${REPO}/pulls
EOF
)

# --- send to Telegram ---
echo "::group::telegram"
PAYLOAD=$(jq -n \
  --arg chat_id "$TELEGRAM_CHAT_ID" \
  --arg text "$MSG" \
  '{
    chat_id: $chat_id,
    text: ($text | if length > 4096 then .[0:4090] + "\n…" else . end),
    disable_web_page_preview: true
  }')

RESP=$(curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESP" | jq .
echo "$RESP" | jq -e '.ok == true' >/dev/null
echo "::endgroup::"
