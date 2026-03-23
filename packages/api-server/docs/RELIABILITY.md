# 안정성 기준

- **헬스**: `GET /health` — JSON으로 DB(`SELECT 1`), Meilisearch(`GET …/health`), R2 설정 여부, AI 서버(`packages/ai-server`) gRPC URL 설정 요약 (`src/handlers.rs`).
- **로깅**: `LOG_FORMAT`/`RUST_LOG`, `tracing` JSON 또는 텍스트.
- **gRPC (ai-server)**: 각 RPC 종료 시 `target = metrics.grpc.decoded_ai` 구조화 로그 (`elapsed_ms`, `grpc_method`, `ok`).
- **푸시 전**: `scripts/pre-push.sh` (fmt, clippy, test, **cargo-deny**, **tarpaulin 10%** (lib, 엔티티 제외), migration sync).
