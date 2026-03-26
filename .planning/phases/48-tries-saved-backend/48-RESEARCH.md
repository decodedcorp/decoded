# Phase 48: Tries & Saved Backend - Research

**Researched:** 2026-03-26
**Domain:** Rust/Axum backend pagination endpoints — SeaORM, utoipa, Orval codegen pipeline
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `GET /api/v1/users/me/tries` — 인증 필요, `user_tryon_history` 테이블 기반 페이지네이션
- `GET /api/v1/users/me/saved` — 인증 필요, `saved_posts` 테이블 기반 페이지네이션
- TryItem 필드: id, image_url, created_at (최소한의 필드 — 실제 테이블 스키마에 맞춤)
- SavedItem 필드: id, post_id, post_title, post_thumbnail_url, saved_at
- Pagination: `page` (1-based), `per_page` (기본 20, 최대 50) 쿼리 파라미터
- 기존 `getMyActivities` 페이지네이션 패턴 따름
- `PaginationMeta { current_page, per_page, total_pages, total_count }` 응답 구조
- 두 엔드포인트 구현 후 openapi.json 업데이트, `bun run generate:api`로 Orval 재생성

### Claude's Discretion
- `user_tryon_history` 테이블이 없는 경우 마이그레이션 DDL 구조
- SeaORM 엔티티 생성 vs raw SQL 선택
- TryItem/SavedItem DTO 상세 필드 (실제 테이블 스키마 기준)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRIES-01 | Rust 백엔드 `GET /api/v1/users/me/tries` 엔드포인트 구현 (페이지네이션) | user_tryon_history 테이블 존재 여부 확인, SeaORM 엔티티 생성, users domain 핸들러 추가, `Pagination` + `PaginatedResponse<TryItem>` 패턴 사용 |
| TRIES-02 | OpenAPI spec 반영 + Orval hook 생성 | utoipa `#[utoipa::path]` 어노테이션, openapi.rs schemas 등록, python3 json.load/dump로 openapi.json 업데이트, bun run generate:api |
| SAVED-01 | Rust 백엔드 `GET /api/v1/users/me/saved` 엔드포인트 구현 (기존 saved_posts 테이블 활용, 페이지네이션) | saved_posts 엔티티/서비스 이미 존재, posts JOIN 필요, raw SQL 권장 (SeaORM JOIN보다 간결) |
| SAVED-02 | OpenAPI spec 반영 + Orval hook 생성 | TRIES-02와 동일 프로세스 |
</phase_requirements>

---

## Summary

Phase 48은 두 개의 새 GET 엔드포인트를 users 도메인에 추가하고 OpenAPI spec을 업데이트하는 순수 백엔드 작업이다. 기존 `getMyActivities` 패턴과 `Pagination`/`PaginatedResponse<T>` 유틸리티가 이미 존재하므로 구조적 패턴은 확립되어 있다.

**핵심 미확인 사항:** `user_tryon_history` 테이블이 Supabase DB에 실제로 존재하는지 확인되지 않았다. 코드베이스 전체에서 해당 이름이 발견되지 않았으며 SeaORM 엔티티도 없다. 이 테이블은 Phase 46 이전에 Supabase에 직접 생성되었거나, Phase 48에서 새로 마이그레이션을 만들어야 한다.

`GET /api/v1/users/me/saved`는 기존 `saved_posts` 엔티티/서비스/핸들러 코드가 완비되어 있으므로 새 list 함수 추가 작업이다. posts 테이블 JOIN이 필요하며 raw SQL 쿼리 패턴(Phase 46 `count_followers` 방식)이 가장 간결하다.

**Primary recommendation:** 두 엔드포인트를 모두 users domain `handlers.rs`에 추가. saved의 경우 saved_posts 도메인 service.rs에 list 함수 추가. tries의 경우 테이블 존재 여부를 먼저 확인하고 raw SQL SELECT로 처리.

---

## Standard Stack

