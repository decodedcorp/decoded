# gRPC 계약 (AI 서버)

- **상대 서비스**: 모노레포 `packages/ai-server/` (Python gRPC). 레거시 명칭·메트릭은 `decoded_ai`를 그대로 쓸 수 있다.
- **클라이언트**: `services/decoded_ai_grpc/client.rs`, `proto/decoded_ai.proto`
- **용도**: OG 추출, 링크/이미지 분석, 포스트 에디토리얼 큐 등
- **메트릭**: `DecodedAIGrpcClient` 각 RPC 후 `tracing::info!` — `target = "metrics.grpc.decoded_ai"`, 필드 `grpc_method`, `elapsed_ms`, `ok` (`src/observability/grpc.rs`)

## Proto 단일 소스 (후속)

- Rust 쪽 정본: `packages/api-server/proto/` ( `build.rs`가 컴파일).
- Python 쪽: `packages/ai-server/src/grpc/proto/` 등. **양쪽 동기화**는 별도 작업(복사 스크립트 또는 공유 디렉터리)으로 정리할 수 있다.
