# Suspense Streaming Plan for Home Page (`app/page.tsx`)

**Status:** Analysis Complete — Ready for Implementation  
**Date:** 2026-04-04  
**Scope:** Split blocking home page into independent async server components with Suspense boundaries

---

## Executive Summary

Currently, `app/page.tsx` is a **single async server component** that waits for ALL data fetches to complete before rendering anything:

```javascript
// Lines 80-98: All data fetches are sequentially awaited in parallel
const [popularPosts, recentPosts, magazinePosts, artistProfileMap] = await Promise.all([...])
```

This creates a **single waterfall** where the entire page is blocked until the slowest fetch completes. The solution is to **split data dependencies into separate Suspense boundaries**, allowing independent sections to stream in as data arrives.

---

## 1. Data Fetch Analysis

### Current Data Fetches (lines 80-98)

| Fetch | Purpose | Used By | Response Time |
|-------|---------|---------|---|
| `fetchPosts("sort=popular&per_page=30")` | Popular posts (API with Supabase fallback) | HeroItemSync, EditorialSection, TrendingListSection, MasonryGrid, DomeGallerySection | Medium (REST API call) |
| `fetchPosts("sort=recent&per_page=50")` | Recent posts (API with Supabase fallback) | HeroItemSync (hero carousel), EditorialSection | Medium (REST API call) |
| `fetchPosts("has_magazine=true&per_page=30")` | Magazine posts (API with Supabase fallback) | EditorialMagazine | Medium (REST API call) |
| `buildArtistProfileMap()` | Artist/group warehouse data for enrichment | Used by ALL sections (line 106+) | **Slow** (queries both warehouse.artists + warehouse.groups in parallel) |

**Key Issue:** `buildArtistProfileMap()` is **cached with React.cache()** (warehouse-entities.server.ts:85), so multiple calls in parallel use the same fetch. However, its slow execution blocks everything.

---

## 2. Component Dependency Tree

### What Each Section Needs

```
HeroItemSync (lines 377)
├─ Needs: recentPosts + popularPosts
├─ Uses: heroData.heroImageUrl, galleryImage, galleryLabel
└─ NO artist enrichment (uses raw artist_name/group_name)

EditorialSection + TrendingListSection (lines 382-384, 2-column grid)
├─ EditorialSection needs:
│  ├─ popularPosts (line 299-302: selectEditorialPool)
│  ├─ artistProfileMap (line 331: enrichArtistName)
│  └─ spots + solutions fetched inline (lines 308-326)
├─ TrendingListSection needs:
│  ├─ popularPosts + recentPosts (lines 277-297: artistCounts map)
│  ├─ artistProfileMap (line 294: enrichArtistName)
│  └─ NO separate spots
└─ NOTE: These are currently client components ("use client")

EditorialMagazine (line 387)
├─ Needs: magazinePosts + artistProfileMap
├─ Uses: enrichArtistName for displayName
└─ All data pre-computed in parent

MasonryGrid (line 399)
├─ Needs: popularPosts + artistProfileMap
├─ Uses: enrichArtistName for grid items
└─ Client-side dynamic import (no SSR, min-h-[600px] placeholder)

DomeGallerySection (lines 402-404)
├─ Needs: popularPosts only
├─ Uses: proxyImg(p.image_url) for domeImages
└─ Client-side dynamic import (no SSR, min-h-[400px] placeholder)
```

### Data Sharing Matrix

| Data | HeroSync | Editorial | Trending | Magazine | Masonry | Dome |
|------|----------|-----------|----------|----------|---------|------|
| **recentPosts** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **popularPosts** | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **magazinePosts** | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **artistProfileMap** | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## 3. Suspense Boundary Strategy

### **Grouping 1: Hero Section (Independent)**
- **Sections:** HeroItemSync
- **Data:** `recentPosts`, `popularPosts`
- **Why Separate:** Minimal data, no artist enrichment needed
- **Streaming:** Can render immediately with text fallback
- **Estimated Time:** ~200-300ms

### **Grouping 2: Editorial + Trending (Shared Data Dependency)**
- **Sections:** EditorialSection + TrendingListSection (2-column grid)
- **Data:** `popularPosts`, `recentPosts`, `artistProfileMap`
- **Why Together:** Both depend on `artistProfileMap` for enrichment; currently implemented as 2-column grid (line 381)
- **Blocker:** Waits for `artistProfileMap` (slowest fetch)
- **Estimated Time:** ~800-1200ms (artistProfileMap dominates)

