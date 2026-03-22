---
phase: m8-01-event-tracking-infrastructure
plan: "01"
subsystem: event-tracking
tags: [supabase, rls, migration, api-route, behavioral-analytics]
dependency_graph:
  requires: []
  provides: [user_events-table, POST-/api/v1/events, insertEvents-query]
  affects: [m8-01-02-behaviorStore, m8-01-03-component-wiring]
tech_stack:
  added: []
  patterns: [supabase-server-client-auth, next-api-route-post-only, rls-per-user-policy, pg-cron-ttl]
key_files:
  created:
    - supabase/migrations/20260312120000_create_user_events_table.sql
    - packages/web/lib/supabase/queries/events.ts
    - packages/web/app/api/v1/events/route.ts
  modified: []
decisions:
  - "pg_cron TTL wrapped in DO block with EXCEPTION handler — graceful fallback if extension not enabled, no migration failure"
  - "insertEvents delegates error handling to caller (API route) — keeps query layer thin"
  - "Route handler injects server-verified user_id into rows — client cannot spoof user identity"
metrics:
  duration: "99 seconds"
  completed_date: "2026-03-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase m8-01 Plan 01: user_events Schema + Ingest API Summary

**One-liner:** Supabase `user_events` table with RLS/GIN-index/pg_cron TTL, plus a POST-only Next.js ingest route that batch-inserts authenticated user events.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | user_events 테이블 마이그레이션 SQL 생성 | 3f080e45 | supabase/migrations/20260312120000_create_user_events_table.sql |
| 2 | 이벤트 쿼리 함수 + API route 생성 | 652b6950 | packages/web/lib/supabase/queries/events.ts, packages/web/app/api/v1/events/route.ts |

## What Was Built

### 1. DB Migration (`supabase/migrations/20260312120000_create_user_events_table.sql`)

- `public.user_events` table: `id` (uuid PK), `user_id` (FK → users ON DELETE CASCADE), `event_type` (text), `entity_id` (nullable text), `session_id` (text), `page_path` (text), `metadata` (jsonb nullable), `created_at` (timestamptz DEFAULT now())
- 3 indexes: GIN on `metadata` (m8-02 affinity scoring), composite `(user_id, created_at DESC)` (per-user time-range), `event_type` (type filtering)
- 3 RLS policies: authenticated INSERT own events, authenticated SELECT own events, service_role full access
- 30-day TTL via `pg_cron` in a `DO/EXCEPTION` block — registers job if pg_cron is available, logs a NOTICE if not (no migration failure)

### 2. Query Function (`packages/web/lib/supabase/queries/events.ts`)

- `insertEvents(supabase: SupabaseClient, events: EventRow[])` — batch INSERT to `user_events`, returns `{ error }` for caller to handle
- `EventRow` interface exported — used by route handler for type safety

### 3. API Route (`packages/web/app/api/v1/events/route.ts`)

- `POST /api/v1/events` — receives batched event array from `sendBeacon`
- Empty array early return (timer-based flush with empty queue)
- Auth check via `createSupabaseServerClient().auth.getUser()` — silent 401 for unauthenticated
- Maps client payload to `EventRow[]` injecting server-verified `user_id`
- Dev-only `console.error` logging for insert errors
- POST-only — no GET/PUT/DELETE handlers

## Verification

- SQL file: 1 CREATE TABLE + 3 CREATE INDEX + 3 CREATE POLICY + cron.schedule = 8 DDL constructs
- `npx tsc --noEmit` — 0 errors
- Route file exports `POST` function
- Query file exports `insertEvents` function and `EventRow` interface

## Deviations from Plan

None — plan executed exactly as written.

The only discretionary implementation choice: `insertEvents` return type uses `{ error: unknown }` rather than the Supabase-specific `PostgrestError | null` — keeps the query layer independent of Supabase's internal types while remaining functionally equivalent.

## Self-Check: PASSED

Files created:
- `/Users/kiyeol/development/decoded/decoded-app/supabase/migrations/20260312120000_create_user_events_table.sql` — FOUND
- `/Users/kiyeol/development/decoded/decoded-app/packages/web/lib/supabase/queries/events.ts` — FOUND
- `/Users/kiyeol/development/decoded/decoded-app/packages/web/app/api/v1/events/route.ts` — FOUND

Commits:
- `3f080e45` — FOUND
- `652b6950` — FOUND
