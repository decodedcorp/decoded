---
title: Image Ratio Improvement Design
owner: human
status: draft
updated: 2026-04-02
tags: [ui]
---

# Image Ratio Improvement Design

**Date:** 2026-04-02
**Branch:** feat/issue-40
**Status:** Draft

## Problem

Post images in decoded have varying aspect ratios (portrait, square, landscape), but all display components use fixed aspect ratios (4:5, 3:4, 1:1) with `object-fit: cover`. This crops images unpredictably, especially landscape images. MasonryGrid uses fake cycling ratios unrelated to actual image dimensions.

## Goals

1. **Zero crop** — every image fully visible
2. **Zero distortion** — no stretching or squishing
3. **Fast rollback** — feature flag per component for A/B testing
4. **No DB changes required** — client-side detection only (Phase 1)

## Non-Goals

- DB schema migration (deferred to Phase 2)
- Server-side image processing / CDN transforms
- Changing grid layout strategies (masonry stays masonry, feed stays feed)

## Strategy: Reddit-Style `object-contain`

Inspired by Reddit's image handling:

```html
<img class="w-full max-h-[100vw] object-contain" width="4284" height="5712" />
```

Core change across all components:

- `object-fit: cover` → `object-fit: contain`
- Add `max-height` constraint per component context
- Add `width`/`height` HTML attributes (client-side detection)
- Dark background on containers absorbs letterbox space

### Why `object-contain`

| Property         | Crop                  | Distortion | Empty space          |
| ---------------- | --------------------- | ---------- | -------------------- |
| `object-cover`   | Yes (fills container) | No         | No                   |
| `object-contain` | No (fits inside)      | No         | Possible (letterbox) |

Letterbox space is nearly invisible on decoded's dark theme.

## Architecture

```
Image URL
    |
    v
useImageDimensions(url)     // Client-side hook
    | Image.onload -> naturalWidth/Height
    | Cache: Map<url, {w,h}> (memory) + localStorage (persist)
    v
HTML attributes             // CLS prevention
    width={w} height={h}
    |
    v
CSS: object-contain + max-height + dark bg
    -> Zero crop, zero distortion
```

## Hook: `useImageDimensions`

**Location:** `packages/web/lib/hooks/useImageDimensions.ts`

```typescript
interface ImageDimensions {
  width: number | undefined;
  height: number | undefined;
  loading: boolean;
}

// Global memory cache (survives re-renders, not re-mounts of entire app)
const memoryCache = new Map<string, { w: number; h: number }>();

function useImageDimensions(url: string | null | undefined): ImageDimensions;
```

**Caching strategy:**

1. Check memory cache (Map) — instant
2. Check localStorage (`img-dims:{urlHash}`) — fast
3. Create `new Image()` → onload → save to both caches
4. Return `{ width, height, loading }`

**localStorage key:** `img-dims:{djb2Hash(url)}` — simple numeric hash to avoid key explosion.
**Cache eviction:** LRU with max 500 entries in localStorage. On overflow, remove oldest 100 entries.

## Component Changes

All changes follow the same pattern:

### FeedCard (`lib/components/FeedCard.tsx`)

```
BEFORE: <div className="aspect-[4/5]">
          <img className="object-cover object-top" />
        </div>

AFTER:  <div className="bg-black">
          <img className="w-full object-contain max-h-[80vh]"
               width={w} height={h} />
        </div>
```

### ExploreCardCell (`lib/components/explore/ExploreCardCell.tsx`)

```
BEFORE: <div className="aspect-[3/4]">
          <Image fill className="object-cover" />
        </div>

AFTER:  <div className="bg-black">
          <Image width={w || 400} height={h || 533}
                 className="w-full object-contain max-h-[60vh]"
                 style={{ objectFit: "contain" }} />
        </div>
```

Note: Switch from Next `<Image fill>` to `<Image width={w} height={h}>` (explicit sizing mode). This keeps Next.js optimization (lazy loading, WebP, srcset) while enabling proper contain behavior. `fill` mode forces absolute positioning which conflicts with `object-contain` + `max-height`.

### MasonryGridItem (`lib/components/main-renewal/MasonryGridItem.tsx`)

