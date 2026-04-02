# Phase 46: Follow System Backend - Research

**Researched:** 2026-03-26
**Domain:** Rust/Axum backend — Supabase SQL migration, SeaORM raw query, utoipa schema extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `user_follows` 테이블: `follower_id UUID REFERENCES auth.users(id)`, `following_id UUID REFERENCES auth.users(id)`, `created_at TIMESTAMPTZ DEFAULT now()`
- Primary key: `(follower_id, following_id)` — 복합 PK로 중복 팔로우 방지
- 인덱스: `follower_id`와 `following_id` 각각 별도 인덱스
- RLS: `SELECT` 전체 공개 (모든 유저가 count 조회 가능)
- 별도 count endpoint 생성하지 않음 — `UserResponse`에 `followers_count: i64`와 `following_count: i64` 필드 추가
- count는 SQL COUNT 서브쿼리로 실시간 계산 (캐싱 불필요)
- `get_user_profile`과 `get_my_profile` 핸들러에서 count 포함
- `UserResponse` 스키마에 utoipa `#[schema]` 어노테이션 업데이트

### Claude's Discretion
- SQL 마이그레이션 파일 번호/위치
- SeaORM entity 생성 여부 (단순 count 쿼리면 raw SQL 충분)
- 서비스 레이어 함수 시그니처

### Deferred Ideas (OUT OF SCOPE)
- Follow/unfollow write API (POST/DELETE) — v10.1 FLLW-W01
- 팔로워/팔로잉 목록 페이지 — 별도 마일스톤
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLLW-01 | Supabase `user_follows` 테이블 생성 (마이그레이션 SQL) | SQL migration pattern in `migration/sql/`, RLS pattern from `02_rls_policy_users.sql` |
| FLLW-02 | Rust 백엔드 Follow API 구현 — count 필드를 UserResponse에 포함 | `service.rs` `get_user_by_id` 확장 패턴, `sea_orm::Statement` raw SQL query |
| FLLW-03 | `UserResponse`에 `followers_count`/`following_count` 필드 추가 | `dto.rs` struct 확장, `From<UserModel>` impl 수정 필요 |
</phase_requirements>

---

## Summary

Phase 46은 `user_follows` Supabase 테이블 생성과 기존 `UserResponse` DTO에 팔로워/팔로잉 count 필드를 추가하는 순수 백엔드 작업이다. 프론트엔드 연결(FLLW-04/05)은 Phase 47로 분리되어 있다.

핵심 패턴은 이미 확립되어 있다. SQL 마이그레이션은 `migration/sql/` 디렉토리에 번호 접두사 파일로 추가한다. `UserResponse`는 `From<UserModel>` impl을 사용하는데, count 값은 `UserModel`에 없으므로 서비스 레이어에서 `UserResponse`를 직접 생성하는 방식으로 전환해야 한다. count 쿼리는 SeaORM raw SQL(`Statement::from_sql_and_values`)로 처리하는 것이 SeaORM entity를 새로 만드는 것보다 단순하다.

**Primary recommendation:** `service.rs`에 `get_user_with_follow_counts(db, user_id) -> AppResult<UserResponse>` 함수를 추가하여 단일 SQL 쿼리(서브쿼리 2개)로 user + counts를 한 번에 조회한다. handlers에서 기존 `service::get_user_by_id(...).into()` 패턴을 이 새 함수로 교체한다.

---

## Standard Stack

### Core (already in Cargo.toml)
| Library | Purpose | Notes |
|---------|---------|-------|
| `sea-orm` | DB query — raw SQL via `Statement::from_sql_and_values` | No new entity needed for simple COUNT |
| `utoipa` | OpenAPI schema — `#[schema]` on UserResponse fields | Pattern already used in `dto.rs` |
| `serde` | Serialization — existing `#[derive(Serialize, Deserialize)]` | No changes needed |

No new dependencies required for this phase.

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
packages/api-server/
├── migration/sql/
│   └── 04_user_follows.sql          # NEW: table + indexes + RLS
├── src/domains/users/
│   ├── dto.rs                       # MODIFY: add followers_count/following_count to UserResponse
│   ├── service.rs                   # MODIFY: add get_user_with_follow_counts fn
│   ├── handlers.rs                  # MODIFY: use new service fn in get_user_profile + get_my_profile
│   └── tests.rs                     # MODIFY: add tests for new UserResponse fields + service fn
└── src/openapi.rs                   # NO CHANGE: UserResponse already registered, schema auto-reflects
```

### Pattern 1: SQL Migration File

Migration files are numbered SQL files in `migration/sql/`. The next number is `04`. Files are applied manually via Supabase Dashboard SQL Editor (not run by the Rust process at startup).

```sql
-- migration/sql/04_user_follows.sql