### Core — 이미 프로젝트에 있음 (버전 변경 없음)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SeaORM | (Cargo.toml 기존) | ORM entity, query | 프로젝트 표준 |
| utoipa | (Cargo.toml 기존) | OpenAPI spec 자동 생성 (`#[utoipa::path]`) | 프로젝트 표준 |
| axum | 0.7 | HTTP handler | 프로젝트 표준 |
| serde | (기존) | JSON직렬화 (`#[serde(rename_all = "snake_case")]`) | 프로젝트 표준 |
| chrono | (기존) | DateTime 타입 | 프로젝트 표준 |
| uuid | (기존) | Uuid 타입 | 프로젝트 표준 |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `crate::utils::pagination::{Pagination, PaginatedResponse}` | 공통 페이지네이션 유틸리티 | 두 엔드포인트 모두 |
| `sea_orm::{Statement, DbBackend, ConnectionTrait}` | raw SQL 실행 | saved_posts JOIN posts COUNT 쿼리 |
| `sea_orm::{EntityTrait, QueryFilter, QueryOrder, QuerySelect, ColumnTrait, PaginatorTrait}` | SeaORM 쿼리 빌더 | entity 기반 페이지네이션 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SQL (SELECT ... JOIN) | SeaORM RelationTrait + join | Raw SQL이 이 프로젝트에서 더 간결함 (Phase 46 패턴). SeaORM JOIN은 타입 관리 복잡 |
| saved_posts domain에 list 추가 | users domain에서 직접 쿼리 | saved_posts service 확장이 도메인 경계상 명확 |

---

## Architecture Patterns

### Existing Pattern: Users Domain Protected Routes

`packages/api-server/src/domains/users/handlers.rs`의 `router()` 함수:

```rust
// Source: packages/api-server/src/domains/users/handlers.rs (lines 151-161)
pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/me", get(get_my_profile).patch(update_my_profile))
        .route("/me/activities", get(get_my_activities))
        .route("/me/stats", get(get_my_stats))
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/{user_id}", get(get_user_profile))
        .merge(protected_routes)
}
```

**새 라우트 추가 위치:** `.route("/me/tries", get(get_my_tries))` 와 `.route("/me/saved", get(get_my_saved))` 를 protected_routes에 추가.

### Existing Pattern: Pagination Handler

```rust
// Source: packages/api-server/src/domains/users/handlers.rs (lines 96-127)
#[utoipa::path(
    get,
    path = "/api/v1/users/me/activities",
    tag = "users",
    security(("bearer_auth" = [])),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 100)")
    ),
    responses(
        (status = 200, description = "...", body = PaginatedResponse<UserActivityItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_activities(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(params): Query<UserActivitiesQuery>,  // Pagination #[serde(flatten)]
) -> AppResult<Json<PaginatedResponse<UserActivityItem>>> {
    ...
}
```

**TRIES-01 / SAVED-01은 이 패턴을 그대로 따른다.**

### Existing Pattern: PaginatedResponse 구조체

```rust
// Source: packages/api-server/src/utils/pagination.rs
pub struct Pagination {
    #[serde(default = "default_page")] pub page: u64,      // 기본 1
    #[serde(default = "default_per_page")] pub per_page: u64, // 기본 20
}

pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

pub struct PaginationMeta {
    pub current_page: u64,
    pub per_page: u64,
    pub total_items: u64,  // NOTE: "total_items" NOT "total_count"
    pub total_pages: u64,
}
```

**주의:** CONTEXT.md는 `total_count`라고 명시했지만 실제 코드의 필드명은 `total_items`이다. 기존 코드 필드명(`total_items`)을 따라야 한다. Orval이 생성할 TypeScript 타입도 `total_items`가 된다.

현재 `Pagination::new()`의 per_page clamp 상한은 100이다. CONTEXT.md는 최대 50으로 명시. 서비스 함수 내에서 `pagination.per_page.min(50)`으로 제한하거나, 별도 파라미터 구조체에서 검증.

### Pattern: raw SQL for JOIN Query (Phase 46 방식)

```rust
// Source: packages/api-server/src/domains/users/service.rs (lines 88-100)
let result = db
    .query_one(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT COUNT(*)::BIGINT AS cnt FROM public.user_follows WHERE following_id = $1",
        [user_id.into()],
    ))
    .await
    .map_err(AppError::DatabaseError)?;
```

**saved 리스트의 COUNT와 SELECT에 이 패턴 사용.** `query_all` + `query_one`으로 각각 data fetch와 total_items COUNT를 수행.

### Pattern: OpenAPI spec 업데이트 (Phase 47 방식)

```bash
# Phase 47 확립된 패턴
python3 -c "
import json, sys
with open('packages/api-server/openapi.json') as f: spec = json.load(f)
# ... spec 수정 ...
with open('packages/api-server/openapi.json', 'w') as f:
    json.dump(spec, f, separators=(',', ':'))
"
cd packages/web && bun run generate:api
```

### Recommended Structure for New Code

**새로 추가할 파일/수정:**