### **Grouping 3: Magazine Section (Independent)**
- **Sections:** EditorialMagazine
- **Data:** `magazinePosts`, `artistProfileMap`
- **Inline Spots:** None (no solutions fetched)
- **Streaming:** Can render as cards load
- **Estimated Time:** ~400-600ms (magazinePosts + artistProfileMap)

### **Grouping 4: Masonry Grid (Client-Side Boundary)**
- **Sections:** DynamicMasonryGrid
- **Data:** `popularPosts`, `artistProfileMap`
- **Already Dynamic:** Uses `ssr: false` + loading placeholder (home-dynamic-sections.tsx:13-16)
- **Streaming:** Already non-blocking via client-side import
- **Estimated Time:** ~400-600ms (client hydration + data)

### **Grouping 5: Dome Gallery (Client-Side Boundary)**
- **Sections:** DomeGallerySection
- **Data:** `popularPosts`
- **Already Dynamic:** Uses `ssr: false` + loading placeholder (home-dynamic-sections.tsx:18-24)
- **Streaming:** Already non-blocking via client-side import
- **Estimated Time:** ~300-500ms (client hydration)

---

## 4. Critical Path Analysis

**Current Behavior (Blocking):**
```
Start → All 4 fetches (Promise.all) → ALL data complete → Render page
         └─ artistProfileMap (~1000ms) blocks everything
```

**Proposed Behavior (Streaming):**
```
Start
├─ HeroItemSync: recentPosts + popularPosts → Render hero (200-300ms)
├─ Editorial+Trending: recentPosts + popularPosts + artistProfileMap → Render grid (800-1200ms)
├─ Magazine: magazinePosts + artistProfileMap → Render magazine (400-600ms)
├─ Masonry: popularPosts + artistProfileMap (client-side, skipped on SSR)
└─ Dome: popularPosts (client-side, skipped on SSR)

Total visible time: ~1200ms (instead of waiting for slowest + render time)
```

---

## 5. Implementation Roadmap

### Phase 1: Refactor Data Fetches into Separate Functions

Create **independent async functions** for each section group:

```typescript
// New functions to add to page.tsx or utils

async function fetchHeroData() {
  return Promise.all([
    fetchPosts("sort=popular&per_page=30", async () => ...),
    fetchPosts("sort=recent&per_page=50", async () => ...),
  ]);
}

async function fetchEditorialData() {
  const [popularPosts, recentPosts, artistProfileMap] = await Promise.all([
    fetchPosts("sort=popular&per_page=30", async () => ...),
    fetchPosts("sort=recent&per_page=50", async () => ...),
    buildArtistProfileMap(),
  ]);
  return { popularPosts, recentPosts, artistProfileMap };
}

async function fetchMagazineData() {
  return Promise.all([
    fetchPosts("has_magazine=true&per_page=30", async () => ...),
    buildArtistProfileMap(),
  ]);
}

// Masonry + Dome use popularPosts + artistProfileMap (already client-dynamic)
```

### Phase 2: Create Separate Server Components

**File Structure to Create:**
```
app/
├── page.tsx                          (main page, layout + top-level Suspense)
├── components/
│   ├── HeroSection.server.tsx        (async, no Suspense needed)
│   ├── EditorialTrendingSection.server.tsx (async with Suspense)
│   ├── MagazineSection.server.tsx    (async with Suspense)
│   └── MasonryDomeSection.server.tsx (client-side, already dynamic)
```

**Example: HeroSection.server.tsx**
```typescript
import { Suspense } from "react";
import { HeroItemSync } from "@/lib/components/main";
import { fetchPosts, ... } from "@/lib/...";

export async function HeroSectionContent() {
  const [popularPosts, recentPosts] = await Promise.all([
    fetchPosts("sort=popular&per_page=30", ...),
    fetchPosts("sort=recent&per_page=50", ...),
  ]);
  
  const heroPosts = [...]; // same logic as current page.tsx
  return <HeroItemSync posts={heroPosts} />;
}

export function HeroSection() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <HeroSectionContent />
    </Suspense>
  );
}
```

### Phase 3: Update Main Page Layout

