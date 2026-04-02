---
phase: 58-artist-discovery
plan: "01"
subsystem: explore
tags: [artist-discovery, trending, filter, supabase, tanstack-query]
dependency_graph:
  requires: []
  provides:
    - useTrendingArtists hook with 7-day window and all-time fallback
    - ArtistProfileCard component with hover ring effect
    - TrendingArtistsSection horizontal scroll section
    - ExploreClient integration with !hasMagazine guard
  affects:
    - packages/web/app/explore/ExploreClient.tsx
    - packages/web/lib/components/explore/index.ts
tech_stack:
  added: []
  patterns:
    - Supabase client-side aggregation (group by artist_name from posts table)
    - TanStack Query useQuery with staleTime/gcTime caching
    - next/image fill with object-top for face-preferring avatar crops
    - memo() wrapping for performance
key_files:
  created:
    - packages/web/lib/hooks/useTrendingArtists.ts
    - packages/web/lib/components/explore/ArtistProfileCard.tsx
    - packages/web/lib/components/explore/TrendingArtistsSection.tsx
  modified:
    - packages/web/lib/components/explore/index.ts
    - packages/web/app/explore/ExploreClient.tsx
decisions:
  - Client-side grouping with Map instead of Supabase GROUP BY — avoids complex SQL while keeping 200-post scan window manageable
  - fetchAllTimeTopArtists fallback when trending window has < 3 artists — ensures section always has meaningful content
  - setCast(name, name, name) — artist_name used as castId (no separate cast table lookup needed for basic filtering)
  - scrollbarWidth inline style + ::-webkit-scrollbar CSS in style tag — ensures cross-browser scrollbar hiding without Tailwind plugin dependency
metrics:
  duration: "~2 minutes"
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 58 Plan 01: Artist Discovery - Trending Artists Section Summary

Trending artists horizontal scroll section added to Explore page, sourced from posts.artist_name aggregation with 7-day window and all-time fallback, filtering the masonry grid via setCast on card click.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useTrendingArtists hook and ArtistProfileCard | f7826327 | useTrendingArtists.ts, ArtistProfileCard.tsx |
| 2 | Create TrendingArtistsSection and integrate into ExploreClient | eabc8d80 | TrendingArtistsSection.tsx, index.ts, ExploreClient.tsx |

## What Was Built

- **useTrendingArtists hook** — Queries `posts` table with a configurable day window (default 7 days), aggregates by `artist_name` client-side using a `Map`, sorts by postCount descending, returns top N artists. Falls back to all-time top artists when trending window yields fewer than 3 artists. 5-minute stale time prevents excessive re-fetches.

- **ArtistProfileCard** — Circular avatar button (72px mobile / 80px desktop) with `next/image fill + object-top` for face-preferring crop, hover ring using `var(--mag-accent)` CSS variable, fallback User icon on image error, post count display. Wrapped in `memo()`.

- **TrendingArtistsSection** — Horizontal scroll row with snap-x behavior, hidden scrollbar (scrollbarWidth + ::-webkit-scrollbar), label "Trending Artists", maps artists to ArtistProfileCard. Hides when `isLoading || !artists || artists.length < 3`.

- **ExploreClient integration** — TrendingArtistsSection inserted between ExploreFilterSheet and the flex-1 grid div, rendered only when `!hasMagazine` (Explore tab only, hidden on Editorial tab).

## Verification Results

- TypeScript compilation: PASSED (bunx tsc --noEmit, no errors)
- Next.js build: PASSED (all routes compiled successfully)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files confirmed:
- packages/web/lib/hooks/useTrendingArtists.ts: FOUND
- packages/web/lib/components/explore/ArtistProfileCard.tsx: FOUND
- packages/web/lib/components/explore/TrendingArtistsSection.tsx: FOUND

Commits confirmed:
- f7826327: FOUND
- eabc8d80: FOUND
