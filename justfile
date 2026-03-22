# 백엔드 작업 모음 — https://github.com/casey/just
# 설치: brew install just  (또는 cargo install just)
# 명령 목록: just --list
#
# 이 justfile 이 있는 디렉터리 = backend 저장소 루트(Cargo.toml)에서 실행하세요.

compose_dev := "docker/dev/docker-compose.yml"

# 기본: 레시피 목록
default:
    @just --list

# ── 한 번에: Git pre-push 훅 + .env.dev 준비 + 도커 개발 스택(api + meilisearch) ──
dev: hook env-dev docker-up

# `dev` 와 동일 (온보딩용 이름)
setup: dev

# Git pre-push 훅 (`git push` 전 로컬 CI + main/master 직접 push 차단)
hook:
    chmod +x scripts/pre-push.sh
    ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
    @echo "OK: .git/hooks/pre-push -> scripts/pre-push.sh"

# `.env.dev` 없으면 `.env.example`에서 복사 (docker compose 가 참조)
env-dev:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ ! -f .env.dev ]]; then
      cp .env.example .env.dev
      echo "Created .env.dev from .env.example — edit DATABASE_URL / keys if needed."
    fi

# 개발용 도커 기동 (백엔드 :8000, Meilisearch :7700)
docker-up:
    docker compose -f {{compose_dev}} up -d --build

# 개발 스택 중지
docker-down:
    docker compose -f {{compose_dev}} down

# API 컨테이너 로그 팔로우
docker-logs:
    docker compose -f {{compose_dev}} logs -f api

# 로컬 CI 전체 (pre-push.sh 와 동일)
ci:
    bash scripts/pre-push.sh
