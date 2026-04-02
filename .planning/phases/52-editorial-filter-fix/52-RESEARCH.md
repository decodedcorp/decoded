# Phase 52: Editorial Filter Fix - Research

**Researched:** 2026-04-01
**Domain:** Frontend Supabase query filtering + Rust/utoipa OpenAPI spec parameter declaration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Filter column**: `post_magazine_id IS NOT NULL` — NOT `post_magazine_title` (not a DB column)
- **Supabase filter code**: `.not("post_magazine_id", "is", null)` applied only when `hasMagazine === true`
- **Insertion point**: `useImages.ts` line 204, the existing `// Note: hasMagazine filter not yet supported via Supabase query` comment
- **Backend approach**: Add `has_magazine` to `#[utoipa::path]` params in `handlers.rs`, then regenerate `openapi.json` via `cargo run --bin generate-openapi` (or equivalent), then run `bun run generate:api`
- **Scope**: `/explore` unaffected — `hasMagazine` defaults to `false`
- **Supabase list stays**: No REST migration for the list query (Out of Scope per REQUIREMENTS.md)

### Claude's Discretion
- Rust handler exact parameter binding syntax for `has_magazine` in `#[utoipa::path]` params
- Orval regeneration verification steps
- Supabase query builder chaining order

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | hasMagazine 필터가 Supabase 쿼리에서 실제로 동작하여 Editorial 페이지에 매거진 post만 표시 | `useInfinitePosts` already has `hasMagazine` param + query key; only the filter line (`.not("post_magazine_id", "is", null)`) is missing. One-line fix. |
| FILT-02 | OpenAPI spec에 has_magazine 파라미터 추가 및 Orval 재생성으로 타입 안전한 필터링 | `PostListQuery` in dto.rs already has `has_magazine: Option<bool>`. `service.rs` already applies the filter. Only the `#[utoipa::path]` params annotation in `handlers.rs` is missing the parameter declaration. Adding it and regenerating openapi.json + running `bun run generate:api` produces the TypeScript type. |
</phase_requirements>

## Summary

Phase 52 is a surgical two-file fix across the frontend and backend. The implementation is mostly already done — both sides are partially complete but disconnected.

**Frontend (FILT-01):** `useInfinitePosts` in `packages/web/lib/hooks/useImages.ts` already accepts `hasMagazine` as a parameter and includes it in the React Query cache key. The filter is explicitly stubbed out with a comment at line 204: `// Note: hasMagazine filter not yet supported via Supabase query`. Adding `.not("post_magazine_id", "is", null)` when `hasMagazine === true` is the only change needed. `ExploreClient` already passes `hasMagazine` to the hook. `editorial/page.tsx` already passes `<ExploreClient hasMagazine />`.

**Backend (FILT-02):** `PostListQuery` in `dto.rs` already has `has_magazine: Option<bool>` at line 180. The service layer (`service.rs` lines 562-565) already applies `Column::PostMagazineId.is_not_null()` when `has_magazine == Some(true)`. The ONLY gap is that the `#[utoipa::path]` annotation in `handlers.rs` (lines 196-222) does not list `has_magazine` in its `params(...)` macro call — so utoipa does not include it when generating `openapi.json`. Once added to the annotation and openapi.json is regenerated, `bun run generate:api` will update `ListPostsParams` in the TypeScript generated types.

**Primary recommendation:** Add one `if` block in `useImages.ts` and add one param entry to the `#[utoipa::path]` macro in `handlers.rs`, then regenerate both openapi.json and the TypeScript types.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | (project version) | Supabase query builder | Project-standard browser client; `supabaseBrowserClient` already in use in `useImages.ts` |
| utoipa | (Rust project version) | OpenAPI spec generation from Rust annotations | Project-standard; all existing endpoints use it |
| Orval | 8.5.3 | TypeScript types + React Query hooks from OpenAPI spec | Confirmed in `orval.config.ts` |
| vitest | ^4.1.1 | Unit test framework for `packages/web` | Confirmed in `vitest.config.ts` + `package.json` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query `useInfiniteQuery` | (project version) | Infinite scroll data fetching | Already used in `useInfinitePosts` — no changes to query structure |

