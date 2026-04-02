# Image Ratio Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed aspect ratios and `object-cover` with Reddit-style `object-contain` + `max-height` so every post image is fully visible with zero crop and zero distortion.

**Architecture:** Client-side `useImageDimensions` hook detects image dimensions via `Image.onload`, caches in memory + localStorage. Each component switches from `object-cover` to `object-contain` with a per-component `max-height`. Feature flags enable per-component rollback.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/web/lib/hooks/useImageDimensions.ts` | Client-side dimension detection + caching |
| Create | `packages/web/lib/config/feature-flags.ts` | Per-component feature flag config |
| Modify | `packages/web/lib/components/FeedCard.tsx` | object-contain + max-h-[80vh] |
| Modify | `packages/web/lib/components/explore/ExploreCardCell.tsx` | object-contain + max-h-[60vh] |
| Modify | `packages/web/lib/components/main-renewal/MasonryGridItem.tsx` | Real ratio heights + contain |
| Modify | `packages/web/lib/components/profile/PostsGrid.tsx` | object-contain + max-h-[300px] |

---

### Task 1: Feature Flags Config

**Files:**
- Create: `packages/web/lib/config/feature-flags.ts`

- [ ] **Step 1: Create feature flags file**

```typescript
// packages/web/lib/config/feature-flags.ts

/**
 * Per-component feature flags for image ratio improvement.
 * Set to false to instantly rollback to original object-cover behavior.
 */
export const FEATURE_FLAGS = {
  dynamicImageRatio: {
    FeedCard: true,
    ExploreCardCell: true,
    MasonryGridItem: true,
    PostsGrid: true,
  },
} as const;

export type DynamicImageRatioComponent = keyof typeof FEATURE_FLAGS.dynamicImageRatio;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to feature-flags.ts

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/config/feature-flags.ts
git commit -m "feat: add feature flags for dynamic image ratio"
```

---

### Task 2: useImageDimensions Hook

**Files:**
- Create: `packages/web/lib/hooks/useImageDimensions.ts`

- [ ] **Step 1: Create the hook**

```typescript
// packages/web/lib/hooks/useImageDimensions.ts
"use client";

import { useState, useEffect } from "react";

export interface ImageDimensions {
  width: number | undefined;
  height: number | undefined;
  loading: boolean;
}

/** Simple djb2 string hash → positive integer */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned 32-bit
}

// ── Caches ──────────────────────────────────────────────────────────

const memoryCache = new Map<string, { w: number; h: number }>();

const LS_PREFIX = "img-dims:";
const LS_MAX_ENTRIES = 500;
const LS_EVICT_COUNT = 100;

function lsKey(url: string): string {
  return `${LS_PREFIX}${djb2Hash(url)}`;
}

function readLS(url: string): { w: number; h: number } | null {
  try {
    const raw = localStorage.getItem(lsKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.w === "number" && typeof parsed.h === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLS(url: string, w: number, h: number): void {
  try {
    // Evict old entries if at capacity
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(LS_PREFIX)) keys.push(k);
    }
    if (keys.length >= LS_MAX_ENTRIES) {
      // Remove oldest entries (first inserted = first in iteration order)
      keys.slice(0, LS_EVICT_COUNT).forEach((k) => localStorage.removeItem(k));
    }
    localStorage.setItem(lsKey(url), JSON.stringify({ w, h }));
  } catch {
    // localStorage full or unavailable — memory cache still works
  }
}

// ── Inflight dedup ──────────────────────────────────────────────────

const inflight = new Map<string, Promise<{ w: number; h: number }>>();

function detectDimensions(url: string): Promise<{ w: number; h: number }> {
  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const dims = { w: img.naturalWidth, h: img.naturalHeight };
      memoryCache.set(url, dims);
      writeLS(url, dims.w, dims.h);
      inflight.delete(url);
      resolve(dims);
    };
    img.onerror = () => {
      inflight.delete(url);
      reject(new Error(`Failed to load: ${url}`));
    };
    img.src = url;
  });

  inflight.set(url, promise);
  return promise;
}

// ── Hook ────────────────────────────────────────────────────────────

