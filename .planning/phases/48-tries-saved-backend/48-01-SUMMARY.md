---
phase: 48-tries-saved-backend
plan: "01"
subsystem: api-server
tags: [rust, axum, seaorm, openapi, pagination, vton, saved-posts]
dependency_graph:
  requires: []
  provides: [GET /api/v1/users/me/tries, GET /api/v1/users/me/saved]
  affects: [packages/api-server/src/openapi.rs, packages/api-server/openapi.json]
tech_stack:
  added: []
  patterns: [SeaORM entity query with filter/order/offset/limit, raw SQL JOIN for cross-table read]
key_files:
  created:
    - packages/api-server/migration/sql/05_user_tryon_history.sql
    - packages/api-server/src/entities/user_tryon_history.rs
  modified:
    - packages/api-server/src/entities/mod.rs
    - packages/api-server/src/domains/users/dto.rs
    - packages/api-server/src/domains/users/service.rs
    - packages/api-server/src/domains/users/handlers.rs
    - packages/api-server/src/openapi.rs
    - packages/api-server/README.md
decisions:
  - "list_my_tries uses SeaORM entity query (no JOIN needed — single table)"
  - "list_my_saved uses raw SQL JOIN for post title/thumbnail (consistent with Phase 46 pattern)"
  - "per_page capped at 50 in service layer (not in Pagination struct) per plan spec"
metrics:
  duration: "172s"
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 8
---

# Phase 48 Plan 01: Tries and Saved Backend Summary

Two auth-protected paginated endpoints for VTON history and saved posts, backed by migration DDL, SeaORM entity, DTOs, service functions, and OpenAPI registration.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Migration + Entity + DTOs | 31702287 | Done |
| 2 | Service + Handlers + Router + openapi.rs | c6619339 | Done |

## What Was Built

### Migration DDL (`05_user_tryon_history.sql`)
- `user_tryon_history` table with `id`, `user_id`, `image_url`, `created_at`
- Index on `user_id` for query performance
- RLS policy: users can only SELECT their own rows

### SeaORM Entity (`user_tryon_history.rs`)
- `Model` with UUID primary key, belongs_to Users with CASCADE delete
- Registered in `entities/mod.rs` with full re-exports

### DTOs (`dto.rs`)
- `TryItem`: `id`, `image_url`, `created_at: DateTime<Utc>`
- `SavedItem`: `id`, `post_id`, `post_title?`, `post_thumbnail_url?`, `saved_at`

### Service Functions (`service.rs`)
- `list_my_tries`: SeaORM entity query, ordered by `created_at DESC`, `per_page` capped at 50
- `list_my_saved`: Raw SQL JOIN with `posts` table for title/thumbnail, same cap

### Handlers + Router (`handlers.rs`)
- `get_my_tries` — `GET /api/v1/users/me/tries` with utoipa path annotation
- `get_my_saved` — `GET /api/v1/users/me/saved` with utoipa path annotation
- Both registered in `protected_routes` (auth middleware applied)

### OpenAPI (`openapi.rs`)
- Both handler paths registered
- `TryItem` and `SavedItem` schemas registered in components

## Verification

- `cargo fmt --check` — passes
- `cargo check` — passes (0 errors)
- `grep -c "get_my_tries\|get_my_saved" openapi.rs` — returns 2
- Both routes appear in `protected_routes` block

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- packages/api-server/migration/sql/05_user_tryon_history.sql — FOUND
- packages/api-server/src/entities/user_tryon_history.rs — FOUND
- packages/api-server/src/domains/users/dto.rs contains TryItem — FOUND
- packages/api-server/src/domains/users/dto.rs contains SavedItem — FOUND
- packages/api-server/src/domains/users/handlers.rs contains get_my_tries — FOUND
- packages/api-server/src/domains/users/service.rs contains list_my_tries — FOUND
- packages/api-server/src/openapi.rs contains get_my_tries — FOUND
- packages/api-server/src/openapi.rs contains TryItem — FOUND
- Commit 31702287 — FOUND
- Commit c6619339 — FOUND