-- 1. Table
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

-- 2. Indexes for COUNT query performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id  ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows (following_id);

-- 3. RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_select_public"
    ON public.user_follows
    FOR SELECT
    USING (true);
```

**Key notes:**
- References `auth.users(id)` (not `public.users(id)`) — consistent with Supabase pattern
- `ON DELETE CASCADE` — following record removed if either user deleted
- No INSERT/UPDATE/DELETE policies needed in this phase (read-only scope)
- RLS `USING (true)` mirrors pattern in `02_rls_policy_users.sql`

### Pattern 2: UserResponse Extension

The current `UserResponse` uses `From<UserModel>` which maps all fields from the SeaORM entity. The new `followers_count` and `following_count` fields cannot come from `UserModel` (they require DB aggregation). Two valid approaches:

**Approach A — New service function returning UserResponse directly (RECOMMENDED)**

Build a new service function that queries both user data and counts in one go, constructing `UserResponse` manually. The existing `From<UserModel>` impl stays for non-count use cases.

```rust
// service.rs — Source: project pattern analysis
pub async fn get_user_with_follow_counts(
    db: &DatabaseConnection,
    user_id: Uuid,
) -> AppResult<UserResponse> {
    let user = get_user_by_id(db, user_id).await?;

    let followers_count = count_followers(db, user_id).await?;
    let following_count = count_following(db, user_id).await?;

    Ok(UserResponse {
        followers_count,
        following_count,
        ..UserResponse::from(user)
    })
}

async fn count_followers(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    use sea_orm::Statement;
    use sea_orm::DbBackend;

    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT FROM public.user_follows WHERE following_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "count").unwrap_or(0))
        .unwrap_or(0))
}

async fn count_following(db: &DatabaseConnection, user_id: Uuid) -> AppResult<i64> {
    use sea_orm::Statement;
    use sea_orm::DbBackend;

    let result = db
        .query_one(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT COUNT(*)::BIGINT FROM public.user_follows WHERE follower_id = $1",
            [user_id.into()],
        ))
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result
        .map(|row| row.try_get::<i64>("", "count").unwrap_or(0))
        .unwrap_or(0))
}
```

**Approach B — Single combined query (alternative, slightly more complex)**

```sql
SELECT
    (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) AS followers_count,
    (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) AS following_count
```

Approach A (two separate queries) is simpler to test and maintain. Both queries use indexed columns so performance is equivalent.

### Pattern 3: UserResponse DTO Extension

```rust
// dto.rs — extend existing struct
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,
    pub rank: String,
    pub total_points: i32,
    pub is_admin: bool,
    // NEW FIELDS
    pub followers_count: i64,
    pub following_count: i64,
}
```

The `From<UserModel>` impl must be updated to include the new fields with default values (0), since `UserModel` does not have them:

```rust
impl From<UserModel> for UserResponse {
    fn from(user: UserModel) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            rank: user.rank,
            total_points: user.total_points,
            is_admin: user.is_admin,
            followers_count: 0,  // caller must populate via get_user_with_follow_counts
            following_count: 0,  // caller must populate via get_user_with_follow_counts
        }
    }
}
```

### Pattern 4: Handler Update

Replace `service::get_user_by_id(&state.db, user_id).await?` + `.into()` with the new service function in both handlers:

```rust
// handlers.rs — get_user_profile
pub async fn get_user_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> AppResult<Json<UserResponse>> {
    let user = service::get_user_with_follow_counts(&state.db, user_id).await?;
    Ok(Json(user))
}