/**
 * Detects image dimensions client-side with memory + localStorage caching.
 *
 * Returns `{ width, height, loading }`.
 * - While loading: width/height are undefined, loading is true.
 * - After load: width/height are set, loading is false.
 * - On error: width/height stay undefined, loading is false.
 */
export function useImageDimensions(
  url: string | null | undefined
): ImageDimensions {
  const [dims, setDims] = useState<ImageDimensions>(() => {
    if (!url) return { width: undefined, height: undefined, loading: false };

    // Sync: check memory cache
    const mem = memoryCache.get(url);
    if (mem) return { width: mem.w, height: mem.h, loading: false };

    // Sync: check localStorage
    if (typeof window !== "undefined") {
      const ls = readLS(url);
      if (ls) {
        memoryCache.set(url, ls);
        return { width: ls.w, height: ls.h, loading: false };
      }
    }

    return { width: undefined, height: undefined, loading: true };
  });

  useEffect(() => {
    if (!url) return;

    // Already resolved from initializer
    if (dims.width !== undefined && !dims.loading) return;

    let cancelled = false;
    detectDimensions(url)
      .then(({ w, h }) => {
        if (!cancelled) setDims({ width: w, height: h, loading: false });
      })
      .catch(() => {
        if (!cancelled)
          setDims({ width: undefined, height: undefined, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return dims;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to useImageDimensions.ts

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/hooks/useImageDimensions.ts
git commit -m "feat: add useImageDimensions hook with memory + localStorage cache"
```

---

### Task 3: FeedCard — object-contain

**Files:**
- Modify: `packages/web/lib/components/FeedCard.tsx:1-4` (imports)
- Modify: `packages/web/lib/components/FeedCard.tsx:218-232` (image container)

- [ ] **Step 1: Add imports**

At the top of `FeedCard.tsx`, after the existing imports (around line 15), add:

```typescript
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
```

- [ ] **Step 2: Use the hook inside the component**

Inside the `FeedCardInner` function body (after existing hooks around line 80), add:

```typescript
const { width: imgW, height: imgH } = useImageDimensions(imageUrl);
const useDynamicRatio = FEATURE_FLAGS.dynamicImageRatio.FeedCard;
```

- [ ] **Step 3: Replace the image container**

Replace lines 218-232 (the image container block):

```
{/* Image container - 4:5 aspect ratio like Instagram */}
<div className="relative aspect-[4/5] bg-muted">
  {imageUrl && !imageError ? (
    <img
      src={imageUrl}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      alt={`Image ${id}`}
      className={`h-full w-full object-cover object-top transition-opacity duration-200 ease-out ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
      onError={() => setImageError(true)}
      onLoad={() => setIsLoaded(true)}
    />
  ) : (
    <div className="h-full w-full bg-muted" />
  )}
```

With:

```tsx
{/* Image container — dynamic ratio with object-contain */}
<div className={cn(
  "relative bg-black",
  !useDynamicRatio && "aspect-[4/5] bg-muted"
)}>
  {imageUrl && !imageError ? (
    <img
      src={imageUrl}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      alt={`Image ${id}`}
      {...(useDynamicRatio && imgW && imgH ? { width: imgW, height: imgH } : {})}
      className={cn(
        "transition-opacity duration-200 ease-out",
        isLoaded ? "opacity-100" : "opacity-0",
        useDynamicRatio
          ? "w-full object-contain max-h-[80vh]"
          : "h-full w-full object-cover object-top"
      )}
      onError={() => setImageError(true)}
      onLoad={() => setIsLoaded(true)}
    />
  ) : (
    <div className={cn(
      "w-full bg-neutral-900",
      useDynamicRatio ? "aspect-[3/4]" : "h-full bg-muted"
    )} />
  )}
```

- [ ] **Step 4: Verify build**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/FeedCard.tsx
git commit -m "feat(FeedCard): switch to object-contain with max-height"
```

---

### Task 4: ExploreCardCell — object-contain

**Files:**
- Modify: `packages/web/lib/components/explore/ExploreCardCell.tsx:1-11` (imports)
- Modify: `packages/web/lib/components/explore/ExploreCardCell.tsx:85-100` (image block)

- [ ] **Step 1: Add imports**

After existing imports (around line 11), add:

```typescript
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
```

- [ ] **Step 2: Use hook in component**

Inside the `ExploreCardCell` function body (after line 30 `const [isLoaded, setIsLoaded] = useState(false);`), add:

```typescript
const { width: imgW, height: imgH } = useImageDimensions(imageUrl);
const useDynamicRatio = FEATURE_FLAGS.dynamicImageRatio.ExploreCardCell;
```

Note: `imageUrl` is from `item` — check what property name it uses. Looking at the code, it uses `item` from `ItemConfig`. Find the image URL field name and use that.

- [ ] **Step 3: Replace image block**

Replace lines 87-100 (the article with Image):

```
<article
  data-flip-id={`card-${imageId}`}
  className="relative aspect-[3/4] bg-muted"
>
  <Image
    src={imageUrl}
    alt={`Image ${imageId}`}
    fill
    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
    className={`object-cover transition-opacity duration-150 ease-out ${
      isLoaded ? "opacity-100" : "opacity-0"
    }`}
    priority={isTopImage}
    onError={() => setImageError(true)}
    onLoad={() => setIsLoaded(true)}
  />
```

With:

```tsx
<article
  data-flip-id={`card-${imageId}`}
  className={cn(
    "relative bg-black",
    !useDynamicRatio && "aspect-[3/4] bg-muted"
  )}
>
  {useDynamicRatio ? (
    <img
      src={imageUrl}
      alt={`Image ${imageId}`}
      {...(imgW && imgH ? { width: imgW, height: imgH } : {})}
      loading={isTopImage ? "eager" : "lazy"}
      fetchPriority={isTopImage ? "high" : "auto"}
      className={cn(
        "w-full object-contain max-h-[60vh] transition-opacity duration-150 ease-out",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
      onError={() => setImageError(true)}
      onLoad={() => setIsLoaded(true)}
    />
  ) : (
    <Image
      src={imageUrl}
      alt={`Image ${imageId}`}
      fill
      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={`object-cover transition-opacity duration-150 ease-out ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
      priority={isTopImage}
      onError={() => setImageError(true)}
      onLoad={() => setIsLoaded(true)}
    />
  )}
```

Note: Add `import { cn } from "@/lib/utils";` if not already imported.

- [ ] **Step 4: Verify build**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/explore/ExploreCardCell.tsx
git commit -m "feat(ExploreCardCell): switch to object-contain with max-height"
```

---

### Task 5: MasonryGridItem — real dimensions

**Files:**
- Modify: `packages/web/lib/components/main-renewal/MasonryGridItem.tsx:1-32` (imports + height calc)
- Modify: `packages/web/lib/components/main-renewal/MasonryGridItem.tsx:153-168` (render)

- [ ] **Step 1: Add imports**

After existing imports (around line 8), add:

```typescript
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
```

- [ ] **Step 2: Add dynamic height calculation**

After the existing `clampHeight` function (line 32), add:

```typescript
/** Calculate card height from real image dimensions, clamped to 200-500px range */
function realHeight(imgW: number | undefined, imgH: number | undefined, columnWidth: number): number {
  if (!imgW || !imgH) return 320; // fallback
  const ratio = imgH / imgW;
  const height = Math.round(columnWidth * ratio);
  return Math.min(500, Math.max(200, height));
}
```

- [ ] **Step 3: Use hook and dynamic height in component**

Inside the `MasonryGridItem` function body, before the existing `const height = ...` line, add:

```typescript
const { width: imgW, height: imgH } = useImageDimensions(item.imageUrl);
const useDynamicRatio = FEATURE_FLAGS.dynamicImageRatio.MasonryGridItem;
```

Replace the existing height calculation:

```
const height = clampHeight(item.aspectRatio ?? 1, index);
```

With:

```typescript
const height = useDynamicRatio
  ? realHeight(imgW, imgH, 280) // 280px approximate column width
  : clampHeight(item.aspectRatio ?? 1, index);
```

- [ ] **Step 4: Replace Image render**

Replace lines 162-168 (the Image element):

```
<Image
  src={item.imageUrl}
  alt={item.title}
  fill
  className="object-cover transition-transform duration-500 group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

With:

```tsx
{useDynamicRatio ? (
  <img
    src={item.imageUrl}
    alt={item.title}
    {...(imgW && imgH ? { width: imgW, height: imgH } : {})}
    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
    loading="lazy"
  />
) : (
  <Image
    src={item.imageUrl}
    alt={item.title}
    fill
    className="object-cover transition-transform duration-500 group-hover:scale-105"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  />
)}
```

- [ ] **Step 5: Verify build**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/main-renewal/MasonryGridItem.tsx
git commit -m "feat(MasonryGridItem): use real image dimensions for card height"
```

---

### Task 6: PostsGrid — object-contain

**Files:**
- Modify: `packages/web/lib/components/profile/PostsGrid.tsx`

- [ ] **Step 1: Add imports**

After existing imports (around line 6), add:

```typescript
import { useImageDimensions } from "@/lib/hooks/useImageDimensions";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
```

- [ ] **Step 2: Create a wrapper component for each grid item**

The current PostsGrid renders items inline in a `.map()`. We need `useImageDimensions` per item, which requires a component boundary. Add before the `PostsGrid` function:

```typescript
function PostsGridItem({ post }: { post: PostItem }) {
  const { width: imgW, height: imgH } = useImageDimensions(post.imageUrl);
  const useDynamicRatio = FEATURE_FLAGS.dynamicImageRatio.PostsGrid;

  return (
    <Link
      href={`/posts/${post.id}`}
      className={cn(
        "group relative rounded-lg overflow-hidden",
        useDynamicRatio ? "bg-black" : "aspect-[4/5] bg-muted"
      )}
    >
      <img
        src={post.imageUrl}
        alt={post.title || "Post"}
        {...(useDynamicRatio && imgW && imgH ? { width: imgW, height: imgH } : {})}
        className={cn(
          "transition-transform duration-300 group-hover:scale-105",
          useDynamicRatio
            ? "w-full object-contain max-h-[300px]"
            : "h-full w-full object-cover"
        )}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium text-white truncate">
          {post.title}
        </p>
        <p className="text-[10px] text-white/70">{post.itemCount} items</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Update PostsGrid to use the new component**

Replace the grid rendering (lines 54-76):

```
<div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
  {displayPosts.map((post) => (
    <Link
      key={post.id}
      href={`/posts/${post.id}`}
      className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-muted"
    >
      <img
        src={post.imageUrl}
        alt={post.title || "Post"}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium text-white truncate">
          {post.title}
        </p>
        <p className="text-[10px] text-white/70">{post.itemCount} items</p>
      </div>
    </Link>
  ))}
</div>
```

With:

```tsx
<div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
  {displayPosts.map((post) => (
    <PostsGridItem key={post.id} post={post} />
  ))}
</div>
```

- [ ] **Step 4: Verify build**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/profile/PostsGrid.tsx
git commit -m "feat(PostsGrid): switch to object-contain with max-height"
```

---

### Task 7: Visual QA — Before/After Verification

- [ ] **Step 1: Start dev server**

Run: `cd packages/web && bun dev`

- [ ] **Step 2: Check each page visually**

Open in browser and verify:
- `/` (main page) — MasonryGrid items show full images, no crop
- `/explore` — ExploreCardCell shows full images, dark bg absorbs letterbox
- `/posts/{id}` — FeedCard shows full image with max-h constraint
- Profile page — PostsGrid items show full images

- [ ] **Step 3: Test feature flag rollback**

In `packages/web/lib/config/feature-flags.ts`, set all flags to `false`.
Verify all components revert to original fixed-ratio + object-cover behavior.
Then set flags back to `true`.

- [ ] **Step 4: Test edge cases**

- Refresh page — images should load from localStorage cache (instant)
- Open DevTools → Application → Local Storage — verify `img-dims:*` keys exist
- Test with slow network (DevTools throttle) — skeleton shows, then image appears
- Very tall/wide images display correctly within max-height constraints

- [ ] **Step 5: Commit any adjustments**

```bash
git add -A
git commit -m "fix: visual QA adjustments for image ratio improvement"
```

(Skip this commit if no adjustments were needed.)