**Modified page.tsx:**
```typescript
import { Suspense } from "react";
import { HeroSection } from "./components/HeroSection.server";
import { EditorialTrendingSection } from "./components/EditorialTrendingSection.server";
import { MagazineSection } from "./components/MagazineSection.server";

export default async function Home({ searchParams }: {...}) {
  await searchParams;

  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Group 1: Hero — Independent, fast render */}
      <HeroSection />

      {/* Group 2: Editorial + Trending — Waits for artistProfileMap */}
      <EditorialTrendingSection />

      {/* Group 3: Magazine — Independent, can stream separately */}
      <MagazineSection />

      {/* Group 4 & 5: Masonry + Dome — Already client-dynamic, keep as-is */}
      <section className="relative">
        <MasonryGrid items={...} /> {/* client-side dynamic import */}
      </section>

      {domeImages.length > 0 && (
        <DomeGallerySection images={domeImages} /> {/* client-side dynamic import */}
      )}
    </div>
  );
}
```

---

## 6. Skeleton Components

### Current Status
- **No loading.tsx exists** in `/packages/web/app/` (confirmed via glob)
- **Skeleton components exist** but only for admin pages:
  - `/lib/components/admin/dashboard/DashboardSkeleton.tsx`
  - `/lib/components/admin/content/AdminPostTableSkeleton.tsx`
  - `/lib/components/admin/audit/AuditTableSkeleton.tsx`

### Required Skeletons to Create

**HeroSkeleton:**
```typescript
// Placeholder dimensions matching HeroItemSync
// Height: ~500px, simple gradient skeleton
export function HeroSkeleton() {
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-neutral-900 to-neutral-800 animate-pulse" />
  );
}
```

**EditorialSkeleton:**
```typescript
// 2-column grid with skeleton cards
// Left: Large card (300px wide, 400px tall)
// Right: Tall list container (300px wide, 400px tall)
export function EditorialSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8">
      <div className="h-[400px] bg-neutral-800 rounded-xl animate-pulse" />
      <div className="h-[400px] bg-neutral-800 rounded-xl animate-pulse" />
    </div>
  );
}
```

**MagazineSkeleton:**
```typescript
// Horizontal scroll placeholder
// Height: 85vh, show 3-4 card skeletons
export function MagazineSkeleton() {
  return (
    <div className="h-[85vh] flex gap-6 overflow-x-hidden px-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex-none w-[40vw] h-[70vh] bg-neutral-800 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}
```

---

## 7. No Breaking Changes — Client Components

### Important Note on EditorialSection + TrendingListSection

Both are **marked as "use client"** (EditorialSection.tsx:1, TrendingListSection.tsx:1):
- They use React hooks (`useRef`, `useState`, `useEffect`, `useGSAP`)
- They must remain client components
- The **parent wrapper** (EditorialTrendingSection.server.tsx) is async/server
- Data is fetched server-side, passed as props to client components

This is a valid Next.js pattern: **async server parent → client component children**.

---

## 8. Data Dependency Details

### artistProfileMap Usage (Enrichment Function)

Lines 102-111 in current page.tsx:
```typescript
function enrichArtistName(name: string | null | undefined) {
  if (!name) return { displayName: "", profileImageUrl: null };
  const entry = artistProfileMap.get(name.toLowerCase());
  return {
    displayName: entry?.name ?? name,
    profileImageUrl: entry?.profileImageUrl ?? null,
  };
}
```

**Used by:**
1. **Line 212:** EditorialMagazine card enrichment
2. **Line 294:** TrendingListSection keyword enrichment
3. **Line 331:** EditorialSection style card title enrichment
4. **Line 358:** MasonryGrid item title enrichment

**Not used by:**
- HeroItemSync (uses raw artist_name/group_name from line 115)
- DomeGallerySection (uses raw artist_name/group_name from line 372)

### Spots + Solutions (EditorialSection Only)

Lines 305-327: Inline fetch for **editorial main post's spots**:
```typescript
const supabase = await createSupabaseServerClient();
const { data: spots } = await supabase
  .from("spots")
  .select("*, solutions(*)")
  .eq("post_id", editorialMain.id);
```

**This is separate from main data fetches** — can be fetched in EditorialTrendingSection.server.tsx.

---

## 9. Masonry & Dome Gallery (Already Optimized)

Both sections are **already using client-side dynamic imports** (home-dynamic-sections.tsx:5-24):