```
packages/api-server/src/
├── entities/
│   └── user_tryon_history.rs    # NEW — user_tryon_history SeaORM 엔티티
│   └── mod.rs                   # MODIFY — pub mod user_tryon_history 추가
├── domains/
│   ├── users/
│   │   ├── handlers.rs          # MODIFY — get_my_tries, get_my_saved 핸들러 추가
│   │   ├── service.rs           # MODIFY — list_my_tries, list_my_saved 서비스 함수 추가
│   │   └── dto.rs               # MODIFY — TryItem, TryListQuery, SavedItem, SavedListQuery DTO 추가
│   └── saved_posts/
│       └── service.rs           # MODIFY — list_saved_posts 함수 추가 (또는 users/service.rs에 직접)
├── openapi.rs                   # MODIFY — paths + schemas 섹션에 새 핸들러/DTO 등록
migration/sql/
└── 05_user_tryon_history.sql    # NEW (if table doesn't exist in Supabase)
packages/api-server/openapi.json # MODIFY — python3으로 새 paths/components 추가
packages/web/
└── lib/api/generated/           # AUTO-GENERATED by bun run generate:api
```

### Anti-Patterns to Avoid

- **`:param` 라우트 파라미터 사용:** Axum v0.7은 `{param}` 형식만 지원. AGENT.md Rule 2.3
- **`unwrap()` / `panic!()` 사용:** AGENT.md Rule 5 — `?` 연산자 + `AppError` 사용
- **utoipa 재귀 타입 미처리:** AGENT.md Rule 2.2 — `#[schema(no_recursion)]` 필요 시 추가
- **`PaginatedResponse<T>`에 T가 `ToSchema`를 derive하지 않음:** utoipa 컴파일 에러 발생
- **openapi.json을 직접 문자열 편집:** minified JSON이므로 반드시 python3 json.load/dump 사용
- **generated 파일 수동 편집:** `packages/web/lib/api/generated/` 는 절대 직접 수정 금지

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 페이지네이션 계산 | 커스텀 offset/limit/total_pages 계산 | `Pagination` + `PaginatedResponse::new()` | 이미 구현됨, 테스트도 있음 |
| JSON 시리얼라이제이션 | 커스텀 serializer | `serde::Serialize` + `utoipa::ToSchema` | 프로젝트 표준 derive 패턴 |
| 인증 미들웨어 | 직접 토큰 파싱 | `Extension(user): Extension<User>` + `route_layer(auth_middleware)` | 기존 패턴 그대로 |
| OpenAPI 스키마 등록 | 수동 JSON 작성 | `openapi.rs` components/schemas에 DTO 추가 | utoipa 자동 생성 |

---

## Common Pitfalls

### Pitfall 1: `user_tryon_history` 테이블 미존재
**What goes wrong:** SeaORM 엔티티는 만들었지만 실제 DB 테이블이 없으면 런타임 에러
**Why it happens:** 테이블이 AI 서버 측에서만 사용되거나 아직 미생성일 수 있음
**How to avoid:** Supabase Dashboard에서 테이블 존재 여부 확인 후 진행. 없으면 `migration/sql/05_user_tryon_history.sql` 생성하고 실행 지침 문서화.
**Warning signs:** `relation "public.user_tryon_history" does not exist` 런타임 에러

### Pitfall 2: `PaginationMeta.total_count` vs `total_items` 불일치
**What goes wrong:** CONTEXT.md는 `total_count`라고 했지만 실제 코드는 `total_items`
**Why it happens:** CONTEXT는 기대 스펙, 코드는 실제 구현
**How to avoid:** 기존 `PaginationMeta` 구조체 수정하지 말고 그대로 사용. `total_items` 필드명이 Orval이 생성하는 TypeScript 타입이 된다.

### Pitfall 3: `per_page` 최대값 clamp 위치
**What goes wrong:** 기존 `Pagination::new()`은 최대 100, CONTEXT는 최대 50 요구
**Why it happens:** 공통 유틸리티를 변경하면 다른 엔드포인트에 영향
**How to avoid:** 공통 `Pagination` 구조체 변경 금지. 서비스 함수 내에서 `pagination.per_page.min(50)` 적용하거나, 쿼리 파라미터 DTO에서 별도 검증.

### Pitfall 4: `openapi.json` 업데이트 순서
**What goes wrong:** openapi.rs (Rust)와 openapi.json (실제 파일) 두 곳을 모두 업데이트해야 함
**Why it happens:** utoipa는 Rust 컴파일 시 스키마를 생성하지만 openapi.json 파일은 별도로 관리됨
**How to avoid:** (1) openapi.rs에 paths/schemas 등록 → (2) `cargo run -- --dump-openapi` 또는 python3으로 openapi.json 업데이트 → (3) `bun run generate:api` 순서 준수.