```
BEFORE: height = clampHeight(fakeRatio, index)  // HEIGHT_VARIANTS cycling
        <Image fill className="object-cover" />

AFTER:  height = columnWidth * (h / w)  // real ratio-based height
        clamped to min 200px / max 500px
        <Image width={w || 400} height={h || 533}
               className="w-full object-contain"
               style={{ objectFit: "contain" }} />
```

Remove `HEIGHT_VARIANTS` cycling. Card height = column width \* image aspect ratio (h/w), clamped to 200~500px range. When container matches image ratio, `object-contain` produces zero crop and zero letterbox.

### PostsGrid (`lib/components/profile/PostsGrid.tsx`)

```
BEFORE: <div className="aspect-[4/5]">
          <img className="object-cover" />
        </div>

AFTER:  <div className="bg-black">
          <img className="w-full object-contain max-h-[300px]"
               width={w} height={h} />
        </div>
```

### ShopGrid (`lib/components/detail/ShopGrid.tsx`)

**No change.** Product images are intentionally square (`aspect-square`). Products benefit from uniform grid.

### HeroSection (`lib/components/detail/HeroSection.tsx`)

**No change.** Hero is a design-driven full-bleed section, not an image display component.

## Max-Height Values

| Component       | max-height            | Rationale                             |
| --------------- | --------------------- | ------------------------------------- |
| FeedCard        | `80vh`                | Full-screen feel, like Reddit detail  |
| ExploreCardCell | `60vh`                | Grid context, don't dominate page     |
| MasonryGridItem | `500px` / min `200px` | Masonry rhythm, prevent extreme cards |
| PostsGrid       | `300px`               | Compact profile grid                  |

## Feature Flag

```typescript
// lib/config/feature-flags.ts
export const FEATURE_FLAGS = {
  dynamicImageRatio: {
    FeedCard: true,
    ExploreCardCell: true,
    MasonryGridItem: true,
    PostsGrid: true,
  },
} as const;
```

Each component checks its flag:

```typescript
const { width, height } = useImageDimensions(imageUrl);
const useDynamic = FEATURE_FLAGS.dynamicImageRatio.FeedCard;

// If flag off: existing behavior (object-cover, fixed ratio)
// If flag on: new behavior (object-contain, max-height)
```

Rollback = flip flag to `false`. Zero code changes needed.

## Edge Cases

| Case                        | Handling                                                      |
| --------------------------- | ------------------------------------------------------------- |
| Image URL is null/undefined | Show placeholder, skip dimension detection                    |
| Image fails to load         | Fallback to existing fixed ratio + object-cover               |
| Very tall image (>1:2)      | max-height clamps display height                              |
| Very wide image (>3:1)      | object-contain shows full image, dark bg fills vertical space |
| Dimension detection slow    | Show skeleton → render when dimensions known                  |
| localStorage full           | Graceful fallback to memory-only cache                        |

## Transition Behavior

When `useImageDimensions` is loading:

- Show skeleton placeholder (same bg color as container)
- Once dimensions arrive, render image immediately (no animation needed — image was never visible in wrong ratio)

## Phase 2 (Future): DB Backfill

When ready to eliminate client-side detection:

1. Add `width`/`height` to `posts.media_metadata` JSON
2. Backfill script: HEAD request to each R2 image URL → extract dimensions
3. API response includes dimensions
4. `useImageDimensions` checks server data first, falls back to client detection
5. CLS fully eliminated (dimensions known before render)

## Files to Create/Modify

### New Files

- `packages/web/lib/hooks/useImageDimensions.ts` — dimension detection hook
- `packages/web/lib/config/feature-flags.ts` — feature flag config

### Modified Files

- `packages/web/lib/components/FeedCard.tsx` — object-contain + max-height
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — object-contain + max-height
- `packages/web/lib/components/main-renewal/MasonryGridItem.tsx` — real dimensions + contain
- `packages/web/lib/components/profile/PostsGrid.tsx` — object-contain + max-height

### Unchanged Files

- `packages/web/lib/components/detail/ShopGrid.tsx` — intentionally square
- `packages/web/lib/components/detail/HeroSection.tsx` — design-driven hero

## Testing Strategy

1. **Visual QA** — `/design-review` with before/after screenshots
2. **Ratio coverage** — test with portrait, square, landscape, extreme ratio images
3. **Feature flag** — verify flag off = identical to current behavior
4. **Performance** — verify no layout shift (CLS), lazy loading still works
5. **Edge cases** — broken images, slow load, null URLs
