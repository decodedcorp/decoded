# 아키텍처 개요

## 레이어

1. **HTTP**: `handlers` (Axum), OpenAPI `utoipa`
2. **애플리케이션**: `service` (비즈니스 로직, Sea-ORM)
3. **데이터 전송**: `dto` (요청/응답, `validator`)
4. **인프라**: `services/` (R2, Meilisearch, gRPC, 임베딩 등)

도메인 내부 의존 방향: **dto → service → handlers** (역방향 금지).

## 도메인 간 통신

- **직접 `domains::other` 참조**는 허용 목록(`DOMAIN_DEPS`, `src/tests/architecture.rs`)에 맞춤.
- **admin**은 여러 도메인 조합 허용 (`*`).

## 엔티티

`entities/` — Sea-ORM 모델. 마이그레이션은 `migration/`.

## 참고

- [design-docs/core-beliefs.md](design-docs/core-beliefs.md)
- [references/sea-orm-patterns.md](references/sea-orm-patterns.md)
- [references/grpc-contracts.md](references/grpc-contracts.md)
