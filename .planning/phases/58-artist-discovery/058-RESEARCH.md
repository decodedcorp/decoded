# Phase 58: Artist Discovery - Research

**Researched:** 2026-04-02
**Domain:** Explore UI — Artist profile cards + trending artists horizontal scroll section
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 기존 `PersonResultCard` 패턴을 확장하여 아티스트 프로필 카드 구현 — 아바타, 이름, 카테고리, 아이템 수 표시
- **D-02:** `/cast/[id]` 경로로 링크 (기존 PersonResultCard 패턴 유지)
- **D-03:** Explore 페이지 상단 (masonry 그리드 위)에 수평 스크롤 트렌딩 아티스트 섹션 배치
- **D-04:** 기존 `ExploreClient` 내부에 통합 — 별도 페이지 없음
- **D-05:** posts 테이블의 `artist_name` 필드를 집계하여 트렌딩 아티스트 목록 구성 — 별도 artists 테이블 없음 (프로젝트 원칙: brand/artist별 테이블 없음)
- **D-06:** 트렌딩 기준은 최근 N일 내 포스트 수 기준 정렬

### Claude's Discretion
- 트렌딩 기간 (7일/14일/30일)
- 아티스트 카드 호버 효과 세부 스타일
- 아바타 이미지 소스 (posts 테이블에서 첫 번째 이미지 활용 vs 별도 프로필 이미지)
- 수평 스크롤 UI 세부 구현 (snap scroll, 화살표 등)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 58 adds a Trending Artists section to the Explore page: a horizontally scrolling row of artist profile cards placed above the masonry grid, fed by aggregating `posts.artist_name` with a recency window. No new tables. No new packages.

The data layer is Supabase client-side (matching the existing `useInfinitePosts` pattern in `ExploreClient`). A new `useTrendingArtists` hook queries `posts` grouped by `artist_name`, filtered to active posts within a recent date window, returning name + post_count + representative image_url. The hook result feeds a new `TrendingArtistsSection` component that renders `ArtistProfileCard` items in a horizontal scroll strip.

The card follows `PersonResultCard` visually (avatar circle, name, subtitle). The scroll container follows `ShopCarouselSection` and `ArtistSpotlightSection` patterns already in the codebase: `overflow-x-auto snap-x snap-mandatory scrollbar-hide` with optional desktop arrow buttons. The section inserts just above the filter bar area in `ExploreClient`.

**Primary recommendation:** Use 7-day trending window, derive avatar from the most recent post's `image_url` (no separate profile images exist), implement snap-scroll with hidden scrollbar — no arrow buttons needed for this context.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | project-pinned | Aggregation query | Only data source; no artists table |
| `@tanstack/react-query` | project-pinned | `useQuery` for trending hook | Project-wide data-fetching standard |
| `motion/react` | project-pinned | Fade-in animation on mount | Already used in `ExploreClient` |
| `next/image` | Next.js 16 built-in | Avatar images | Automatic optimization |
| `next/link` | Next.js 16 built-in | Card link to `/cast/[id]` | Same as `PersonResultCard` |
| `lucide-react` | project-pinned | User fallback icon | Same as `PersonResultCard` |

No new packages. This phase is fully covered by the existing stack.

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/web/
├── lib/
│   ├── components/
│   │   └── explore/
│   │       ├── ArtistProfileCard.tsx       # NEW — single artist card
│   │       ├── TrendingArtistsSection.tsx  # NEW — horizontal scroll strip
│   │       └── index.ts                    # UPDATE — re-export new components
│   └── hooks/
│       └── useTrendingArtists.ts           # NEW — Supabase aggregation hook
└── app/
    └── explore/
        └── ExploreClient.tsx               # UPDATE — insert TrendingArtistsSection