// handlers.rs — get_my_profile
pub async fn get_my_profile(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> AppResult<Json<UserResponse>> {
    let user = service::get_user_with_follow_counts(&state.db, user.id).await?;
    Ok(Json(user))
}
```

`update_my_profile` returns the updated `UserModel` and currently calls `.into()`. It should also return counts. Options:
1. Call `get_user_with_follow_counts` after update (extra query but consistent)
2. Keep returning zero counts from `From<UserModel>` for PATCH (acceptable since profile update doesn't change follows)

Option 1 is cleaner for API consistency.

### Anti-Patterns to Avoid

- **Do not create a SeaORM entity for `user_follows`** — only COUNT queries are needed; a full entity/relation adds complexity with no benefit in this phase
- **Do not add `followers_count`/`following_count` to `UserModel`** — `UserModel` is a SeaORM entity mapped to the `users` table; adding computed fields there breaks the ORM mapping
- **Do not use `unwrap()` on `try_get`** — use `unwrap_or(0)` as shown, consistent with AGENT.md error rules
- **Do not use `:param` route syntax** — Axum v0.7 requires `{param}` format (AGENT.md rule 2.3)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aggregate COUNT query | Custom SQL builder | `Statement::from_sql_and_values` (SeaORM) | Already in project, type-safe value binding |
| Schema documentation | Manual OpenAPI JSON edits | `#[schema(description = "...")]` utoipa annotation | Schema auto-generated via `openapi.rs` components list |

**Key insight:** `UserResponse` is already registered in `openapi.rs` components. No changes to `openapi.rs` are needed — utoipa reflects struct fields automatically once `UserResponse` is modified.

---

## Common Pitfalls

### Pitfall 1: COUNT Returns NULL on Empty Table
**What goes wrong:** `COUNT(*)` on a table with no matching rows returns `0`, not NULL, in PostgreSQL — this is correct. However `try_get::<i64>` on the result row column must use the correct column alias.
**Why it happens:** PostgreSQL names the column `count` by default when using `COUNT(*)` without alias.
**How to avoid:** Use `row.try_get::<i64>("", "count")` — empty string prefix for no table alias, "count" for column name. Or use explicit `AS followers_count` alias and match in `try_get`.
**Warning signs:** Compile error on `try_get` type mismatch, or runtime `0` counts when rows exist.

### Pitfall 2: `From<UserModel>` Usage in Existing Code
**What goes wrong:** Adding `followers_count`/`following_count` to `UserResponse` breaks every `UserModel.into()` call unless `From<UserModel>` is updated with default zero values.
**Why it happens:** `From<UserModel>` is the canonical conversion and is used in `update_my_profile` handler. The compiler will catch this (missing struct fields), but it's important to set defaults to 0 not Option.
**How to avoid:** Update `From<UserModel>` immediately when modifying the struct. Run `cargo check` to catch all usage sites.
**Warning signs:** `cargo check` error "missing fields `followers_count`, `following_count` in initializer".

### Pitfall 3: openapi.rs Schema Registration
**What goes wrong:** Assuming `openapi.rs` needs to be updated when `UserResponse` fields change.
**Why it happens:** `UserResponse` is already in the `components(schemas(...))` list. utoipa derives the schema from the struct at compile time — field additions are automatically reflected.
**How to avoid:** Do NOT add new schema entries for `UserResponse`. Only new structs/enums need to be added to `openapi.rs`.
**Warning signs:** None — this is a non-issue, documented to prevent unnecessary edits.

### Pitfall 4: RLS Blocks Rust Backend Queries
**What goes wrong:** The Rust backend uses a service-role Supabase connection (bypasses RLS), but it's worth confirming.
**Why it happens:** If the backend uses `anon` key instead of `service_role` key, RLS policies apply.
**How to avoid:** Verify `AppState.db` connection uses service-role credentials. The `SELECT` public RLS policy means this is safe either way for read-only count queries.
**Warning signs:** Empty count results even when `user_follows` has rows.

### Pitfall 5: Migration File Ordering
**What goes wrong:** Next migration file must be `04_user_follows.sql` — gaps in numbering cause confusion.
**Why it happens:** Current files are `01`, `02`, `03`. New file should be `04`.
**How to avoid:** Check existing files before naming: current max is `03_rls_policy_posts.sql`.

---

## Code Examples

### SeaORM Raw Query (COUNT)
```rust
// Source: SeaORM documentation pattern, verified against project usage
use sea_orm::{DatabaseConnection, DbBackend, Statement};

let result = db
    .query_one(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT COUNT(*)::BIGINT AS cnt FROM public.user_follows WHERE following_id = $1",
        [user_id.into()],
    ))
    .await
    .map_err(AppError::DatabaseError)?;

let count: i64 = result
    .map(|row| row.try_get::<i64>("", "cnt").unwrap_or(0))
    .unwrap_or(0);
```

### Struct Update Syntax with Default Fields
```rust
// Source: Rust language feature — struct update syntax
Ok(UserResponse {
    followers_count,
    following_count,
    ..UserResponse::from(user)  // fills remaining fields from UserModel
})
```

### SQL COUNT with CAST
```sql
-- PostgreSQL COUNT(*) returns BIGINT when cast explicitly
-- Matches Rust i64 type in try_get
SELECT COUNT(*)::BIGINT FROM public.user_follows WHERE following_id = $1;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Separate count endpoints (`/followers/count`) | Count embedded in `UserResponse` | Fewer API calls from client, simpler frontend |
| SeaORM entity per junction table | Raw SQL for aggregate-only tables | Less boilerplate for read-only aggregate queries |

---

## Open Questions

1. **`update_my_profile` return value consistency**
   - What we know: Currently returns `UserModel.into()` which will have `followers_count: 0`
   - What's unclear: Whether PATCH `/users/me` should return accurate counts
   - Recommendation: Call `get_user_with_follow_counts` after update for API consistency. If performance is a concern, the CONTEXT.md says "캐싱 불필요" for count queries — two extra queries on PATCH is acceptable.

2. **Table reference: `auth.users` vs `public.users`**
   - What we know: CONTEXT.md specifies `REFERENCES auth.users(id)`. Existing `saved_posts` entity uses `public.users`. The trigger in `01_auth_trigger_handle_new_user.sql` creates `public.users` entries on `auth.users` insert.
   - What's unclear: Whether Supabase requires `auth.users` or `public.users` as FK target for junction tables.
   - Recommendation: Use `auth.users(id)` per CONTEXT.md decision. This is the Supabase-recommended pattern for user-owned tables since `public.users` rows are guaranteed to exist via the trigger.

---

## Validation Architecture

The project uses Rust's built-in `cargo test` framework. No separate test config file exists. The `nyquist_validation` key is absent from `.planning/config.json` — validation is enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `cargo test` (built-in Rust) |
| Config file | none — test blocks in `.rs` files |
| Quick run command | `cd packages/api-server && cargo test users` |
| Full suite command | `cd packages/api-server && cargo test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| FLLW-01 | `user_follows` table SQL is syntactically valid | Manual (Supabase) | n/a — SQL applied to Supabase Dashboard | SQL migration cannot be unit tested without live DB |
| FLLW-02 | `count_followers` returns correct i64 | Unit (struct) | `cargo test users::tests` | DB call is mocked via `#[ignore]` pattern; test logic for count parsing |
| FLLW-03 | `UserResponse` JSON includes `followers_count`/`following_count` fields | Unit | `cargo test users::dto::tests` | JSON roundtrip test in `dto.rs` module |

### Sampling Rate
- **Per task commit:** `cd packages/api-server && cargo check`
- **Per wave merge:** `cd packages/api-server && cargo test`
- **Phase gate:** `cargo fmt --check && cargo check && cargo test` — all pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/domains/users/dto.rs` test block — add `user_response_includes_follow_counts` test
- [ ] `src/domains/users/service.rs` — add unit test for `count_followers`/`count_following` logic (DB call ignored, test count parsing)

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `packages/api-server/src/domains/users/dto.rs` — UserResponse struct definition
- Direct code inspection: `packages/api-server/src/domains/users/service.rs` — service layer patterns
- Direct code inspection: `packages/api-server/src/domains/users/handlers.rs` — handler patterns, Axum v0.7
- Direct code inspection: `packages/api-server/migration/sql/02_rls_policy_users.sql` — RLS `USING (true)` pattern
- Direct code inspection: `packages/api-server/migration/sql/01_auth_trigger_handle_new_user.sql` — `auth.users` reference pattern
- Direct code inspection: `packages/api-server/AGENT.md` — project coding rules
- Direct code inspection: `packages/api-server/src/openapi.rs` — utoipa schema registration pattern

### Secondary (MEDIUM confidence)
- SeaORM `Statement::from_sql_and_values` — standard pattern for raw queries, consistent with SeaORM v0.x docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — migration pattern, DTO extension, service layer all have clear precedents in codebase
- Pitfalls: HIGH — `From<UserModel>` breaking change is compiler-verified, RLS pattern is project-standard

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable domain — Rust, SeaORM, utoipa patterns don't change rapidly)
