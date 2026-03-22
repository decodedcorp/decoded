#!/bin/bash

# scripts/update-and-restart.sh
# Updates Mac Mini dev server: pulls latest code, builds, and restarts server

set -e

SESSION_NAME="frontend-dev"
BRANCH="${1:-$(git branch --show-current)}"

echo "🔄 Pulling latest changes from $BRANCH..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "📦 Installing dependencies..."
yarn install

echo "🔨 Building application..."
yarn build

echo "🔄 Restarting server..."
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux send-keys -t "$SESSION_NAME" C-c
  sleep 2
  tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
fi

tmux new-session -d -s "$SESSION_NAME" \
  "cd $(pwd) && HOST=0.0.0.0 PORT=3000 yarn dev"

echo "✅ Dev server restarted on PORT 3000 (session: $SESSION_NAME)"