```

### Pattern 1: Data Aggregation via Supabase (no GROUP BY RPC needed)

The Supabase JS client does not natively support `GROUP BY` in `.select()` unless you use a Postgres RPC or a view. The pragmatic approach for this phase is to fetch recent posts ordered by created_at, then deduplicate/count client-side in the hook. This avoids any backend change.

**Recommended approach:** Fetch top N posts from the last 7 days (`created_at >= cutoff`), then group by `artist_name` in JS, sort by group size descending, take top 8-10 artists.

```typescript
// Source: packages/web/lib/hooks/useImages.ts pattern (supabaseBrowserClient)
const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const { data, error } = await supabaseBrowserClient
  .from("posts")
  .select("artist_name, image_url, created_at")
  .eq("status", "active")
  .not("artist_name", "is", null)
  .not("image_url", "is", null)
  .gte("created_at", cutoff)
  .order("created_at", { ascending: false })
  .limit(200); // fetch enough to aggregate client-side
```

Then in JS:
```typescript
const grouped = new Map<string, { postCount: number; imageUrl: string }>();
for (const post of data ?? []) {
  const name = post.artist_name!;
  if (!grouped.has(name)) {
    grouped.set(name, { postCount: 0, imageUrl: post.image_url! });
  }
  grouped.get(name)!.postCount += 1;
}
return Array.from(grouped.entries())
  .sort((a, b) => b[1].postCount - a[1].postCount)
  .slice(0, 10)
  .map(([name, { postCount, imageUrl }]) => ({ name, postCount, imageUrl }));
```

This approach:
- Requires zero backend changes
- Is consistent with how `useInfinitePosts` directly queries Supabase
- Works even if fewer than 200 active posts exist in window (graceful degradation)

**If result is empty** (e.g., no posts in last 7 days), fall back to all-time top artists by fetching without date filter. Handle in hook via fallback query.

### Pattern 2: ArtistProfileCard — extend PersonResultCard visually

```typescript
// Based on: packages/web/lib/components/search/PersonResultCard.tsx

interface ArtistProfileCardProps {
  name: string;
  postCount: number;
  imageUrl: string;
  onClick?: () => void; // optionally set castId filter instead of navigate
}
```

Card layout: circular avatar (56x56 or 64x64), artist name, post count subtitle. Link to `/cast/[id]` where id = encoded artist_name (since there's no integer cast id in posts table — see note below).

**Important:** `/cast/[id]` route does not currently exist in the app. The CONTEXT.md says link to it (D-02, following PersonResultCard pattern), but PersonResultCard uses `person.id` from `SearchResultItem`. For aggregated artist data from `posts.artist_name`, the "id" is the artist_name string itself. The planner must decide:
- Option A: Link to `/cast/[encodeURIComponent(artistName)]` — create stub route or rely on existing filter
- Option B: On card click, set `castId` filter in `useHierarchicalFilterStore` to filter the grid (no navigation)

Option B aligns with the existing `castId` filter already in `ExploreClient` and `useInfinitePosts`. Option A requires a new route. Given phase scope, **Option B is recommended** — click sets the cast filter rather than navigating.

### Pattern 3: Horizontal Scroll — project-established pattern

Two existing patterns in the codebase:

**Simple snap-scroll (ArtistSpotlightSection pattern):**
```tsx
// Source: packages/web/lib/components/main/ArtistSpotlightSection.tsx
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
     style={{ scrollbarWidth: "none" }}>
  {items.map(item => (
    <div className="flex-none snap-center" key={item.name}>
      <ArtistProfileCard {...item} />
    </div>
  ))}
</div>
```

**With arrow buttons (ShopCarouselSection pattern):**
```typescript
// Source: packages/web/lib/components/detail/ShopCarouselSection.tsx
const scrollRef = useRef<HTMLDivElement>(null);
const scroll = (direction: "left" | "right") => {
  scrollRef.current?.scrollTo({
    left: scrollRef.current.scrollLeft + (direction === "left" ? -300 : 300),
    behavior: "smooth",
  });
};
```

Recommendation: Use simple snap-scroll for this phase (no arrows needed — simpler, mobile-first).

### Pattern 4: ExploreClient insertion point

Insert `TrendingArtistsSection` between the filter bar and the grid container. Current structure in `ExploreClient`:

```
<div className="relative h-[...] flex flex-col">
  {/* Desktop filter bar */}        ← above here is filter
  {/* Mobile filter toggle */}
  {/* Mobile filter sheet */}
  <div className="relative flex-1"> ← masonry grid starts here