### Installation
No new packages required — all dependencies already exist in the project.

## Architecture Patterns

### Recommended Project Structure
No structural changes. All edits are within existing files:
```
packages/
├── web/lib/hooks/useImages.ts           # FILT-01: add .not() filter
├── api-server/src/domains/posts/
│   └── handlers.rs                      # FILT-02: add utoipa param
├── api-server/openapi.json              # regenerated (not hand-edited)
└── web/lib/api/generated/               # regenerated by bun run generate:api
    └── models/listPostsParams.ts        # gains has_magazine?: boolean
```

### Pattern 1: Supabase `.not()` Query Filter
**What:** Chain a `.not()` condition onto an existing Supabase query builder
**When to use:** When a column must be non-null (presence filter)
**Example:**
```typescript
// Source: packages/web/lib/hooks/useImages.ts (existing .not() usage pattern at line 193)
// Existing pattern:
let query = supabaseBrowserClient
  .from("posts")
  .select("*", { count: "exact" })
  .eq("status", "active")
  .not("image_url", "is", null);   // existing filter — same pattern

// New addition (FILT-01):
if (hasMagazine) {
  query = query.not("post_magazine_id", "is", null);
}
```

The `.not("col", "is", null)` is already established in this exact file for the `image_url` filter — the `hasMagazine` filter is structurally identical.

### Pattern 2: utoipa `#[utoipa::path]` Query Parameter Declaration
**What:** Add a boolean query parameter to an existing utoipa endpoint annotation
**When to use:** When a new field is added to a `Query<Struct>` extractor and must appear in the generated OpenAPI spec
**Example:**
```rust
// Source: packages/api-server/src/domains/posts/handlers.rs
// Current params() block (lines 202-210):
#[utoipa::path(
    get,
    path = "/api/v1/posts",
    tag = "posts",
    params(
        ("artist_name" = Option<String>, Query, description = "아티스트명 필터"),
        ("group_name" = Option<String>, Query, description = "그룹명 필터"),
        ("context" = Option<String>, Query, description = "상황 필터"),
        ("category" = Option<String>, Query, description = "카테고리 필터 (Phase 7)"),
        ("user_id" = Option<Uuid>, Query, description = "사용자 ID 필터"),
        ("sort" = Option<String>, Query, description = "정렬: recent | popular | trending"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수")
        // ADD:
        // ("has_magazine" = Option<bool>, Query, description = "매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만"),
    ),
    ...
)]
```

### Pattern 3: openapi.json Regeneration via utoipa
**What:** Regenerate `openapi.json` by running the Rust binary that calls utoipa's `OpenApi::to_pretty_json()`
**When to use:** After any change to `#[utoipa::path]` annotations or `ToSchema` types
**How to find the command:**
```bash
# Check the api-server for a generate-openapi binary or cargo script
grep -r "generate.*openapi\|openapi.*json" packages/api-server/Cargo.toml
# Or check for a script in the api-server README
```

**IMPORTANT:** The Rust service must be compilable (`cargo check`) before openapi.json can be regenerated. After regeneration, run `bun run generate:api` from `packages/web`.

### Pattern 4: Orval Regeneration
**What:** Run `bun run generate:api` to update TypeScript types from the updated `openapi.json`
**When to use:** After any change to `openapi.json`
```bash
cd packages/web && bun run generate:api
```
This writes to `lib/api/generated/` (gitignored — only `.gitkeep` tracked). The generated `models/listPostsParams.ts` will gain `has_magazine?: boolean`.