### Pitfall 5: SeaORM `QuerySelect` + `PaginatorTrait` 임포트 누락
**What goes wrong:** `.paginate()` 또는 `.count()` 메서드가 없다는 컴파일 에러
**Why it happens:** SeaORM trait들은 명시적 import 필요
**How to avoid:** `use sea_orm::{EntityTrait, QueryFilter, QueryOrder, QuerySelect, PaginatorTrait};` 명시적으로 임포트.

### Pitfall 6: `ConnectionTrait` 누락
**What goes wrong:** `db.query_one()` / `db.query_all()` 메서드 없음
**Why it happens:** Phase 46에서 이미 발생한 문제 (STATE.md 기록)
**How to avoid:** `use sea_orm::ConnectionTrait;` 명시적 임포트.

---

## Code Examples

### New Handler Pattern (TRIES-01 / SAVED-01)

```rust
// Source: pattern from packages/api-server/src/domains/users/handlers.rs
/// GET /api/v1/users/me/tries
#[utoipa::path(
    get,
    path = "/api/v1/users/me/tries",
    tag = "users",
    security(("bearer_auth" = [])),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 50)")
    ),
    responses(
        (status = 200, description = "VTON 히스토리 조회 성공", body = PaginatedResponse<TryItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_tries(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<TryItem>>> {
    let result = service::list_my_tries(&state.db, user.id, pagination).await?;
    Ok(Json(result))
}
```

### DTO Pattern (TryItem)

```rust
// Based on existing DTO patterns in users/dto.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TryItem {
    pub id: Uuid,
    pub image_url: String,
    pub created_at: DateTime<Utc>,
}
```

### SavedItem DTO (with JOIN fields)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SavedItem {
    pub id: Uuid,
    pub post_id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_thumbnail_url: Option<String>,
    pub saved_at: DateTime<Utc>,
}
```

### Service Function Pattern (raw SQL for saved)

```rust
// Based on pattern from packages/api-server/src/domains/users/service.rs (count_followers)
pub async fn list_my_saved(
    db: &DatabaseConnection,
    user_id: Uuid,
    pagination: Pagination,
) -> AppResult<PaginatedResponse<SavedItem>> {
    let offset = pagination.offset();
    let limit = pagination.per_page.min(50);

    let rows = db.query_all(Statement::from_sql_and_values(
        DbBackend::Postgres,
        r#"
        SELECT sp.id, sp.post_id, p.title as post_title, p.image_url as post_thumbnail_url,
               sp.created_at as saved_at
        FROM public.saved_posts sp
        JOIN public.posts p ON sp.post_id = p.id
        WHERE sp.user_id = $1
        ORDER BY sp.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        [user_id.into(), limit.into(), offset.into()],
    )).await.map_err(AppError::DatabaseError)?;

    let total_row = db.query_one(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT COUNT(*)::BIGINT AS cnt FROM public.saved_posts WHERE user_id = $1",
        [user_id.into()],
    )).await.map_err(AppError::DatabaseError)?;

    let total_items = total_row
        .map(|r| r.try_get::<i64>("", "cnt").unwrap_or(0))
        .unwrap_or(0) as u64;

    let items: Vec<SavedItem> = rows.iter().map(|row| SavedItem {
        id: row.try_get("", "id").unwrap_or_default(),
        post_id: row.try_get("", "post_id").unwrap_or_default(),
        post_title: row.try_get("", "post_title").ok(),
        post_thumbnail_url: row.try_get("", "post_thumbnail_url").ok(),
        saved_at: row.try_get::<chrono::DateTime<chrono::Utc>>("", "saved_at")
            .unwrap_or_default(),
    }).collect();

    Ok(PaginatedResponse::new(items, Pagination { page: pagination.page, per_page: limit }, total_items))
}
```

### Migration DDL Pattern (user_tryon_history — if needed)

```sql
-- Source: pattern from packages/api-server/migration/sql/04_user_follows.sql
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

