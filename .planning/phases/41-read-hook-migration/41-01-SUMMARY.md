---
phase: 41-read-hook-migration
plan: "01"
subsystem: hooks/api
tags: [orval, codegen, react-query, migration, badges, rankings, categories]
dependency_graph:
  requires:
    - packages/web/lib/api/generated/badges/badges.ts
    - packages/web/lib/api/generated/rankings/rankings.ts
    - packages/web/lib/api/generated/categories/categories.ts
    - packages/web/lib/api/generated/models/index.ts
  provides:
    - Migrated useMyBadges using generated hook
    - Migrated useMyRanking using generated hook
    - Migrated useCategories using generated hook
    - badge-mapper imports from generated/models
    - ranking-mapper imports from generated/models
  affects:
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/hooks/useCategories.ts
    - packages/web/lib/utils/badge-mapper.ts
    - packages/web/lib/utils/ranking-mapper.ts
tech_stack:
  added: []
  patterns:
    - Import-aliasing pattern for generated hooks (useMyBadgesGenerated, useMyRankingDetailGenerated, useGetCategoriesGenerated)
    - Cache key preservation via profileKeys.badges() / profileKeys.rankings() / CATEGORIES_QUERY_KEY passed into generated hook query option
key_files:
  created: []
  modified:
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/hooks/useCategories.ts
    - packages/web/lib/utils/badge-mapper.ts
    - packages/web/lib/utils/ranking-mapper.ts
    - packages/web/lib/api/index.ts
  deleted:
    - packages/web/lib/api/badges.ts
    - packages/web/lib/api/rankings.ts
    - packages/web/lib/api/categories.ts
decisions:
  - "Import-alias pattern: import generated hook with 'as *Generated' suffix to avoid name collision with the wrapper hook"
  - "Preserve cache keys: pass profileKeys.badges() / profileKeys.rankings() / CATEGORIES_QUERY_KEY into generated hook's query.queryKey to maintain cache shape from existing callers"
  - "null-to-undefined coercion in badge-mapper: generated types use string|null, store Badge.description expects string|undefined — ?? undefined handles the gap cleanly"
  - "findCategoryIdByCode and findCategoryById confirmed unused outside categories.ts — deleted without replacement"
metrics:
  duration_seconds: 155
  completed_date: "2026-03-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
  files_deleted: 3
---

# Phase 41 Plan 01: Read Hook Migration (Badges, Rankings, Categories) Summary

**One-liner:** Badges, rankings, and categories read hooks migrated to Orval-generated hooks via import-alias pattern with preserved cache keys; manual API stubs deleted.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate hooks and update mapper type imports | 9cfda2e9 | useProfile.ts, useCategories.ts, badge-mapper.ts, ranking-mapper.ts |
| 2 | Delete manual API files and update index.ts | b128f45b | badges.ts (del), rankings.ts (del), categories.ts (del), index.ts |

## What Was Built

Three hook domains migrated from manual stubs/raw fetch to Orval-generated hooks:

**useProfile.ts (badges + rankings):**
- `useMyBadges` now wraps `useMyBadgesGenerated` (was a stub returning empty data)
- `useMyRanking` now wraps `useMyRankingDetailGenerated` (was a stub returning zeroed data)
- Both preserve their original cache keys via `profileKeys.badges()` and `profileKeys.rankings()`
- Old imports `{ fetchMyBadges } from "@/lib/api/badges"` and `{ fetchMyRanking } from "@/lib/api/rankings"` removed

**useCategories.ts:**
- `useCategories` now wraps `useGetCategoriesGenerated` (was a raw fetch wrapper)
- Preserves `CATEGORIES_QUERY_KEY`, `staleTime: 1hr`, `gcTime: 24hr`
- `useFindCategoryId`, `useFindCategory`, `useCategoryCodeMap` updated to use `CategoryResponse` type
- Old import `{ getCategories, type Category } from "@/lib/api"` removed

**Mapper files:**
- `badge-mapper.ts`: `EarnedBadgeItem` and `AvailableBadgeItem` now imported from `@/lib/api/generated/models` with alias pattern
- `ranking-mapper.ts`: `MyRankingDetailResponse` and `CategoryRank` now imported from `@/lib/api/generated/models` with alias pattern

**Deleted:**
- `lib/api/badges.ts` — empty stub
- `lib/api/rankings.ts` — empty stub
- `lib/api/categories.ts` — raw fetch wrapper
- `lib/api/index.ts` categories re-export block removed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Null-to-undefined coercion in badge-mapper**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** Generated `EarnedBadgeItem.description` and `AvailableBadgeItem.description` are typed as `string | null | undefined` (matching OpenAPI `@nullable` annotation). The store's `Badge.description` field expects `string | undefined`. Direct assignment caused TS2322 errors on lines 49 and 63.
- **Fix:** Added `?? undefined` coercion: `description: item.description ?? undefined`
- **Files modified:** `packages/web/lib/utils/badge-mapper.ts`
- **Commit:** 9cfda2e9

## Verification

- `bunx tsc --noEmit` exits 0 after both tasks
- No remaining imports reference deleted `@/lib/api/badges`, `@/lib/api/rankings`, `@/lib/api/categories`
- `findCategoryIdByCode` and `findCategoryById` confirmed unused (grep found 0 matches) — deleted cleanly

## Self-Check: PASSED

Files exist:
- `packages/web/lib/hooks/useProfile.ts` — FOUND
- `packages/web/lib/hooks/useCategories.ts` — FOUND
- `packages/web/lib/utils/badge-mapper.ts` — FOUND
- `packages/web/lib/utils/ranking-mapper.ts` — FOUND
- `packages/web/lib/api/index.ts` — FOUND
- `packages/web/lib/api/badges.ts` — NOT EXISTS (correctly deleted)
- `packages/web/lib/api/rankings.ts` — NOT EXISTS (correctly deleted)
- `packages/web/lib/api/categories.ts` — NOT EXISTS (correctly deleted)

Commits verified:
- 9cfda2e9 — FOUND
- b128f45b — FOUND
