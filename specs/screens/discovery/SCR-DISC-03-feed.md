# [SCR-DISC-03] Feed
> Route: `/feed` | Status: implemented | Updated: 2026-03-05

## Purpose

User browses a responsive card grid of decoded posts with infinite scroll, tab-based UI filtering, and active category/search filters.

## Component Map

| Region | Component | File | Notes |
|--------|-----------|------|-------|
| Page | FeedClient | `packages/web/app/feed/FeedClient.tsx` | "use client" orchestrator |
| Header (desktop only) | FeedHeader | `packages/web/lib/components/feed/FeedHeader.tsx` | `hidden md:block`; shows "Latest Feed" h1 |
| Tab bar | FeedTabs | `packages/web/lib/components/feed/FeedTabs.tsx` | 3 tabs: Following / For You / Trending |
| New content alert | NewPostsIndicator | `packages/web/lib/components/feed/NewPostsIndicator.tsx` | Fixed pill; renders only if `count > 0` |
| Feed grid | VerticalFeed | `packages/web/lib/components/VerticalFeed.tsx` | Responsive grid; IntersectionObserver sentinel |
| Feed card | FeedCard | `packages/web/lib/components/FeedCard.tsx` | GSAP FLIP + social metadata; wraps DS FeedCard |
| Loading skeleton | VerticalFeedSkeleton | `packages/web/lib/components/VerticalFeed.tsx` | Named export from same file |
| DS card base | FeedCard (DS) | `packages/web/lib/design-system/feed-card.tsx` | 4:5 aspect ratio base; wrapped by components/FeedCard |
| Data hook | useInfinitePosts | `packages/web/lib/hooks/useImages.ts` | React Query infinite; query key `["posts","infinite",{...}]` |
| Filter state | filterStore | `packages/shared/stores/filterStore.ts` | `activeFilter: FilterKey` |
| Search state | searchStore | `packages/shared/stores/searchStore.ts` | `debouncedQuery` |

## Layout

### Mobile (default)

```
┌────────────────────────┐
│ [MobileHeader]         │  (NavBar above content)
├────────────────────────┤
│ [FeedTabs]             │  Following | For You | Trending
│  (horizontal chip row) │
├────────────────────────┤
│ ┌──────┐ ┌──────┐     │
│ │ Card │ │ Card │     │  1-col (sm: 2-col) grid
│ └──────┘ └──────┘     │  via VerticalFeed
│ ┌──────┐ ┌──────┐     │
│ │ Card │ │ Card │     │
│ └──────┘ └──────┘     │
│   [sentinel / spinner] │  IntersectionObserver trigger
├────────────────────────┤
│ [NavBar]               │
└────────────────────────┘

[NewPostsIndicator] — fixed pill, top-center (count > 0 only)
```

### Desktop (>=768px)

FeedHeader visible ("Latest Feed" serif h1). VerticalFeed expands to 3-col (lg) / 4-col (xl). Padding increases. NavBar hidden; DesktopHeader shown.

| Element | Mobile | Desktop |
|---------|--------|---------|
| FeedHeader | hidden | visible (md+) |
| Grid columns | 1 (sm: 2) | 3 (lg) / 4 (xl) |
| Padding | px-4 | px-6 (md) / px-8 (lg) |

## Requirements

### Data Loading

- ✅ When feed page mounts, the system shall call `useInfinitePosts({ limit: 20, sort: "recent" })` and display the first page of posts via VerticalFeed.
- ✅ When `filterStore.activeFilter` is not `"all"`, the system shall pass it as the `category` param to `useInfinitePosts`.
- ✅ When `searchStore.debouncedQuery` is non-empty, the system shall pass it as the `search` param to `useInfinitePosts`.
- ✅ When the initial fetch is in progress, the system shall show VerticalFeedSkeleton.
- ✅ When the fetch fails, the system shall show an error message and Retry button that calls `refetch()`.
- ✅ When the fetched list is empty, the system shall display an empty state with reset-filter button (if filters active).

### Infinite Scroll

- ✅ When VerticalFeed renders, the system shall attach an IntersectionObserver to a sentinel div at the bottom of the list (rootMargin: 200px).
- ✅ When the sentinel enters the viewport and `hasNextPage` is true and not already loading, the system shall call `fetchNextPage()`.
- ✅ When a new page loads, the system shall deduplicate posts by `id` using a Set before rendering.

### Tab Filtering

- ✅ When user taps a FeedTab, the system shall update local `activeTab` state (Following / For You / Trending).
- ⚠️ NOT-IMPL: Tab value is not wired to `useInfinitePosts` params — all tabs fetch the same data (`sort: "recent"`); per-tab filtering is UI-only.

### New Posts Indicator

- ✅ When `newPostCount > 0`, the system shall show NewPostsIndicator as a fixed pill at top-center.
- ⚠️ NOT-IMPL: `newPostCount` is hardcoded to `0`; real-time post detection is not implemented.

### Card Interaction

- ✅ When user taps a FeedCard, the system shall capture GSAP FLIP state and navigate to `/posts/[id]` (or `/images/[id]`).

## State

- **filterStore** (`packages/shared/stores/filterStore.ts`): `activeFilter` — applied as `category` param
- **searchStore** (`packages/shared/stores/searchStore.ts`): `debouncedQuery` — applied as `search` param
- **Local state**: `activeTab` (Following/ForYou/Trending), `newPostCount` (hardcoded 0)
- **React Query**: key `["posts","infinite",{ category, search, sort, limit }]`; `staleTime` default

## Data Flow

```
Mount → useInfinitePosts(limit:20, sort:"recent") → GET /api/v1/posts?page=1
  → dedup by id → map to FeedCardItem[] → VerticalFeed renders grid
  → IntersectionObserver sentinel fires → fetchNextPage()
  → GET /api/v1/posts?page=N → append pages → re-render
```

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| FeedCard tap | `/posts/[id]` | postId (GSAP FLIP state via transitionStore) |
| Feed nav tab | `/feed` | — |

See: SCR-DISC-01 — Home page (sibling discovery screen)
See: SCR-VIEW-01 — Post detail (card tap destination)
See: FLW-01 — Discovery Flow (feed entry in navigation contract)

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Initial fetch | VerticalFeedSkeleton grid |
| Empty (no filters) | No posts in DB | Icon + "아직 이미지가 없습니다" |
| Empty (filters active) | No matching posts | Icon + "검색 결과가 없습니다" + reset button |
| Error | API 4xx/5xx | Warning icon + message + Retry button |
| Loading more | `isFetchingNextPage` | Additional skeleton row |
