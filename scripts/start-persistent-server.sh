#!/bin/bash

# Persistent Server Startup Script
# Creates or attaches to a tmux session and runs the frontend server
# Usage: ./scripts/start-persistent-server.sh [dev|prod]

set -e

SESSION_NAME="frontend"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
MODE="${1:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}Error: tmux is not installed.${NC}"
    echo "Install it with: brew install tmux"
    exit 1
fi

# Validate mode
if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    echo -e "${RED}Error: Invalid mode. Use 'dev' or 'prod'${NC}"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

# Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}Session '$SESSION_NAME' already exists.${NC}"
    echo -e "${GREEN}Attaching to existing session...${NC}"
    tmux attach -t "$SESSION_NAME"
else
    echo -e "${GREEN}Creating new tmux session '$SESSION_NAME'...${NC}"
    
    # Create new session and run server
    if [ "$MODE" = "dev" ]; then
        tmux new-session -d -s "$SESSION_NAME" \
            "cd $(pwd) && HOST=$HOST PORT=$PORT yarn dev"
        echo -e "${GREEN}Development server starting in tmux session...${NC}"
    else
        echo -e "${YELLOW}Building for production...${NC}"
        yarn build
        tmux new-session -d -s "$SESSION_NAME" \
            "cd $(pwd) && HOST=$HOST PORT=$PORT yarn start"
        echo -e "${GREEN}Production server starting in tmux session...${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Server is running in tmux session '$SESSION_NAME'${NC}"
    
    # Get local IP address for external access
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
    if [ -n "$LOCAL_IP" ]; then
        echo -e "${GREEN}Local access:${NC} http://localhost:$PORT"
        echo -e "${GREEN}External access:${NC} http://$LOCAL_IP:$PORT"
    else
        echo -e "${GREEN}Access it at:${NC} http://$HOST:$PORT"
        echo -e "${YELLOW}Note:${NC} To get external IP, run: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    fi
    echo ""
    echo -e "${YELLOW}To detach from tmux:${NC} Press Ctrl+b, then d"
    echo -e "${YELLOW}To reattach later:${NC} tmux attach -t $SESSION_NAME"
    echo -e "${YELLOW}To stop server:${NC} tmux kill-session -t $SESSION_NAME"
    echo ""
    echo -e "${GREEN}Attaching to session now...${NC}"
    sleep 1
    tmux attach -t "$SESSION_NAME"
fi

