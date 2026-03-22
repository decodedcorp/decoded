# gRPC 계약 (decoded-ai)

- **클라이언트**: `services/decoded_ai_grpc/client.rs`, `proto/decoded_ai.proto`
- **용도**: OG 추출, 링크/이미지 분석, 포스트 에디토리얼 큐 등
- **메트릭**: `DecodedAIGrpcClient` 각 RPC 후 `tracing::info!` — `target = "metrics.grpc.decoded_ai"`, 필드 `grpc_method`, `elapsed_ms`, `ok` (`src/observability/grpc.rs`)
