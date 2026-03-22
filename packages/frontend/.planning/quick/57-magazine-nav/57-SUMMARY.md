---
phase: quick
plan: 57
subsystem: navigation, magazine, collection
tags: [cleanup, deletion, magazine-removal, nav]
dependency_graph:
  requires: []
  provides: [clean-nav-no-magazine, collection-types-self-contained]
  affects: [SmartNav, ConditionalNav, collection-bookshelf]
tech_stack:
  added: []
  patterns: [type-relocation, store-trimming]
key_files:
  created:
    - packages/web/lib/components/collection/types.ts
  modified:
    - packages/web/lib/components/main-renewal/SmartNav.tsx
    - packages/web/lib/components/ConditionalNav.tsx
    - packages/web/lib/stores/magazineStore.ts
    - packages/web/lib/components/collection/IssuePreviewCard.tsx
    - packages/web/lib/components/collection/BookshelfView.tsx
    - packages/web/lib/components/collection/BookshelfViewFallback.tsx
    - packages/web/lib/components/collection/MagazinePreviewModal.tsx
    - packages/web/lib/components/collection/IssueSpine.tsx
    - packages/web/lib/components/collection/ShelfRow.tsx
    - packages/web/lib/components/collection/studio/useSplineBridge.ts
  deleted:
    - packages/web/app/magazine/ (entire directory)
    - packages/web/app/api/v1/post-magazines/ (Next.js proxy route)
    - packages/web/lib/components/magazine/ (all components + mock JSON)
decisions:
  - Keep magazineStore.ts alive but trim to collection-only state (no mock imports from deleted dir)
  - Relocate MagazineIssue and related types to collection/types.ts (not inline in store)
  - Leave lib/api/posts.ts fetchPostMagazine and usePostMagazine hook untouched (they call external backend, not the deleted Next.js proxy)
metrics:
  duration: ~10 minutes
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 39
---

# Quick Task 57: Magazine Navigation Removal Summary

**One-liner:** Removed magazine nav entry, deleted all magazine routes/components/API proxy, relocated MagazineIssue types to collection feature to keep bookshelf compiling.

## Tasks Completed

| Task | Name                                                  | Commit   | Key Changes                      |
| ---- | ----------------------------------------------------- | -------- | -------------------------------- |
| 1    | Remove magazine nav entries and route conditions      | f8efd32a | SmartNav.tsx, ConditionalNav.tsx |
| 2    | Delete magazine routes/components/API; relocate types | 6b4285f0 | 39 files changed                 |

## What Was Done

### Task 1: Nav Cleanup

- Removed `{ href: "/magazine", label: "Magazine" }` from `NAV_ITEMS` in SmartNav.tsx
- Removed `|| pathname === "/magazine/personal"` from ConditionalNav hide condition
- Removed `|| pathname === "/magazine/personal"` from MainContentWrapper padding bypass

### Task 2: Full Magazine Removal + Type Relocation

- **Deleted** `packages/web/app/magazine/` — daily editorial page, personal issue page, layout
- **Deleted** `packages/web/app/api/v1/post-magazines/` — Next.js proxy API route
- **Deleted** `packages/web/lib/components/magazine/` — 20+ components + mock JSON fixtures
- **Created** `packages/web/lib/components/collection/types.ts` — relocated `MagazineIssue`, `ThemePalette`, `LayoutJSON`, `LayoutComponent`, `ComponentType`, `AnimationType`, `PersonalStatus`
- **Updated** 7 collection component imports: `../magazine/types` → `./types`
- **Updated** `studio/useSplineBridge.ts` import: `../../magazine/types` → `../types`
- **Trimmed** `magazineStore.ts`: removed mock JSON imports (now deleted), removed `currentIssue`/`personalIssue`/`personalStatus`/`loadDailyIssue`/`loadPersonalIssue` state — kept only collection state (`collectionIssues`, `activeIssueId`, `loadCollection`)

## Deviations from Plan

### Scope Boundary: API Client Functions Left in Place

- **Found during:** Task 2 verification
- **Issue:** `lib/api/posts.ts::fetchPostMagazine` and `lib/hooks/useImages.ts::usePostMagazine` reference `post-magazines` path
- **Decision:** Left untouched — these call the external backend (`dev.decoded.style/api/v1/post-magazines/`), not the deleted Next.js proxy route. They are used by `ImageDetailPage` and `ImageDetailModal` for magazine design spec data, which is a separate concern from the magazine feature being removed.
- **Not a bug or blocker** — these remain correct and functional.

## Self-Check

### Files Exist

- `packages/web/lib/components/collection/types.ts`: FOUND
- `packages/web/lib/stores/magazineStore.ts`: FOUND (trimmed)

### Commits Exist

- f8efd32a: FOUND
- 6b4285f0: FOUND

### Deleted Directories

- `app/magazine/`: DELETED
- `app/api/v1/post-magazines/`: DELETED
- `lib/components/magazine/`: DELETED

### TypeScript Source Errors

- No source-level errors (stale `.next/` cache has noise from old routes, but `.next/` is gitignored and will regenerate on next build)

## Self-Check: PASSED
