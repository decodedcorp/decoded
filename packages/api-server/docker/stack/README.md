# Decoded backend stack (multi-container)

`api` (Rust), `ai` (Python), `meilisearch`, `redis`, `searxng` — **한 Compose 프로젝트** (`name: decoded-backend`)에서 함께 기동합니다. 서비스 간 주소는 Docker DNS 이름(`api`, `ai`, `meilisearch`, `redis`, `searxng`)을 사용합니다.

## Build / run (모노레포 루트)

1. 모노레포 루트에 `.env.backend.dev` 준비 (staging: `.env.backend.staging`, prod: `.env.backend.prod`). 템플릿: `.env.backend.example`.
2. 배포 스크립트:

```bash
./scripts/deploy-backend.sh dev up --build
./scripts/deploy-backend.sh staging up
./scripts/deploy-backend.sh prod down
```

## 서비스·포트 (dev 기준)

| 서비스 | 설명 | 호스트 포트 (dev) |
|--------|------|-------------------|
| `api` | Axum HTTP, Meilisearch 클라이언트, AI gRPC 클라이언트 | `8080` |
| `ai` | FastAPI `:10000`, gRPC 인바운드 `:50051` | `10000` (gRPC는 내부만 `expose`) |
| `meilisearch` | 검색 | `7700` |
| `redis` | AI 큐/캐시 | `6303` → 컨테이너 `6379` |
| `searxng` | 메타데이터 검색 | `4000` → 컨테이너 `8080` |

Compose `environment`로 덮어쓰는 값: `MEILISEARCH_URL`, `AI_SERVER_GRPC_URL`, `API_SERVER_GRPC_PORT` (Rust gRPC 수신; ai의 `API_SERVER_GRPC_PORT`와 동일해야 함), `REDIS_HOST`, `SEARXNG_API_URL`, `API_SERVER_HTTP_URL`, `API_SERVER_GRPC_HOST`, `AI_GRPC_LISTEN_PORT` 등. 로컬 호스트 전용 `.env`에 `API_SERVER_GRPC_PORT`가 다르면(예: 50053) 컨테이너에서도 compose가 위 값으로 맞춥니다.

## 로그 (서비스별)

```bash
./scripts/deploy-backend.sh dev logs -f api
./scripts/deploy-backend.sh dev logs -f ai
```

## 수동 compose

```bash
docker compose --env-file .env.backend.dev \
  -f packages/api-server/docker/stack/docker-compose.yml up --build
```

## Meilisearch 키

`deploy-backend.sh`는 통합 env를 `--env-file`로 넘겨 `${MEILISEARCH_MASTER_KEY}` 보간에 사용합니다. prod는 `.env.backend.prod`에 키가 있어야 합니다.

## 환경 변수 이름

루트 [CLAUDE.md](../../../../CLAUDE.md) — `AI_SERVER_GRPC_URL`, `API_SERVER_GRPC_PORT`, `AI_GRPC_LISTEN_PORT`(AI gRPC 리슨 포트, compose에서 `50051`로 통일 가능) 등.
