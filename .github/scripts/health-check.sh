#!/usr/bin/env bash
set -eo pipefail

send_telegram() {
  local msg="$1"
  local payload
  payload=$(jq -n \
    --arg chat_id "$TELEGRAM_CHAT_ID" \
    --arg text "$msg" \
    '{chat_id: $chat_id, text: $text, disable_web_page_preview: true}')
  curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$payload" | jq -e '.ok == true' >/dev/null
}

status_icon() {
  [ "$1" = "up" ] && echo "✅" || echo "❌"
}

NOW=$(date -u '+%Y-%m-%d %H:%M UTC')

HTTP_CODE=$(curl -sS -o /tmp/health_body.json \
  -w "%{http_code}" \
  --max-time 10 \
  "$API_HEALTH_URL" 2>/dev/null || echo "000")

BODY=$(cat /tmp/health_body.json 2>/dev/null || echo "{}")
STATUS=$(echo "$BODY" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

echo "HTTP: $HTTP_CODE | status: $STATUS"

if [ "$HTTP_CODE" = "200" ] && [ "$STATUS" = "ok" ]; then
  echo "Health check passed"
  exit 0
fi

DB=$(echo "$BODY" | jq -r '.database.status // "unknown"' 2>/dev/null || echo "unknown")
SEARCH=$(echo "$BODY" | jq -r '.meilisearch.status // "unknown"' 2>/dev/null || echo "unknown")
STORAGE=$(echo "$BODY" | jq -r '.storage.status // "unknown"' 2>/dev/null || echo "unknown")
AI=$(echo "$BODY" | jq -r '.decoded_ai_grpc.status // "unknown"' 2>/dev/null || echo "unknown")

if [ "$HTTP_CODE" = "000" ]; then
  DETAIL="unreachable (timeout)"
else
  DETAIL="HTTP $HTTP_CODE / status: $STATUS"
fi

MSG=$(printf '%s\n' \
  "[DECODED API] Server Down" \
  "----------------" \
  "$DETAIL" \
  "database    $(status_icon "$DB")" \
  "meilisearch $(status_icon "$SEARCH")" \
  "storage     $(status_icon "$STORAGE")" \
  "ai-grpc     $(status_icon "$AI")" \
  "$NOW")

send_telegram "$MSG"
echo "::warning::Health check FAILED — alert sent"
