---
phase: quick
plan: 260402-jg7
subsystem: main-page, warehouse
tags: [warehouse, artist-enrichment, trending-keywords, profile-images]
dependency_graph:
  requires: [warehouse schema exposed in Supabase, warehouse.artists / warehouse.groups populated]
  provides: [warehouse-entities.server.ts, enriched trending keywords with profile images, enriched artist names in grid/spotlight/whatsNew]
  affects: [packages/web/app/page.tsx, packages/web/lib/supabase/queries/main-page.server.ts]
tech_stack:
  added: []
  patterns: [hybrid data enrichment (trending order from public.posts, entity data from warehouse), lowercase map lookup, graceful fallback pattern]
key_files:
  created:
    - packages/web/lib/supabase/queries/warehouse-entities.server.ts
  modified:
    - packages/web/lib/supabase/queries/main-page.server.ts
    - packages/web/app/page.tsx
decisions:
  - Hybrid approach: trending order from public.posts frequency counts, profile images and canonical names from warehouse.artists/groups
  - buildArtistProfileMap indexes both name_ko and name_en with lowercase keys for case-insensitive lookup
  - Korean name preferred as display name (primary market), English name creates separate entry with English display name
  - enrichArtistName helper in page.tsx is inline (not exported) — only needed at the page level
  - buildArtistProfileMap() added as 11th item in existing Promise.all — no extra round-trips
metrics:
  duration: "129 seconds"
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_changed: 3
---

# Quick Task 260402-jg7: Warehouse Entity Enrichment for Main Page

**One-liner:** Warehouse artist/group profile images and canonical names now enrich trending keywords and grid/spotlight/whatsNew sections via a hybrid approach — trending frequency from public.posts, entity data from warehouse.artists/groups.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Warehouse entity query module + hybrid fetchTrendingKeywordsServer | 0b13be8f | warehouse-entities.server.ts (new), main-page.server.ts |
| 2 | Enrich main page hero/grid with warehouse artist profile images | 6ab13b9e | page.tsx |

## What Was Built

### Task 1: warehouse-entities.server.ts

Three exported functions:

- `fetchWarehouseArtists(limit)` — Queries `warehouse.artists`, returns `ArtistRow[]`, fails gracefully with empty array.
- `fetchWarehouseGroups(limit)` — Queries `warehouse.groups`, returns `GroupRow[]`, fails gracefully.
- `buildArtistProfileMap()` — Fetches artists + groups in parallel, builds a `Map<string, ArtistProfileEntry>` keyed by lowercased name_ko and name_en. Each key points to `{ name, profileImageUrl }`. Korean name is the primary display name; English name creates a separate entry with the English display name.

`fetchTrendingKeywordsServer` rewritten with hybrid approach:
- `buildArtistProfileMap()` and public.posts query run in parallel via `Promise.all`
- Trending order still determined by public.posts artist_name frequency counts
- When building `TrendingKeyword` objects: warehouse `profileImageUrl` is used if found, otherwise falls back to `thumbnail_url` from posts
- Warehouse canonical name used for `label` if match found; raw post text used as fallback

### Task 2: page.tsx enrichment

- `buildArtistProfileMap()` added as 11th item in the existing `Promise.all` block
- `enrichArtistName(name)` helper created inline — lowercase lookup in the profile map, returns `{ displayName, profileImageUrl }`
- `gridItems`: `title` uses `enrichArtistName` displayName
- `spotlightStyles`: `title` and `artistName` use `enrichArtistName` displayName
- `whatsNewStyles`: `title` and `artistName` use `enrichArtistName` displayName
- All fallback behavior preserved: if warehouse map is empty, everything works as before with original public.posts names

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript compiles cleanly (`bunx tsc --noEmit`) after both tasks
- All existing public.posts queries unchanged — zero regression

## Self-Check: PASSED

Files exist:
- packages/web/lib/supabase/queries/warehouse-entities.server.ts: FOUND
- packages/web/lib/supabase/queries/main-page.server.ts: modified, FOUND
- packages/web/app/page.tsx: modified, FOUND

Commits exist:
- 0b13be8f: FOUND (feat(quick-260402-jg7): warehouse entity queries + hybrid trending keywords)
- 6ab13b9e: FOUND (feat(quick-260402-jg7): enrich main page grid/spotlight/whatsNew with warehouse artist names)
