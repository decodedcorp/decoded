---
phase: 46-follow-system-backend
plan: "01"
subsystem: api-server
tags: [rust, sea-orm, supabase, follow-system, user-profile]
dependency_graph:
  requires: []
  provides: [user_follows-table-DDL, UserResponse-follow-counts, get_user_with_follow_counts]
  affects: [packages/api-server/src/domains/users]
tech_stack:
  added: []
  patterns: [raw-SQL-COUNT-via-SeaORM-Statement, struct-update-syntax]
key_files:
  created:
    - packages/api-server/migration/sql/04_user_follows.sql
  modified:
    - packages/api-server/src/domains/users/dto.rs
    - packages/api-server/src/domains/users/service.rs
    - packages/api-server/src/domains/users/handlers.rs
    - packages/api-server/README.md
decisions:
  - ConnectionTrait must be imported explicitly for query_one on DatabaseConnection — not re-exported from sea_orm prelude without it
  - struct update syntax (..UserResponse::from(user)) cleanly sets non-count fields without duplicating mapping logic
  - update_my_profile does a follow-up get_user_with_follow_counts after update — PATCH response includes accurate counts per RESEARCH.md recommendation
metrics:
  duration: 4m
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 5
---

# Phase 46 Plan 01: Follow System Backend Summary

**One-liner:** user_follows Supabase table DDL + UserResponse extended with followers_count/following_count populated via raw SQL COUNT queries through SeaORM Statement API.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SQL migration + UserResponse DTO extension + tests | f99fdfbc | 04_user_follows.sql, dto.rs |
| 2 | Service layer count functions + handler wiring | b2e83041 | service.rs, handlers.rs, README.md |

## What Was Built

### Task 1: SQL Migration + DTO
- Created `packages/api-server/migration/sql/04_user_follows.sql` with:
  - `public.user_follows` table with composite PK `(follower_id, following_id)`, both referencing `auth.users(id) ON DELETE CASCADE`
  - Two performance indexes: `idx_user_follows_follower_id` and `idx_user_follows_following_id`
  - RLS enabled with public SELECT policy `user_follows_select_public`
- Extended `UserResponse` struct with `followers_count: i64` and `following_count: i64` fields
- Updated `From<UserModel> for UserResponse` to default both counts to `0`
- Updated existing test `user_response_json_roundtrip_and_omits_none_optionals` to include new fields
- Added new tests: `user_response_includes_follow_counts_in_json` and `user_response_from_model_defaults_follow_counts_to_zero`

### Task 2: Service Layer + Handler Wiring
- Added `count_followers` private helper: raw SQL `SELECT COUNT(*)::BIGINT WHERE following_id = $1`
- Added `count_following` private helper: raw SQL `SELECT COUNT(*)::BIGINT WHERE follower_id = $1`
- Added public `get_user_with_follow_counts` composing user model + real counts into `UserResponse` using struct update syntax
- Updated three handlers to use the new service function:
  - `get_user_profile` (GET /api/v1/users/{user_id})
  - `get_my_profile` (GET /api/v1/users/me)
  - `update_my_profile` (PATCH /api/v1/users/me) — update first, then fetch counts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing ConnectionTrait import for query_one**
- **Found during:** Task 2 — cargo check
- **Issue:** `query_one` on `DatabaseConnection` requires `ConnectionTrait` to be in scope; it is not re-exported via the default sea_orm imports used in the file
- **Fix:** Added `ConnectionTrait` to the `use sea_orm::{...}` import list
- **Files modified:** packages/api-server/src/domains/users/service.rs
- **Commit:** b2e83041

## Verification Results

- `cargo fmt --check`: PASSED
- `cargo check`: PASSED
- `cargo test --lib`: PASSED (367 passed, 0 failed, 3 ignored)
- New user_response tests (4 total): all pass

## User Action Required

The SQL migration `04_user_follows.sql` must be applied manually:
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `packages/api-server/migration/sql/04_user_follows.sql`
3. Click Run

This is expected per plan `user_setup` configuration.

## Self-Check: PASSED
