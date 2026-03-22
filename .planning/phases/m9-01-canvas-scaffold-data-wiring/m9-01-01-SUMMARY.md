---
phase: m9-01-canvas-scaffold-data-wiring
plan: "01"
subsystem: main-d-canvas
tags: [types, scatter-engine, server-query, djb2, deterministic]
dependency_graph:
  requires: []
  provides:
    - "MainDPost, ScatterPosition types (packages/web/lib/components/main-d/types.ts)"
    - "computeScatterPosition pure function (packages/web/lib/components/main-d/scatter.ts)"
    - "fetchMainDPostsServer, fetchTrendingKeywordsServer (packages/web/lib/supabase/queries/main-d.server.ts)"
  affects:
    - "m9-01-02 (UI components depend on these types and scatter engine)"
    - "m9-03 (wordmark section consumes fetchTrendingKeywordsServer)"
tech_stack:
  added: []
  patterns:
    - "djb2 seeded PRNG for hydration-safe deterministic layout"
    - "getSharedClient() pattern mirrored from main-b.server.ts"
    - "Zone-based 4x3 grid scatter (25% × 33.3% zones)"
key_files:
  created:
    - packages/web/lib/components/main-d/types.ts
    - packages/web/lib/components/main-d/scatter.ts
    - packages/web/lib/components/main-d/index.ts
    - packages/web/lib/supabase/queries/main-d.server.ts
  modified: []
decisions:
  - "Ordered trending keywords by created_at DESC instead of view_count — pipeline post table has no view_count column (only seed_posts does)"
  - "ScatterPosition defined only in types.ts, imported+re-exported by scatter.ts — single source of truth maintained"
  - "Server-side Math.random() acceptable for data selection (image pool shuffle) — only position/rotation must be deterministic"
metrics:
  duration: "8 minutes"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase m9-01 Plan 01: Types + Scatter Engine + Server Queries Summary

djb2 seeded scatter engine and multi-post server query foundation for the sticker canvas layout — hydration-safe deterministic positioning via zone-based 4×3 grid PRNG.

## Tasks Completed

| #   | Task                                        | Commit   | Files                          |
| --- | ------------------------------------------- | -------- | ------------------------------ |
| 1   | Types + djb2 scatter engine                 | 2320482e | types.ts, scatter.ts, index.ts |
| 2   | Multi-post server query + trending keywords | 1a4f982f | main-d.server.ts               |

## What Was Built

### Task 1: Types + Scatter Engine

**`packages/web/lib/components/main-d/types.ts`** — Single source of truth:

- `MainDPost`: `{ id, imageUrl, artistName }` — same shape as MainBPost, independent for main-d evolution
- `ScatterPosition`: `{ top, left, width, rotate, zIndex }` — CSS percentage strings + clamp expression

**`packages/web/lib/components/main-d/scatter.ts`** — Pure djb2 PRNG:

- `djb2(str)`: standard 32-bit hash (hash = 5381, XOR loop, unsigned)
- `seededRandom(seed, salt)`: float [0,1) via `(djb2(seed + salt) % 10000) / 10000`
- `computeScatterPosition(id, index)`: zone-based layout
  - Grid: 4 cols × 3 rows = 12 zones
  - Zone W: 25%, Zone H: 33.3%
  - Random offset within zone (70% of zone size max)
  - Left capped at 82%, top capped at 80% (prevents edge clipping)
  - Rotation: -12 to +12 degrees
  - z-index: 1-20
  - Size: clamp(85-120px, 12-18vw, 187-264px) via sizeVariant 0.85-1.2x

**`packages/web/lib/components/main-d/index.ts`** — Barrel with TODO placeholder for Plan 02 components

### Task 2: Server Queries

**`packages/web/lib/supabase/queries/main-d.server.ts`**:

- `getSharedClient()`: verbatim mirror of main-b pattern with `[main-d]` prefix
- `fetchMainDPostsServer()`: fetches pool of 200 images → random 12 → parallel post metadata via post_image join → `MainDPost[]`
- `fetchTrendingKeywordsServer()`: recent posts (created_at DESC) → extract unique artist names → top 5-8 strings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed view_count ORDER BY from trending query**

- **Found during:** Task 2
- **Issue:** Plan specified `order by view_count DESC` on `post` table, but the shared pipeline `post` table has no `view_count` column (only `seed_posts` does — see `packages/shared/supabase/types.ts`)
- **Fix:** Changed to `order("created_at", { ascending: false })` — recent posts serve as trending proxy, and also removed `as never` type cast that was used to bypass the TypeScript error
- **Files modified:** packages/web/lib/supabase/queries/main-d.server.ts
- **Commit:** 1a4f982f

## Verification Results

- TypeScript: Zero new errors in new files (3 pre-existing unrelated errors unchanged)
- `Math.random()` in scatter.ts: 0 code occurrences (only in JSDoc comment)
- `ScatterPosition` interface defined: 1× in types.ts, 0× in scatter.ts
- scatter.ts imports from `./types`: confirmed
- Exports from main-d.server.ts: `fetchMainDPostsServer` + `fetchTrendingKeywordsServer` confirmed

## Self-Check: PASSED

All 4 files exist on disk. Both task commits (2320482e, 1a4f982f) verified in git log.
