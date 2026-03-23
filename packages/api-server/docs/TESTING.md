# 테스트 실행 가이드

## 단위 테스트 (Rust, DB 없음)

- **위치**: `src/**/tests.rs` — DTO·페이지네이션·순수 로직 등.
- **실행**: `cargo test --lib` (또는 `cargo test` — 통합 테스트는 아래 참고).
- **구조적(아키텍처) 테스트**: `cargo test tests::architecture --lib`

## 통합 테스트 (실제 PostgreSQL)

- **위치**: [`tests/integration_feed.rs`](../tests/integration_feed.rs), [`tests/integration_rankings.rs`](../tests/integration_rankings.rs), [`tests/integration_earnings.rs`](../tests/integration_earnings.rs)
- 각 케이스에 `#[ignore = "integration DB …"]`가 붙어 있어 **기본 `cargo test`에서는 스킵**됩니다.
- **실행 스크립트**: [`scripts/run-integration-tests.sh`](../scripts/run-integration-tests.sh)

```bash
export DATABASE_URL="postgresql://..."
# .env 에 SUPABASE_* 등이 있으면 함께 로드
./scripts/run-integration-tests.sh
```

필요 조건:

1. `DATABASE_URL` — 실제 DB 연결 문자열  
2. 스키마 — `sea-orm-cli migrate up` 등 마이그레이션 적용  
3. (일부 시나리오) 시드 데이터 — `fashion` 카테고리 등

공통 헬퍼: [`tests/common/mod.rs`](../tests/common/mod.rs)

## 로컬 품질 게이트

- [`scripts/pre-push.sh`](../scripts/pre-push.sh): `fmt`, `clippy -D warnings`, **`cargo test --lib`** (단위만), **`cargo-deny`**, **`cargo-tarpaulin`**(라인 커버리지 **10%** 미만 시 실패; `lib`만, `src/entities/*` 제외 — 각각 `cargo install cargo-deny`, `cargo install cargo-tarpaulin` 필요), **`check-migration-sync.sh`**(`DATABASE_URL`·`psql` 필수; `packages/api-server/.env` 또는 `.env.dev`에서 로드 가능). 모노레포 전체 흐름은 루트 `scripts/git-pre-push.sh` / `bun run ci:local` — [GIT_WORKFLOW.md](GIT_WORKFLOW.md). `decoded-api` / `migration` / `entity`의 `Cargo.toml`에 `[lints.rust] unused_imports = "deny"`가 있어 **미사용 import는 Clippy 단계에서 실패**합니다.

### 커버리지 측정 (로컬)

```bash
cargo tarpaulin --lib \
  --exclude-files 'src/entities/*' \
  --fail-under 10 --out Stdout
```

임시로 기준만 낮출 때: `TARPAULIN_FAIL_UNDER=9 ./scripts/pre-push.sh`
- **cargo-deny**: `cargo install cargo-deny` 후 `cargo deny check` ([`deny.toml`](../deny.toml)).