```

Insert the trending section between the mobile filter toggle and the `flex-1` grid container:

```tsx
{/* Trending Artists Section — only on Explore tab (hasMagazine=false) */}
{!hasMagazine && <TrendingArtistsSection />}
```

This ensures it only appears on the default Explore tab, not on the Editorial tab.

### Anti-Patterns to Avoid

- **Creating an artists table:** Project explicitly prohibits brand/artist-specific tables (D-05, project memory). Use `posts.artist_name` aggregation only.
- **Using Supabase RPC for GROUP BY:** Requires backend change. Client-side grouping is sufficient for ≤200 posts per 7-day window.
- **Navigating to `/cast/[id]`:** The route doesn't exist. Setting a filter is more useful and requires no new page.
- **Using `react-intersection-observer`:** Not installed (see Phase 49 notes). Use native `IntersectionObserver` if needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image display with fallback | Custom img tag | `next/image` + fallback `<User>` icon | Optimization, lazy load |
| Scroll state tracking | Custom scroll hooks | Inline `onScroll` + `useRef` | ShopCarouselSection pattern proven |
| Horizontal scroll | CSS animation/JS | CSS `overflow-x-auto snap-x` | Zero JS, performant, project standard |
| Query caching | Manual cache | `useQuery` with `staleTime` | TanStack Query handles invalidation |
| Filter state | Local state | `useHierarchicalFilterStore.setCast()` | Existing store already integrated into ExploreClient |

---

## Common Pitfalls

### Pitfall 1: `/cast/[id]` route doesn't exist
**What goes wrong:** Clicking artist card navigates to 404.
**Why it happens:** CONTEXT.md D-02 references this route following PersonResultCard pattern, but no `/app/cast/` directory exists.
**How to avoid:** Use `useHierarchicalFilterStore().setCast()` instead of navigation. This filters the masonry grid to show that artist's posts — a better UX for the Explore context.
**Warning signs:** `app/cast/` directory missing in filesystem.

### Pitfall 2: Empty trending section on fresh/sparse data
**What goes wrong:** Section renders empty or with 0 artists when DB has few recent posts.
**Why it happens:** 7-day window may have no results if content is sparse.
**How to avoid:** Implement fallback in `useTrendingArtists` — if 7-day result is empty, re-query without date filter (all-time top artists). Or hide section entirely when count < 3.
**Warning signs:** Empty array returned from hook.

### Pitfall 3: `artist_name` is null in many posts
**What goes wrong:** Aggregation produces few/no artists.
**Why it happens:** `posts.artist_name` is nullable. Posts without artist_name are excluded by `.not("artist_name", "is", null)`.
**How to avoid:** This is correct behavior. The section is optional — don't render if result < 3 artists.

### Pitfall 4: Performance — fetching 200 posts just for trending
**What goes wrong:** Extra network request on every Explore page load.
**Why it happens:** Aggregation query fetches up to 200 posts.
**How to avoid:** Set `staleTime: 1000 * 60 * 5` (5 minutes) in `useQuery` so it doesn't re-fetch on every navigation. This is the same staleTime as `useInfinitePosts`.

### Pitfall 5: Hydration mismatch on horizontal scroll
**What goes wrong:** SSR/CSR mismatch if trending data is server-fetched vs client-only.
**Why it happens:** Supabase browser client must not run on server.
**How to avoid:** Keep `useTrendingArtists` as a client-only hook using `supabaseBrowserClient` (same as `useInfinitePosts`). The component is already inside a `"use client"` boundary.

---

## Code Examples

### useTrendingArtists hook

```typescript
// packages/web/lib/hooks/useTrendingArtists.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabaseBrowserClient } from "@/lib/supabase/client";