CREATE TABLE IF NOT EXISTS public.user_tryon_history (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_tryon_history_user_id
    ON public.user_tryon_history (user_id);

ALTER TABLE public.user_tryon_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tryon_history_select_own"
    ON public.user_tryon_history
    FOR SELECT
    USING (auth.uid() = user_id);
```

**주의:** AGENT.md Rule 2.1 — 마이그레이션에서 INSERT 시 `gen_random_uuid()` 명시. SELECT에서는 DEFAULT로도 가능하지만 일관성을 위해 명시.

### openapi.rs 등록 패턴

```rust
// openapi.rs paths 섹션에 추가:
crate::domains::users::handlers::get_my_tries,
crate::domains::users::handlers::get_my_saved,

// openapi.rs components/schemas 섹션에 추가:
crate::domains::users::dto::TryItem,
crate::domains::users::dto::SavedItem,
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Phase 46 이전: raw SQL 없이 SeaORM만 사용 | Phase 46+: raw SQL + SeaORM 혼용 | JOIN/COUNT 쿼리에 raw SQL이 더 간결 |
| openapi.json 직접 수정 | python3 json.load/dump (Phase 47 패턴) | minified JSON 안전 편집 |
| Orval 수동 타입 작성 | `bun run generate:api` 자동 생성 | Phase 39+ 표준 파이프라인 |

---

## Open Questions

1. **`user_tryon_history` 테이블 실제 스키마**
   - What we know: 코드베이스 어디에도 이 테이블 참조 없음. 엔티티 파일 없음.
   - What's unclear: (a) Supabase에 이미 테이블이 존재하는지, (b) 컬럼명이 `image_url`인지 `result_image_url`인지 (REQUIREMENTS.md TRIES-03에서 `result_image_url → image_url` 타입 수정 언급)
   - Recommendation: Phase 48 실행 시작 전 Supabase Dashboard 또는 직접 DB 쿼리로 스키마 확인. 없으면 `05_user_tryon_history.sql` 생성.

2. **saved endpoint의 도메인 위치**
   - What we know: CONTEXT.md는 "기존 saved_posts 엔티티/서비스 활용"이라고 명시. handlers.rs는 saved_posts 도메인에 있음.
   - What's unclear: list 함수를 saved_posts/service.rs에 추가할지 vs users/service.rs에서 직접 처리할지.
   - Recommendation: users/service.rs에서 직접 raw SQL 처리가 더 간결. saved_posts 도메인은 write 액션 전용으로 유지. (CONTEXT.md 허용 범위 내)

---

## Validation Architecture

> `workflow.nyquist_validation` 키가 config.json에 없으므로 비활성화로 간주. 단, AGENT.md Rule 7 (TDD)은 여전히 적용.

### Phase Requirements → Verification Map

| Req ID | Behavior | Test Type | Verification Command |
|--------|----------|-----------|---------------------|
| TRIES-01 | GET /api/v1/users/me/tries 엔드포인트 존재 + 페이지네이션 | cargo check | `cd packages/api-server && cargo check` |
| TRIES-02 | OpenAPI spec 반영 + Orval hook 생성 | 파일 존재 확인 | `ls packages/web/lib/api/generated/users/` |
| SAVED-01 | GET /api/v1/users/me/saved 엔드포인트 존재 + 페이지네이션 | cargo check | `cd packages/api-server && cargo check` |
| SAVED-02 | OpenAPI spec 반영 + Orval hook 생성 | 파일 존재 확인 | `ls packages/web/lib/api/generated/users/` |

**Pre-commit checklist (AGENT.md Rule 1):**
1. `cargo fmt --check` (실패 시 `cargo fmt`)
2. `cargo check`
3. `find src -name "*.rs" | xargs wc -l | tail -1` → README.md 통계 업데이트
4. `cd packages/web && bun run generate:api` → TypeScript 컴파일 확인

---

## Sources

### Primary (HIGH confidence)
- `packages/api-server/src/domains/users/handlers.rs` — 핸들러 패턴, 라우터 구조, utoipa 어노테이션
- `packages/api-server/src/utils/pagination.rs` — `Pagination`, `PaginatedResponse`, `PaginationMeta` 실제 구조
- `packages/api-server/src/domains/users/service.rs` — raw SQL 패턴, 팔로우 카운트 방식
- `packages/api-server/src/domains/saved_posts/service.rs` — 기존 save/unsave 서비스
- `packages/api-server/src/entities/saved_posts.rs` — saved_posts 엔티티 스키마
- `packages/api-server/src/openapi.rs` — openapi.rs 등록 패턴 전체
- `packages/api-server/AGENT.md` — 코딩 규칙
- `.planning/phases/47-follow-system-frontend/47-01-SUMMARY.md` — openapi.json python3 업데이트 패턴

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 46 `ConnectionTrait` 임포트 필요 이슈 기록
- `.planning/REQUIREMENTS.md` — TRIES-01..SAVED-02 요건 정의

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 모두 기존 프로젝트 코드에서 직접 확인
- Architecture: HIGH — users/handlers.rs, service.rs 패턴 직접 분석
- Pitfalls: HIGH — AGENT.md 규칙 + STATE.md 이전 이슈 + 코드 분석 기반
- user_tryon_history 테이블 실제 존재 여부: LOW — DB에 직접 접근하지 않음

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable stack, no fast-moving dependencies)