```typescript
export const DynamicTrendingListSection = dynamic(..., { 
  ssr: false, 
  loading: () => <div className="min-h-[320px]" /> 
});

export const DynamicMasonryGrid = dynamic(..., { 
  ssr: false, 
  loading: () => <div className="min-h-[600px]" /> 
});

export const DynamicDomeGallerySection = dynamic(..., { 
  ssr: false, 
  loading: () => <div className="min-h-[400px]" /> 
});
```

**These are NOT blocking the page** — they already stream client-side. Keep them as-is in the refactored page.tsx.

---

## 10. Implementation Checklist

### Pre-Implementation
- [ ] Review this plan with team
- [ ] Confirm performance targets (e.g., "hero renders in <300ms")
- [ ] Decide on skeleton animation style (fade, pulse, shimmer)

### Component Creation Phase
- [ ] Create `app/components/HeroSection.server.tsx`
- [ ] Create `app/components/EditorialTrendingSection.server.tsx`
- [ ] Create `app/components/MagazineSection.server.tsx`
- [ ] Create skeleton components in `lib/components/skeletons/`
  - [ ] HeroSkeleton
  - [ ] EditorialTrendingSkeleton
  - [ ] MagazineSkeleton

### Refactor Phase
- [ ] Extract `fetchHeroData()` helper
- [ ] Extract `fetchEditorialData()` helper
- [ ] Extract `fetchMagazineData()` helper
- [ ] Move enrichment logic into sections
- [ ] Move spots fetch into EditorialTrendingSection

### Testing Phase
- [ ] Verify no data fetch duplications (use React DevTools Profiler)
- [ ] Check CLS (Cumulative Layout Shift) with skeletons
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Verify correct data dependencies (no missing props)

### Performance Validation
- [ ] Measure FCP (First Contentful Paint) — should decrease
- [ ] Measure LCP (Largest Contentful Paint) — may shift to hero image
- [ ] Measure TTFB (Time to First Byte) — should stay same
- [ ] Compare before/after with Lighthouse

---

## 11. Files to Modify / Create

### Modify
- `/packages/web/app/page.tsx` — Simplify to use new components

### Create
- `/packages/web/app/components/HeroSection.server.tsx` — New async server component
- `/packages/web/app/components/EditorialTrendingSection.server.tsx` — New async server component
- `/packages/web/app/components/MagazineSection.server.tsx` — New async server component
- `/packages/web/lib/components/skeletons/HeroSkeleton.tsx` — New skeleton
- `/packages/web/lib/components/skeletons/EditorialTrendingSkeleton.tsx` — New skeleton
- `/packages/web/lib/components/skeletons/MagazineSkeleton.tsx` — New skeleton

### Keep As-Is
- `home-dynamic-sections.tsx` — Already optimized with `ssr: false`
- `EditorialSection.tsx` — Already a client component, no changes needed
- `TrendingListSection.tsx` — Already a client component, no changes needed
- `EditorialMagazine.tsx` — Already client-based, no changes needed
- `MasonryGrid.tsx` — Keep dynamic import
- `DomeGallerySection.tsx` — Keep dynamic import

---

## 12. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Data duplication in artistProfileMap (cached) | React.cache() already handles deduplication; verify in DevTools |
| EditorialSection spots fetch timing | Move into EditorialTrendingSection, coordinate with artistProfileMap fetch |
| Masonry/Dome still client-rendered | Already optimized; data props passed server-side, rendered client-side |
| Layout shift from skeletons | Design skeletons to match final dimensions exactly |
| Browser cache affecting measurements | Use incognito mode + disable cache during testing |

---

## 13. Success Metrics

After implementation:
- [ ] **Hero renders with real content in <300ms** (currently blocks on all data)
- [ ] **Editorial+Trending renders in <1200ms** (same as current, but doesn't block hero)
- [ ] **Magazine can render independently** (parallel to editorial)
- [ ] **No additional HTTP requests** (same data fetches, better waterfall)
- [ ] **CLS near zero** (skeletons match final layout)
- [ ] **LCP <= 2.5s** (Lighthouse green)

---

## 14. Notes

1. **Searchparams handling** (line 77: `await searchParams;`) — Keep at page level, pass down if needed.

2. **Image proxy function** (lines 38-39) — Can be kept in page.tsx or moved to utils.

3. **proxyImg calls** — Each section will continue to call this for image URL rewriting.

4. **React Router context** — No routing state, so no additional Suspense complexity.

5. **Future: Prefetch editorial spots** — Could add `prefetchQuery` for spots if page becomes even slower.