export interface TrendingArtist {
  name: string;
  postCount: number;
  imageUrl: string;
}

async function fetchTrendingArtists(
  dayWindow: number,
  limit: number
): Promise<TrendingArtist[]> {
  const cutoff = new Date(
    Date.now() - dayWindow * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("artist_name, image_url, created_at")
    .eq("status", "active")
    .not("artist_name", "is", null)
    .not("image_url", "is", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const grouped = new Map<string, { postCount: number; imageUrl: string }>();
  for (const post of data ?? []) {
    const name = post.artist_name!;
    if (!grouped.has(name)) {
      grouped.set(name, { postCount: 0, imageUrl: post.image_url! });
    }
    grouped.get(name)!.postCount += 1;
  }

  const sorted = Array.from(grouped.entries())
    .sort((a, b) => b[1].postCount - a[1].postCount)
    .slice(0, limit)
    .map(([name, { postCount, imageUrl }]) => ({ name, postCount, imageUrl }));

  // Fallback: if empty, return all-time top artists
  if (sorted.length < 3) {
    return fetchAllTimeTopArtists(limit);
  }
  return sorted;
}

async function fetchAllTimeTopArtists(limit: number): Promise<TrendingArtist[]> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("artist_name, image_url")
    .eq("status", "active")
    .not("artist_name", "is", null)
    .not("image_url", "is", null)
    .order("view_count", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const grouped = new Map<string, { postCount: number; imageUrl: string }>();
  for (const post of data) {
    const name = post.artist_name!;
    if (!grouped.has(name)) {
      grouped.set(name, { postCount: 0, imageUrl: post.image_url! });
    }
    grouped.get(name)!.postCount += 1;
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[1].postCount - a[1].postCount)
    .slice(0, limit)
    .map(([name, { postCount, imageUrl }]) => ({ name, postCount, imageUrl }));
}

export function useTrendingArtists(dayWindow = 7, limit = 10) {
  return useQuery<TrendingArtist[]>({
    queryKey: ["trending-artists", { dayWindow, limit }],
    queryFn: () => fetchTrendingArtists(dayWindow, limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}
```

### ArtistProfileCard component

```tsx
// packages/web/lib/components/explore/ArtistProfileCard.tsx
"use client";

import { memo } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import type { TrendingArtist } from "@/lib/hooks/useTrendingArtists";

interface ArtistProfileCardProps {
  artist: TrendingArtist;
  onClick: (name: string) => void;
}

export const ArtistProfileCard = memo(function ArtistProfileCard({
  artist,
  onClick,
}: ArtistProfileCardProps) {
  return (
    <button
      onClick={() => onClick(artist.name)}
      className="flex flex-col items-center gap-2 flex-none w-[72px] md:w-[80px] group"
      type="button"
    >
      {/* Avatar */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-[var(--mag-accent)] transition-all">
        <Image
          src={artist.imageUrl}
          alt={artist.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      {/* Name */}
      <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
        {artist.name}
      </span>
      {/* Post count */}
      <span className="text-[10px] text-muted-foreground">
        {artist.postCount} posts
      </span>
    </button>
  );
});
```

### TrendingArtistsSection component

```tsx
// packages/web/lib/components/explore/TrendingArtistsSection.tsx
"use client";

import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import { useTrendingArtists } from "@/lib/hooks/useTrendingArtists";
import { ArtistProfileCard } from "./ArtistProfileCard";

export function TrendingArtistsSection() {
  const { data: artists, isLoading } = useTrendingArtists(7, 10);
  const setCast = useHierarchicalFilterStore((s) => s.setCast);

  // Don't render if empty or loading
  if (isLoading || !artists || artists.length < 3) return null;

  const handleArtistClick = (name: string) => {
    setCast(name, name, name); // id=name, label=name, labelKo=name
  };

  return (
    <section className="px-4 py-3 border-b border-border flex-shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Trending Artists
      </p>
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {artists.map((artist) => (
          <div key={artist.name} className="snap-center">
            <ArtistProfileCard artist={artist} onClick={handleArtistClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

### ExploreClient insertion (diff)

```tsx
// In ExploreClient — insert after mobile filter sheet, before flex-1 grid div
{!hasMagazine && <TrendingArtistsSection />}

<div className="relative flex-1">
  {/* ... existing grid code ... */}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Separate artists table | posts.artist_name aggregation | No backend/DB changes needed |
| Navigate to artist page | Set cast filter in hierarchical store | Instant grid filter, no 404 risk |
| Custom scroll component | CSS snap-x + overflow-x-auto | Zero JS, works on touch/mouse |

**Deprecated/outdated:**
- `/cast/[id]` navigation: Route does not exist. Use filter store instead.

---

## Open Questions

1. **`setCast` signature in hierarchicalFilterStore**
   - What we know: Called as `setCast(id, name, nameKo)` in ExploreFilterBar
   - What's unclear: Whether passing artist_name as id causes issues with mock cast data expectations
   - Recommendation: Inspect `useHierarchicalFilterStore` store definition before implementing. The `castId` is passed as `ilike artist_name` in `useInfinitePosts`, so using artist_name as id should work correctly.

2. **Supabase `image_url` for avatar quality**
   - What we know: Posts have `image_url` (full post image, not portrait)
   - What's unclear: Whether using a post image as avatar will look acceptable in circular crop
   - Recommendation: Use `object-cover` on the circular avatar — it crops the center. Acceptable for MVP. Could add `object-position: top` as heuristic to prefer face area.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard) |
| Config file | `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run test --run` |
| Full suite command | `cd packages/web && bun run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | Explore에 아티스트 프로필 카드가 표시된다 | unit | `bun run test --run lib/components/explore/TrendingArtistsSection` | ❌ Wave 0 |
| SC-02 | 트렌딩 아티스트 섹션이 추가된다 | unit | `bun run test --run lib/hooks/useTrendingArtists` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run test --run`
- **Per wave merge:** `cd packages/web && bun run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/web/lib/components/explore/__tests__/TrendingArtistsSection.test.tsx` — covers SC-01 (renders cards, handles empty state)
- [ ] `packages/web/lib/hooks/__tests__/useTrendingArtists.test.ts` — covers SC-02 (grouping logic, fallback)

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `packages/web/app/explore/ExploreClient.tsx` — integration point confirmed
- Direct file inspection: `packages/web/lib/components/search/PersonResultCard.tsx` — card pattern
- Direct file inspection: `packages/web/lib/components/detail/ShopCarouselSection.tsx` — horizontal scroll pattern with arrows
- Direct file inspection: `packages/web/lib/components/main/ArtistSpotlightSection.tsx` — snap-x scroll pattern
- Direct file inspection: `packages/web/lib/hooks/useImages.ts` — Supabase query pattern, client-side aggregation model
- Direct file inspection: `packages/web/lib/supabase/types.ts` — `posts.artist_name` field confirmed nullable
- Direct file inspection: `packages/web/lib/components/explore/ExploreFilterBar.tsx` — `setCast()` usage confirmed
- Direct file inspection: `packages/shared/types/search.ts` — SearchResultItem type

### Secondary (MEDIUM confidence)
- Filesystem inspection: `/app/cast/` directory not found — route does not exist, filter store approach recommended

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, no new deps
- Architecture: HIGH — data shape, integration points, and scroll patterns all confirmed by direct code inspection
- Pitfalls: HIGH — cast route absence confirmed by filesystem; null handling confirmed by DB types

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable codebase, no fast-moving deps)