### Anti-Patterns to Avoid
- **Hand-editing `openapi.json`**: Never manually edit this file. It is auto-generated from utoipa annotations. Hand edits will be lost on next regeneration.
- **Hand-editing generated Orval files**: `lib/api/generated/` is gitignored for a reason — always regenerate.
- **Using `post_magazine_title` as a filter column**: Not a DB column. See Phase 51 research. Use `post_magazine_id`.
- **Querying `post_magazine_title` in Supabase**: The Supabase client queries the raw DB — `post_magazine_title` does not exist there. Only the Rust API layer derives it via batch join.
- **Changing the `/explore` default behavior**: `ExploreClient` passes `hasMagazine: hasMagazine ?? false` to `useInfinitePosts`. The default `false` value means the filter must be a conditional `if (hasMagazine)` guard — not an unconditional filter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI param declaration | Manually editing openapi.json | Add to `#[utoipa::path]` params, regenerate | utoipa is the source of truth; hand edits are overwritten |
| TypeScript filter types | Manually writing `ListPostsParams` | `bun run generate:api` after openapi.json update | Orval guarantees type/schema sync with the backend |
| Magazine existence filter | Custom SQL or RPC | Supabase `.not("post_magazine_id", "is", null)` | Supabase query builder already supports this natively |

**Key insight:** Both sides of this feature are already 90% implemented. FILT-01 needs one `if` block. FILT-02 needs one line in the utoipa annotation and two regeneration commands.

## Common Pitfalls

### Pitfall 1: Wrong DB Column in Supabase Filter
**What goes wrong:** Using `.not("post_magazine_title", "is", null)` — Supabase will throw a runtime error because `post_magazine_title` is not a column in the `posts` table
**Why it happens:** `post_magazine_title` appears in TypeScript types (`PostGridItem.title`, `PostListItem.post_magazine_title`) and API responses, but it is computed by the Rust service via batch join — not stored in the DB
**How to avoid:** Use `.not("post_magazine_id", "is", null)` — confirmed by Phase 51 research and DB schema inspection
**Warning signs:** Supabase query returns error "column does not exist"

### Pitfall 2: Breaking `/explore` with the Filter
**What goes wrong:** Applying `.not("post_magazine_id", "is", null)` unconditionally causes `/explore` to show only editorial posts
**Why it happens:** `useInfinitePosts` is shared by both `/explore` (via `ExploreClient hasMagazine={false}`) and `/editorial` (via `ExploreClient hasMagazine`)
**How to avoid:** Wrap the filter in `if (hasMagazine) { query = query.not(...) }` — only activate when `hasMagazine` is truthy
**Warning signs:** `/explore` page shows significantly fewer posts than before

### Pitfall 3: Forgetting to Regenerate openapi.json Before Orval
**What goes wrong:** Running `bun run generate:api` without first updating `openapi.json` — `ListPostsParams` still won't have `has_magazine`
**Why it happens:** The pipeline is `handlers.rs (utoipa) → openapi.json → bun run generate:api → TypeScript types`. Skipping the middle step means the source of truth hasn't changed
**How to avoid:** Always regenerate `openapi.json` from Rust first, then run `bun run generate:api`
**Warning signs:** `ListPostsParams` type still missing `has_magazine` after running `bun run generate:api`

### Pitfall 4: `has_solutions` Filter Pre-existing in service.rs — Don't Break It
**What goes wrong:** Modifying the surrounding filter logic in `service.rs` while adding `has_magazine` and accidentally breaking `has_solutions`
**Why it happens:** `has_magazine` and `has_solutions` are adjacent filters at lines 562-610 in `service.rs`. The `has_magazine` filter is already present — the handler annotation is the only gap
**How to avoid:** Do NOT edit `service.rs` for this phase — both `has_magazine` and `has_solutions` filters are already correctly implemented there. Only `handlers.rs` needs updating for FILT-02.

