# Decoded API (Rust) — 에이전트 맵

이 파일은 목차입니다. 상세는 [docs/](docs/)와 각 도메인 `README.md`를 참고하세요.

## 스택

- **런타임**: Axum, Tokio, Sea-ORM (PostgreSQL), Meilisearch, Cloudflare R2, gRPC (decoded-ai)
- **엔트리**: `src/main.rs`, 라우터 `src/router.rs`, OpenAPI `src/openapi.rs`

## 레이어 (도메인 내부)

`dto.rs` → `service.rs` → `handlers.rs`. `dto`는 `service`/`handlers`를 참조하지 않습니다.

## 도메인 (`src/domains/`)

| 도메인 | 역할 |
|--------|------|
| [admin](src/domains/admin/README.md) | 관리자 API (대시보드, 큐레이션, 동의어 등) |
| [badges](src/domains/badges/README.md) | 배지 |
| [categories](src/domains/categories/README.md) | 카테고리 + 캐시 |
| [comments](src/domains/comments/README.md) | 댓글 |
| [earnings](src/domains/earnings/README.md) | 수익/정산 |
| [feed](src/domains/feed/README.md) | 피드 |
| [post_likes](src/domains/post_likes/README.md) | 포스트 좋아요 |
| [post_magazines](src/domains/post_magazines/README.md) | 포스트 매거진 |
| [posts](src/domains/posts/README.md) | 포스트 (다수 도메인과 조합) |
| [rankings](src/domains/rankings/README.md) | 랭킹 |
| [saved_posts](src/domains/saved_posts/README.md) | 저장한 포스트 |
| [search](src/domains/search/README.md) | 검색 |
| [solutions](src/domains/solutions/README.md) | 솔루션/링크 |
| [spots](src/domains/spots/README.md) | 스팟 |
| [subcategories](src/domains/subcategories/README.md) | 서브카테고리 |
| [users](src/domains/users/README.md) | 사용자 |
| [views](src/domains/views/README.md) | 조회 로그 |
| [votes](src/domains/votes/README.md) | 투표/채택 |

## 공유 서비스 (`src/services/`)

외부 연동: `storage`, `search`, `embedding`, `affiliate`, `decoded_ai_grpc`, `backend_grpc`, `metadata`.

## 마이그레이션

- 코드: `migration/`, 등록: `migration/src/lib.rs`
- **Supabase에 적용된 마이그레이션이 source of truth**입니다. 작업 전 `scripts/check-migration-sync.sh` 실행.
- 마이그레이션 추가 시 PR 필수, `lib.rs`에 `mod` + `migrations()` 등록, `up`/`down` 구현.

## 품질 게이트 (push 전)

`backend/scripts/pre-push.sh` — 포맷, `cargo clippy --all-targets -- -D warnings`, **`cargo test --lib`** (단위만), **`cargo-deny`**(`cargo install cargo-deny`), **`cargo-tarpaulin`**(라인 커버리지 **10%** 미만 시 실패; `lib`, `src/entities/*` 제외; `cargo install cargo-tarpaulin`), `check-migration-sync.sh` (**`DATABASE_URL` + `psql` 필수**; 비어 있으면 `backend/.env` → `.env.dev` 순으로 로드). 실 DB 통합 테스트는 [`scripts/run-integration-tests.sh`](scripts/run-integration-tests.sh). Git 훅으로 쓰면 **원격 `main`/`master` 직접 push 차단** — [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md). **원격 GitHub Actions CI는 사용하지 않음** — 품질 게이트는 pre-push가 담당합니다. **`git push --no-verify`는 사용 금지.**

- `Cargo.toml` `[lints.rust]`: **`unused_imports = "deny"`** — 사용하지 않는 `use`는 `cargo build` / `cargo clippy`에서 오류 (pre-push와 동일).
- `clippy.toml`(API 루트): `println!`/`dbg!`/`eprintln!` 금지, **런타임(API) 코드에서 `Option::unwrap` / `Result::unwrap` 금지** (테스트에서는 `unwrap` 허용). 테스트는 `#[cfg(test)]` 직하위 `mod`에 붙인 `#[allow(clippy::disallowed_methods)]`, `lib.rs`의 `pub mod tests`, 통합 테스트 `tests/integration_*.rs`의 `#![allow(...)]`로 예외 처리. SeaORM `DeriveEntityModel`·`serde_json::json!` 등 매크로 전개는 `entities/mod.rs` 또는 해당 모듈/함수에 `#[allow(clippy::disallowed_methods)]`로 한정. `migration/clippy.toml`, `entity/clippy.toml`에서는 unwrap 규칙 미적용.

## 병렬 에이전트 (테스트 전담)

테스트 작성만 별도 서브에이전트(Task)에 맡기고, 문서/스크립트 등은 다른 에이전트와 **동시에** 진행할 수 있습니다. 파일 범위를 겹치지 않게 나누는 것이 중요합니다. 자세한 절차·프롬프트 템플릿은 [docs/references/parallel-agents.md](docs/references/parallel-agents.md)를 참고하세요.

## 더 읽을 곳

- [docs/TESTING.md](docs/TESTING.md) — DB 통합 테스트·`cargo deny`·pre-push
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — `main` 직접 push 금지·훅 설치
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/design-docs/core-beliefs.md](docs/design-docs/core-beliefs.md)
