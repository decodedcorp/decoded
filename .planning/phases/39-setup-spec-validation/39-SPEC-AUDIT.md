# Phase 39: OpenAPI Spec Audit Results

**Audit Date:** 2026-03-23
**Spec Source:** http://localhost:8000/api-docs/openapi.json
**Spec File:** packages/api-server/openapi.json

> Note: Backend server ran on port 8000 (not 3001 as previously documented in plan interfaces). Port 3001 may be the intended production default; 8000 appears to be the local dev default in the current env config.

## Audit Results

### SPEC-01: OpenAPI Version and Nullable

| Property | Value |
|----------|-------|
| OpenAPI Version | 3.1.0 |
| Nullable Pattern | oneOf + type:null (OpenAPI 3.1 canonical) |
| oneOf Count | 21 |
| nullable:true Count | 0 |
| Preprocessing Needed | No |

**Conclusion:** Orval 8.5.3 handles OpenAPI 3.1 nullable natively (fix shipped in Orval v7.5.0, PR #1818). The spec uses OpenAPI 3.1 canonical null (`oneOf: [{type: null}, ...]`), not the OpenAPI 3.0 `nullable: true` pattern. No preprocessing script required.

**Note:** The spec also uses inline type arrays for optional fields in some places (e.g., `"type": ["string", "null"]`). This is also valid OpenAPI 3.1 and Orval 8.x handles it correctly.

---

### SPEC-02: operationId Audit

**Total endpoints:** 85
**Total operationIds:** 85
**Duplicates found:** 4 duplicate operationIds (8 affected endpoints, 4 pairs)

**Duplicate operationIds found:**

| Duplicate operationId | Path 1 | Method | Path 2 | Method | Fix Plan |
|----------------------|--------|--------|--------|--------|----------|
| `list_posts` | `/api/v1/posts` | GET | `/api/v1/admin/posts` | GET | Backend PR: add `operation_id = "admin_list_posts"` to admin handler |
| `list_badges` | `/api/v1/badges` | GET | `/api/v1/admin/badges` | GET | Backend PR: add `operation_id = "admin_list_badges"` to admin handler |
| `list_solutions` | `/api/v1/spots/{spot_id}/solutions` | GET | `/api/v1/admin/solutions` | GET | Backend PR: add `operation_id = "admin_list_solutions"` to admin handler |
| `list_spots` | `/api/v1/posts/{post_id}/spots` | GET | `/api/v1/admin/spots` | GET | Backend PR: add `operation_id = "admin_list_spots"` to admin handler |

**Status: BLOCKER for Phase 40** — These 4 duplicate operationIds will cause Orval to either error out or silently generate only one hook per duplicate pair. A backend PR is required before `orval generate` can be run.

**Fix approach:** In each admin handler in `packages/api-server/src/domains/admin/`, add an explicit `operation_id` to the utoipa `#[utoipa::path]` attribute:

```rust
// Example fix for admin list_posts handler:
#[utoipa::path(
    get,
    path = "/api/v1/admin/posts",
    operation_id = "admin_list_posts",  // <-- add this
    tag = "admin",
    ...
)]
pub async fn list_posts(...) { ... }
```

**All operationIds (sorted, deduplicated):**
`adopt_solution`, `analyze_image`, `category_rankings`, `convert_affiliate`, `create_badge`, `create_category`, `create_click`, `create_comment`, `create_curation`, `create_post_with_solutions`, `create_post_without_solutions`, `create_solution`, `create_spot`, `create_synonym`, `create_vote`, `create_withdraw`, `curation_detail`, `delete_badge`, `delete_comment`, `delete_curation`, `delete_post`, `delete_recent_search`, `delete_solution`, `delete_spot`, `delete_synonym`, `delete_vote`, `extract_metadata`, `get_all_subcategories`, `get_badge`, `get_categories`, `get_click_stats`, `get_dashboard_stats`, `get_earnings`, `get_my_activities`, `get_my_profile`, `get_my_stats`, `get_popular_keywords`, `get_post`, `get_settlements`, `get_solution`, `get_spot`, `get_subcategories_by_category`, `get_traffic_analysis`, `get_user_profile`, `get_vote_stats`, `get_withdraw_status`, `health_check`, `home_feed`, `list_badges`, `list_comments`, `list_curations`, `list_posts`, `list_rankings`, `list_solutions`, `list_spots`, `list_synonyms`, `my_badges`, `my_ranking_detail`, `popular_searches`, `recent_searches`, `search`, `search_similar`, `sync_synonyms`, `trending`, `unadopt_solution`, `update_badge`, `update_category`, `update_category_order`, `update_category_status`, `update_comment`, `update_curation`, `update_curation_order`, `update_my_profile`, `update_post`, `update_post_status`, `update_solution`, `update_solution_status`, `update_spot`, `update_spot_subcategory`, `update_synonym`, `upload_image`

**Tags (15 total):** `admin`, `badges`, `categories`, `comments`, `earnings`, `feed`, `health`, `posts`, `rankings`, `search`, `solutions`, `spots`, `subcategories`, `users`, `votes`

---

### SPEC-03: Multipart Endpoints Verification

| Path | Method | operationId | In Exclusion List |
|------|--------|-------------|-------------------|
| `/api/v1/posts` | POST | `create_post_without_solutions` | Yes |
| `/api/v1/posts/analyze` | POST | `analyze_image` | Yes |
| `/api/v1/posts/upload` | POST | `upload_image` | Yes |
| `/api/v1/posts/with-solutions` | POST | `create_post_with_solutions` | Yes |

**New exclusions needed:** None — exactly 4 multipart endpoints, all match the expected exclusion list.

**Path-sharing concern (confirmed):** `/api/v1/posts` has both:
- GET `list_posts` — must be KEPT in Orval
- POST `create_post_without_solutions` — must be EXCLUDED from Orval

The orval.config.ts transformer must delete only `spec.paths["/api/v1/posts"].post`, not the entire path object.

---

### SPEC-05: Pagination Parameters

| Endpoint | Method | Pagination Parameters | Notes |
|----------|--------|-----------------------|-------|
| `/api/v1/admin/badges` | GET | `page`, `per_page` | Standard |
| `/api/v1/admin/posts` | GET | `page`, `per_page` | Standard |
| `/api/v1/admin/solutions` | GET | `page`, `per_page` | Standard |
| `/api/v1/admin/spots` | GET | `page`, `per_page` | Standard |
| `/api/v1/feed` | GET | `page`, `per_page` | Standard |
| `/api/v1/feed/trending` | GET | `page`, `per_page` | Standard |
| `/api/v1/posts` | GET | `page`, `per_page` | Standard |
| `/api/v1/rankings` | GET | `page`, `per_page` | Standard |
| `/api/v1/rankings/{category}` | GET | `page`, `per_page` | Standard |
| `/api/v1/users/me/activities` | GET | `page`, `per_page` | Standard |
| `/api/v1/search` | GET | `page`, `limit` | **Inconsistent** — uses `limit` not `per_page` |

**Cursor pagination found:** None — confirmed `[]` for `cursor`, `after`, `before` parameters.

**useInfiniteQuery needed for v9.0:** No — all endpoints are page-based. useInfiniteQuery is deferred to v9.1 (ADV-01).

**Inconsistency note:** `/api/v1/search` uses `page` + `limit` instead of `page` + `per_page`. This is a minor backend inconsistency. For Orval codegen purposes it's not blocking (both are standard query parameters), but it means the search hook will have a different param signature than other paginated hooks. This can be addressed in a future backend PR for consistency.

---

## Blockers for Phase 40

### BLOCKER: 4 Duplicate operationIds — Backend PR Required

**Status:** BLOCKING — `orval generate` cannot proceed until these are resolved.

The following 4 operationId duplicates must be fixed in the backend before Phase 40 can run codegen:

| operationId | Fix |
|-------------|-----|
| `list_posts` | Add `operation_id = "admin_list_posts"` to admin handler |
| `list_badges` | Add `operation_id = "admin_list_badges"` to admin handler |
| `list_solutions` | Add `operation_id = "admin_list_solutions"` to admin handler |
| `list_spots` | Add `operation_id = "admin_list_spots"` to admin handler |

**Backend files to modify:**
- `packages/api-server/src/domains/admin/posts/handlers.rs` (or equivalent)
- `packages/api-server/src/domains/admin/badges/handlers.rs` (or equivalent)
- `packages/api-server/src/domains/admin/solutions/handlers.rs` (or equivalent)
- `packages/api-server/src/domains/admin/spots/handlers.rs` (or equivalent)

After fixing: restart the backend, re-download `packages/api-server/openapi.json`, and verify with:
```bash
jq '[.paths | to_entries[] | .value | to_entries[] | .value.operationId] | sort | group_by(.) | map(select(length > 1)) | flatten' packages/api-server/openapi.json
# Expected: []
```

### Minor (non-blocking): Search endpoint uses `limit` instead of `per_page`

Not blocking for Phase 40 codegen. Orval will generate a `limit` parameter for the search hook instead of `per_page`. This is a cosmetic inconsistency.

---

## STATE.md Blocker Resolution

- **"OpenAPI spec may be 3.1 (utoipa 4.x) which requires preprocessing before Orval"** — RESOLVED: Spec is OpenAPI 3.1.0 as expected. Orval 8.5.3 handles this natively. No preprocessing required.

- **"operationId values may have Handler/snake_case suffixes"** — RESOLVED: No Handler suffixes found. All operationIds are clean snake_case Rust function names. However, 4 duplicate operationIds were found (list_posts, list_badges, list_solutions, list_spots — user vs admin variants). These ARE blocking and require a backend PR before codegen. This is a NEW blocker, distinct from the original concern.