### Pitfall 5: Rust `cargo check` Must Pass Before openapi.json Regeneration
**What goes wrong:** The openapi.json generation binary fails to compile/run if the Rust code has errors
**Why it happens:** `cargo run --bin ...` compiles the crate first
**How to avoid:** Run `cargo check` in `packages/api-server` after editing `handlers.rs` before regenerating

## Code Examples

Verified patterns from codebase inspection:

### FILT-01: Adding the Supabase Filter in useImages.ts
```typescript
// Source: packages/web/lib/hooks/useImages.ts line 204 (replacement for existing comment)
// Before:
// Note: hasMagazine filter not yet supported via Supabase query

// After:
if (hasMagazine) {
  query = query.not("post_magazine_id", "is", null);
}
```

Insert after the `groupName` filter block (line 203) and before the sort block (line 207).

### FILT-02: Adding the utoipa Param Declaration in handlers.rs
```rust
// Source: packages/api-server/src/domains/posts/handlers.rs lines 202-215
// Add to the params() block:
("has_magazine" = Option<bool>, Query, description = "매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만"),
```

### FILT-02: Expected Generated Output After Regeneration
```typescript
// packages/web/lib/api/generated/models/listPostsParams.ts (after regeneration)
export type ListPostsParams = {
  artist_name?: string;
  group_name?: string;
  context?: string;
  category?: string;
  user_id?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  has_magazine?: boolean;   // NEW field after regeneration
};
```

### Verification: Confirming the Filter Works
After implementing FILT-01, the query in `useInfinitePosts` when `hasMagazine=true` should produce:
- Supabase REST URL query segment: `post_magazine_id=not.is.null`
- Result: Only 169 posts (confirmed from Phase 51 validation: 169 posts with `post_magazine_id IS NOT NULL` out of 603 total)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useInfinitePosts` ignores `hasMagazine` param (no-op) | `useInfinitePosts` applies `.not("post_magazine_id", "is", null)` when `hasMagazine=true` | Phase 52 | `/editorial` shows 169 editorial posts instead of all 603 |
| `ListPostsParams` has no `has_magazine` field | `ListPostsParams` has `has_magazine?: boolean` | Phase 52 (after regeneration) | Type-safe filter parameter usable in REST-based clients |

**Already implemented (no action needed):**
- `PostListQuery.has_magazine` in Rust DTO: exists since before Phase 52
- `service.rs` filter: `Column::PostMagazineId.is_not_null()` already applied when `has_magazine == Some(true)`
- `ExploreClient` prop threading: `hasMagazine` already wired from `editorial/page.tsx` → `ExploreClient` → `useInfinitePosts`

## Open Questions

1. **How to regenerate openapi.json from utoipa annotations?**
   - What we know: The project uses utoipa and has an `openapi.json` that is source-of-truth for Orval. There is no explicit "generate openapi" script visible in `package.json` or Makefile from inspection.
   - What's unclear: The exact command to trigger utoipa's JSON output (could be `cargo run --bin generate-openapi`, a test, or a build.rs step)
   - Recommendation: Check `packages/api-server/Cargo.toml` for binary targets, or check `packages/api-server/README.md`. The AGENT.md may document the generation command. The planner should include a task to discover/document this command, or note that it may require `cargo run` with the appropriate binary name.

2. **Is `has_solutions` also missing from openapi.json?**
   - What we know: The Python query showed `has_solutions` is NOT in the current openapi.json params for `GET /api/v1/posts` — same gap as `has_magazine`
   - What's unclear: Whether FILT-02 should also add `has_solutions` to bring the spec fully in sync
   - Recommendation: Phase 52 scope is `has_magazine` only (per CONTEXT.md). Add `has_solutions` opportunistically if the annotation change is adjacent, but do not block FILT-02 on it.

## Validation Architecture

> workflow.nyquist_validation key is absent from .planning/config.json — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.1 |
| Config file | `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run test:unit` |
| Full suite command | `cd packages/web && bun run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILT-01 | `hasMagazine=true` adds `.not("post_magazine_id", "is", null)` to Supabase query | unit | `cd packages/web && bun run test:unit` — new test in `tests/hooks.test.ts` | ❌ Wave 0 |
| FILT-01 | `hasMagazine=false/undefined` does NOT add the filter | unit | Same | ❌ Wave 0 |
| FILT-02 | `ListPostsParams` type contains `has_magazine?: boolean` after regeneration | type-check | `cd packages/web && bun run type-check` (or `tsc --noEmit`) | ✅ (after regeneration) |

