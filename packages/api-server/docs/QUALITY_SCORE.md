# 품질 등급 (도메인)

| 도메인 | 등급 | 메모 |
|--------|------|------|
| admin | B | 다수 하위 핸들러 |
| badges | B | |
| categories | B | 캐시 포함 |
| comments | B | |
| earnings | B | |
| feed | B | |
| post_likes | B | |
| post_magazines | B | gRPC 연동 |
| posts | A | 핵심 도메인 |
| rankings | B | |
| saved_posts | B | |
| search | B | Meilisearch |
| solutions | B | 스토리지/임베딩 |
| spots | B | |
| subcategories | B | |
| users | B | |
| views | C | 서비스 단일 파일 |
| votes | B | |

등급: **A** 우수 · **B** 양호 · **C** 개선 필요 · **D/F** 위험

## 글로벌 (워크스페이스)

- **Clippy**: `pre-push`에서 `cargo clippy --all-targets -- -D warnings` (TD-002 완료).
- **cargo-deny**: `cargo deny check` — 라이선스·advisory ([`deny.toml`](../deny.toml), TD-003 완료). AWS SDK가 고정한 `rustls-webpki` 0.101.x는 [`deny.toml`](../deny.toml)에 문서화된 예외(RUSTSEC-2026-0049).
