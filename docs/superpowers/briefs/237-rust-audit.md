# Brief — #237 Rust API audit 통합

**브랜치**: `feat/237-rust-audit-integration`
**워크트리**: `.worktrees/237-rust-audit` (PORT=3006, Rust는 cargo)
**작성일**: 2026-04-17 (operator 세션에서 사전 분석)
**다음 단계**: **설계 검토 먼저** → Superpowers `brainstorming` → `writing-plans` → TDD 구현

## ✅ 설계 결정 확정 (2026-04-17, operator 세션)

**옵션 A — Rust SeaORM 트랜잭션 원자 기록** 채택.

### 근거 (evidence-based)

1. **선행 패턴 존재**: `update_magazine_status` RPC (SQL)가 동일한 문제를 이미 풀었음 — UPDATE + audit INSERT + admin guard 원자. Rust도 같은 원자성 기준을 유지해야 함.
2. **Rust 인프라 준비됨**: `middleware/auth.rs`의 `User` extension에 `id: Uuid`, `is_admin: bool` 전파됨. 현재 handler 3곳 모두 `_extension: axum::Extension<User>` 주입되나 `_` 접두사로 사용되지 않고 있음 — 활용만 하면 됨.
3. **ORM 단일화**: `Cargo.toml` sea-orm 1.1.19, sqlx 직접 사용 無. SeaORM `transaction()` 클로저 패턴(`CLAUDE.md §9`) 그대로 적용.
4. **테이블 존재**: `warehouse.admin_audit_log` — `supabase/migrations/20260409075040_remote_schema.sql` L902+ 에 이미 존재. 스키마 변경 불필요.

### 옵션 B(Next proxy pre/post)를 기각한 이유
- 3 round-trip + Rust mutation과 audit INSERT 사이 race window
- `update_magazine_status` 패턴과 일관성 깨짐
- `audit-log.ts` L31-36 TODO가 "fold into atomic pattern when Rust audit integration lands" 명시

## 현재 상태

- Rust audit 인프라 **전혀 없음** — grep `admin_audit` 결과 `api-server/src` 내 0건
- 관련 기존 파일:
  - `packages/web/lib/api/admin/audit-log.ts` — Next.js 버전 (TS, warehouse INSERT)
  - `packages/api-server/src/domains/reports/handlers.rs` — PATCH reports 있음
  - `packages/api-server/src/domains/admin/posts.rs` — PATCH posts status/metadata 있음

## 범위

### 신규
- `packages/api-server/src/services/audit.rs`
  - `write_audit_log(tx, entry: AuditLogEntry) -> Result<()>`
  - warehouse.admin_audit_log INSERT (sqlx 또는 SeaORM entity)
  - `{admin_user_id, action, target_table, target_id, before_state, after_state, metadata}`
  - SeaORM 엔티티 생성 여부 확인

### 수정 (기존 handler 3곳)

| Handler | File | Action |
|---|---|---|
| PATCH `/api/v1/admin/reports/{id}` | `reports/handlers.rs` | `report.status.update`, before/after |
| PATCH `/api/v1/admin/posts/{id}/status` | `admin/posts.rs` | `post.status.update` |
| PATCH `/api/v1/admin/posts/{id}` (metadata) | `admin/posts.rs` | `post.metadata.update` |

각각:
1. 트랜잭션 시작
2. before state SELECT
3. UPDATE
4. `write_audit_log(tx, ...)` 호출
5. 커밋

### Auth 연동 (확인됨)

- `packages/api-server/src/middleware/auth.rs` L21-36: `User { id, email, username, rank, is_admin }` 구조체
- handler 3곳에 `_extension: axum::Extension<User>` 이미 주입됨 (admin_middleware 통과 후)
- **작업**: `_` 제거하고 `extension.0.id`를 service 인자로 전달

### Bulk operation `affectedIds`

- `warehouse.admin_audit_log.metadata` JSONB 컬럼 이미 존재 (remote_schema.sql L902+, update_magazine_status RPC에서 `row_to_json()::jsonb`로 사용 중)
- 마이그레이션 불필요
- `metadata` 내부에 `{ affectedIds: [...] }` 추가 저장 가능

## 검증 체크리스트

- [ ] 각 PATCH 호출 시 `warehouse.admin_audit_log`에 row 생성
- [ ] `before_state`/`after_state` JSON 구조 Next.js writeAuditLog와 호환
- [ ] 트랜잭션 롤백 시 audit도 롤백됨
- [ ] admin이 아닌 user 호출 시 audit 안 씀 (권한 오류 경로)
- [ ] Rust 단위 테스트 (`cargo test -p api-server`)
- [ ] Next.js `audit-log.ts` L31-36 TODO 주석 제거 (#237 완료 후)

## 참고

- `packages/web/lib/api/admin/audit-log.ts` — 스키마/action 네이밍 레퍼런스
- SeaORM entity 생성 명령: `sea-orm-cli generate entity ...` (기존 패턴 따르기)
- Memory: `[DB migration strategy]` — 컬럼은 SeaORM, RLS/함수는 Supabase CLI
- `packages/api-server/AGENT.md` — Rust 크레이트 전용 컨벤션

## Operator와 조율할 항목

- ✅ ~~옵션 A vs B~~ → **A 확정**
- ✅ ~~metadata JSONB 컬럼 여부~~ → **존재함, 불필요**
- ✅ ~~SeaORM vs sqlx~~ → **SeaORM 단일**
- 남은 확인: `admin_middleware`가 `User` extension 항상 주입 보장하는지 (L71 주석 검증)
- 남은 확인: `domains/reports/handlers.rs` PATCH 시그니처가 posts.rs와 동일 패턴인지

## Coordination

- 다른 워크트리와 파일 겹침 없음
- #244 ai-server 세션과도 완전 분리 (언어 다름)
- #239 마이그레이션과 타임스탬프 충돌 주의 (동일 날짜 SQL 파일 2개 시)