**Note on FILT-01 unit tests:** `useImages.ts` uses `supabaseBrowserClient` which requires mocking. The existing `tests/hooks.test.ts` tests `useVtonTryOn` — the same vitest environment. A minimal test can mock the Supabase client and assert `.not()` is/isn't called based on `hasMagazine`. However, because this is a Supabase query builder integration (not pure logic), it is also acceptable to validate FILT-01 manually by visiting `/editorial` and `/explore` and confirming post counts differ (169 vs 603).

**Note on FILT-02:** The type check is fully automated post-regeneration. If `ListPostsParams` is missing `has_magazine`, any TypeScript code that tries to pass `has_magazine` to `listPosts()` params will produce a compile error.

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run test:unit` (< 5 seconds)
- **Per wave merge:** `cd packages/web && bun run test:unit`
- **Phase gate:** Unit tests green + manual verification that `/editorial` shows ~169 posts and `/explore` shows ~603 posts

### Wave 0 Gaps
- [ ] `packages/web/tests/hooks.test.ts` — extend with `useInfinitePosts` hasMagazine filter test (mock Supabase client)
- [ ] Framework already installed (vitest) — no install needed

## Sources

### Primary (HIGH confidence)
- `packages/web/lib/hooks/useImages.ts` lines 159-249 — confirmed `hasMagazine` param accepted, query key includes it, filter comment at line 204
- `packages/web/app/editorial/page.tsx` — confirmed `<ExploreClient hasMagazine />`
- `packages/web/app/explore/ExploreClient.tsx` lines 64-70 — confirmed `hasMagazine: hasMagazine ?? false` passed to hook
- `packages/api-server/src/domains/posts/dto.rs` lines 178-181 — confirmed `has_magazine: Option<bool>` in `PostListQuery`
- `packages/api-server/src/domains/posts/service.rs` lines 562-565 — confirmed filter already applied: `Column::PostMagazineId.is_not_null()`
- `packages/api-server/src/domains/posts/handlers.rs` lines 196-222 — confirmed `has_magazine` NOT in `#[utoipa::path]` params
- `packages/web/lib/api/generated/models/listPostsParams.ts` — confirmed `has_magazine` NOT in generated type (reflects openapi.json state)
- `packages/web/orval.config.ts` — confirmed Orval 8.5.3, input from `../api-server/openapi.json`
- `.planning/phases/51-data-validation-gate/51-VALIDATION-REPORT.md` — confirmed 169 editorial posts exist

### Secondary (MEDIUM confidence)
- `.planning/phases/51-data-validation-gate/51-RESEARCH.md` — schema facts: `post_magazine_id` is the DB column, `post_magazine_title` is derived at Rust service layer
- `.planning/STATE.md` — key decision: "useInfinitePosts has `hasMagazine` in query key (caching correct) but filter never applied"

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed from actual project files
- Architecture: HIGH — filter pattern confirmed from existing adjacent code (`.not("image_url", "is", null)` in same function)
- Pitfalls: HIGH — confirmed from codebase inspection (wrong column name, adjacent filters already in service.rs)
- Open question (openapi.json regeneration command): LOW — command not found in inspected files; planner should add a discovery step

**Research date:** 2026-04-01
**Valid until:** Stable — no external libraries change; schema is locked; valid until next migration
