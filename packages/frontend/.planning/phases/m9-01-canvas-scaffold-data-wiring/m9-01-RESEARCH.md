# Phase m9-01: Canvas Scaffold & Data Wiring - Research

**Researched:** 2026-03-19
**Domain:** Next.js App Router, React, Supabase server queries, deterministic PRNG scatter layout
**Confidence:** HIGH

## Summary

This phase builds `/lab/main-d` — a dark canvas with polaroid-style sticker cards scattered deterministically from real post data. The codebase already contains virtually everything needed: the `main-b` pattern provides the exact dark canvas background, grain texture SVG, BottomNav component, and server query architecture. The primary new work is (1) writing a multi-post server query, (2) implementing a djb2-seeded PRNG for deterministic scatter layout, and (3) building the `PolaroidCard` component with white border and rotation.

All dependencies (Next.js, React, Tailwind, Supabase) are already installed. No new packages are required. The implementation is a direct extension of patterns already proven in `main-b`.

**Primary recommendation:** Clone the `main-b` page/query/component structure into `main-d`, extend the server query to fetch 8-15 posts instead of 1, and implement djb2 seeded scatter as a pure utility function used at render time (SSR-safe, no Math.random()).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Background: #0d0d0d + SVG feTurbulence grain overlay (reuse main-b inline SVG pattern)
- Lenis smooth scroll: NOT needed this phase — canvas fits viewport, overflow-y-auto for mobile fallback
- Polaroid card style: white border ~4-6px, thicker bottom margin, drop-shadow, rotation -12° to +12°
- Card size: `clamp(100px, 15vw, 220px)` — seed-based size variation allowed
- Scatter engine: djb2 hash on post.id — deterministic position/rotation/z-index, no Math.random()
- Grid zones: 3x3 or 4x3 canvas zones with random offset within each zone
- Card overlap: allowed (collage feel)
- Data source: extend `fetchMainBPostServer` pattern to fetch 8-15 posts + items
- BottomNav: reuse main-b BottomNav component (copy or shared extraction)
- Nav items: Home, Search, Editorial, Profile (same as main-b)
- File structure: `lib/components/main-d/` directory

### Claude's Discretion

- Exact component split (monolithic vs granular)
- Precise scatter algorithm implementation details
- Card count and loading strategy
- Whether to extract BottomNav as shared or copy it

### Deferred Ideas (OUT OF SCOPE)

- StickerPeel animation → m9-02
- GSAP Draggable interaction → m9-02
- Hover lift effect → m9-02
- DECODED wordmark → m9-03
- Neon decorators → m9-03
- Speech bubble price tags → m9-03
- Tape/washi decorators → m9-03
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                             | Research Support                                                                                    |
| ------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| CANV-01 | `/lab/main-d` renders dark canvas (#0d0d0d) + SVG feTurbulence grain background         | main-b grain SVG pattern (MainPageB.tsx line 57) is directly reusable verbatim                      |
| CANV-02 | Post images displayed as polaroid sticker cards (white border, random rotation, shadow) | New `PolaroidCard` component — pattern derived from main-b `CropItem`, extended with polaroid frame |
| CANV-03 | Cards scattered via djb2 seed-based deterministic layout, SSR hydration-safe            | djb2 utility + zone-based scatter algorithm — pure function, no DOM dependency                      |
| DATA-01 | Real server data from existing queries (posts, items, trending keywords)                | Extend `fetchMainBPostServer` pattern in new `main-d.server.ts` — fetch 8-15 images with items      |
| DATA-02 | Bottom navigation displayed, reusing main-b LabBottomNav pattern                        | `BottomNav` function in MainPageB.tsx is self-contained, can be copied or extracted                 |

</phase_requirements>

## Standard Stack

### Core (all already installed)

| Library      | Version | Purpose                                            | Why Standard               |
| ------------ | ------- | -------------------------------------------------- | -------------------------- |
| Next.js      | 16.0.7  | App Router page + `force-dynamic` server component | Existing project framework |
| React        | 18.3.1  | Client components for canvas                       | Existing project           |
| TypeScript   | 5.9.3   | Type safety for card data + scatter positions      | Existing project           |
| Tailwind CSS | 3.4.18  | Utility classes for layout                         | Existing project           |
| Supabase JS  | 2.86.0  | Server-side DB queries                             | Existing project pattern   |

### No New Packages Required

The CONTEXT.md decision log confirms: "All required tools already in project." GSAP 3.13.0 and Lenis 1.3.15 are installed but NOT used in this phase (deferred to m9-02/m9-03).

## Architecture Patterns

### Recommended Project Structure

```
packages/web/
├── app/lab/main-d/
│   └── page.tsx                  # Server component, fetches data, renders MainPageD
└── lib/
    ├── components/main-d/
    │   ├── MainPageD.tsx          # Root client component, canvas container + BottomNav
    │   ├── StickerCanvas.tsx      # Absolute-positioned card layer
    │   ├── PolaroidCard.tsx       # Individual polaroid sticker card
    │   ├── BottomNav.tsx          # Copied from main-b (or import from main-b)
    │   ├── types.ts               # MainDPost, MainDItem, ScatterPosition types
    │   └── index.ts               # Barrel exports
    └── supabase/queries/
        └── main-d.server.ts       # Multi-post fetch, mirrors main-b.server.ts pattern
```

### Pattern 1: Server Page → Client Component Data Handoff

**What:** Server component (`page.tsx`) fetches data at request time, passes as props to `"use client"` component. Used in main-b.
**When to use:** Always for this phase — SSR data ensures hydration-safe deterministic scatter.
**Example:**

```typescript
// app/lab/main-d/page.tsx
import { MainPageD } from "@/lib/components/main-d";
import { fetchMainDPostsServer } from "@/lib/supabase/queries/main-d.server";

export const dynamic = "force-dynamic";

export default async function MainDPage() {
  const posts = await fetchMainDPostsServer();
  if (!posts?.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-white/50">
        <p>No posts found.</p>
      </div>
    );
  }
  return <MainPageD posts={posts} />;
}
```

### Pattern 2: djb2 Seeded PRNG — Deterministic Scatter

**What:** Pure function that converts a string ID into a reproducible sequence of pseudo-random numbers. No `Math.random()` — identical output on SSR and client.
**When to use:** Any time a "random" position/rotation/z-index must be stable across renders.
**Example:**

```typescript
// lib/components/main-d/scatter.ts

/** djb2 hash: converts string to 32-bit unsigned integer */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash;
}

/** Returns a float in [0, 1) derived from a seed string + salt index */
function seededRandom(seed: string, salt: number): number {
  return (djb2(seed + String(salt)) % 10000) / 10000;
}

export interface ScatterPosition {
  top: string; // CSS %
  left: string; // CSS %
  rotate: number; // degrees
  zIndex: number;
  width: string; // clamp expression
}

const COLS = 4;
const ROWS = 3;

export function computeScatterPosition(
  id: string,
  index: number,
): ScatterPosition {
  // Zone assignment based on index, offset by seed
  const zoneCol = index % COLS;
  const zoneRow = Math.floor(index / COLS) % ROWS;

  // Zone boundaries in %
  const zoneW = 100 / COLS; // 25%
  const zoneH = 100 / ROWS; // ~33.3%

  // Random offset within zone
  const xOffset = seededRandom(id, 1) * zoneW * 0.7;
  const yOffset = seededRandom(id, 2) * zoneH * 0.7;

  const left = zoneCol * zoneW + xOffset;
  const top = zoneRow * zoneH + yOffset;

  // Rotation: -12 to +12 degrees
  const rotate = (seededRandom(id, 3) - 0.5) * 24;

  // z-index: 1–20
  const zIndex = Math.floor(seededRandom(id, 4) * 20) + 1;

  // Size variation: some cards slightly larger/smaller
  const sizeVariant = 0.85 + seededRandom(id, 5) * 0.35; // 0.85–1.2x
  const minPx = Math.round(100 * sizeVariant);
  const maxPx = Math.round(220 * sizeVariant);
  const width = `clamp(${minPx}px, ${Math.round(15 * sizeVariant)}vw, ${maxPx}px)`;

  return {
    top: `${top.toFixed(1)}%`,
    left: `${left.toFixed(1)}%`,
    rotate,
    zIndex,
    width,
  };
}
```

### Pattern 3: Polaroid Card Component

**What:** Each card is a white-bordered photo frame with bottom padding for the polaroid look. Position/rotation from `computeScatterPosition`.
**When to use:** One instance per post in `StickerCanvas`.
**Example:**

```typescript
// lib/components/main-d/PolaroidCard.tsx
"use client";

import Image from "next/image";
import type { ScatterPosition } from "./scatter";

interface PolaroidCardProps {
  imageUrl: string;
  alt: string;
  position: ScatterPosition;
}

export function PolaroidCard({ imageUrl, alt, position }: PolaroidCardProps) {
  return (
    <div
      className="absolute"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: position.zIndex,
        transform: `rotate(${position.rotate}deg)`,
        // Polaroid frame: white background, thick bottom padding
        background: "#ffffff",
        padding: "5px 5px 22px 5px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)",
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width:768px) 30vw, 15vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
```

### Pattern 4: Multi-Post Server Query (new main-d.server.ts)

**What:** Extends `fetchMainBPostServer` logic to fetch multiple images (8-15) with their post data.
**Key difference from main-b:** Returns array of posts, not a single post. Uses `SHARED_SUPABASE_URL` env like main-b.
**When to use:** Called in `page.tsx` during SSR.

The query strategy: fetch a batch of eligible `image_id`s (images with `with_items = false` OR images from the `item` table with crop paths), deduplicate, randomize selection at the server level, then fetch image URLs and post metadata. The `Math.random()` for server-side selection is fine — only the card scatter positions (client-visible) must be deterministic.

### Pattern 5: Grain Texture SVG (verbatim reuse)

**What:** Inline SVG with `feTurbulence` filter used as `backgroundImage` on an overlay div.
**Source:** MainPageB.tsx line 55-60 — copy verbatim.

```typescript
// Verbatim from main-b — proven working
backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
```

### Pattern 6: BottomNav Reuse

**What:** The `BottomNav` function in `MainPageB.tsx` (lines 104-141) is self-contained with no imports from the rest of main-b. It can be directly copied to `main-d/BottomNav.tsx` or imported from main-b.
**Decision for planner:** Copy (avoids cross-component directory coupling) unless a shared extraction is warranted. The CONTEXT.md marks this as Claude's Discretion.

### Anti-Patterns to Avoid

- **Using Math.random() for card positions:** Cards would differ between SSR and client hydration, causing React hydration mismatch errors.
- **CSS animations or transitions for initial placement:** Card positions should be static on first render; animation is m9-02 scope.
- **`force-static` export:** The page needs `force-dynamic` — data changes, and we want fresh posts on each load.
- **Fetching posts client-side:** The scatter must be deterministic from server render. Data passed as props ensures SSR/client match.
- **Single image_url per card:** Each polaroid card represents a post's image (the `image.image_url` field in the shared DB), not a cropped item image. This is different from main-b which uses `item.cropped_image_path`.

## Don't Hand-Roll

| Problem          | Don't Build                  | Use Instead                           | Why                                     |
| ---------------- | ---------------------------- | ------------------------------------- | --------------------------------------- |
| Grain texture    | Custom canvas noise          | SVG feTurbulence (already in main-b)  | Proven, GPU-accelerated, no JS          |
| Seeded random    | Full LCG or Mersenne Twister | djb2 hash (25 lines)                  | Sufficient quality for scatter, simpler |
| Bottom nav       | New component                | Copy from main-b BottomNav            | Identical requirements, battle-tested   |
| Multi-post fetch | New Supabase schema          | Extend `fetchMainBPostServer` pattern | Same DB tables, same auth pattern       |

**Key insight:** This phase is ~80% composition of existing patterns. New code is only the djb2 scatter utility and PolaroidCard frame.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch from Math.random()

**What goes wrong:** Card positions differ between server render and client hydration — React logs hydration warnings, layout jumps on page load.
**Why it happens:** `Math.random()` produces different values on each call, so SSR and client generate different positions.
**How to avoid:** Only use `computeScatterPosition(post.id, index)` — the djb2 function. Never call `Math.random()` in scatter logic.
**Warning signs:** Console shows "Text content did not match" or layout visibly shifts after page load.

### Pitfall 2: Cards Clipped at Canvas Edges

**What goes wrong:** Cards positioned at high % values (e.g., left: 92%) overflow the canvas container.
**Why it happens:** Scatter algorithm doesn't account for card width when placing at the right/bottom edge.
**How to avoid:** Cap `left` at ~80% and `top` at ~82% in `computeScatterPosition`. The zone-based approach (COLS=4, ROWS=3) naturally limits to ~75% before offset is added — keep zone + offset sum ≤ 85%.
**Warning signs:** Partial cards at edges, horizontal scrollbar appearing.

### Pitfall 3: `overflow: hidden` Cutting Off Cards

**What goes wrong:** The canvas container's `overflow: hidden` clips rotated cards whose corners extend beyond the bounding box.
**Why it happens:** CSS transform rotation expands the visual footprint of rotated elements.
**How to avoid:** Use `overflow: visible` on the canvas container while keeping `overflow: hidden` only on the outermost page wrapper for scroll containment.

### Pitfall 4: Image Loading Performance — 15 Images at Once

**What goes wrong:** 15 unconstrained `fill` images all load immediately, causing slow TTI and layout shift.
**Why it happens:** No priority or lazy loading strategy.
**How to avoid:** Set `priority` only on the 2-3 cards in the visible zone (index 0-2). All others get default lazy loading (Next.js Image default). Use `sizes` prop correctly for each card's `width` CSS value.

### Pitfall 5: SHARED_SUPABASE env vars missing

**What goes wrong:** `main-d.server.ts` throws "Missing SHARED_SUPABASE_URL" in dev/prod.
**Why it happens:** The pipeline DB (shared schema with `image`, `item`, `post`, `post_image` tables) uses different env vars than the PRD DB.
**How to avoid:** Mirror the `getSharedClient()` pattern from `main-b.server.ts` exactly — it already has the fallback to `NEXT_PUBLIC_SUPABASE_URL`.

### Pitfall 6: post.id vs image.id as Scatter Seed

**What goes wrong:** Using `image.id` (UUID) as seed but card index doesn't match, leading to clustering.
**Why it happens:** Image IDs are sequential UUIDs — their hash values cluster in similar ranges.
**How to avoid:** Use `post.id + String(index)` as the combined seed input to djb2. The index salt ensures different output per card even if post IDs happen to hash similarly.

## Code Examples

Verified patterns from existing codebase:

### Grain Texture Overlay (from MainPageB.tsx)

```typescript
// Source: packages/web/lib/components/main-b/MainPageB.tsx lines 54-61
<div
  className="absolute inset-0 pointer-events-none z-20"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat",
  }}
/>
```

### BottomNav (from MainPageB.tsx — copy verbatim)

```typescript
// Source: packages/web/lib/components/main-b/MainPageB.tsx lines 104-141
// Glass morphism pill nav with neon yellow hover accent
// Nav items: Home (/), Search (/search), Editorial (/editorial), Profile (/profile)
// Lucide icons: Home, Search, BookOpen, User
```

### Server Page Pattern (from main-b/page.tsx)

```typescript
// Source: packages/web/app/lab/main-b/page.tsx
export const dynamic = "force-dynamic";

export default async function MainDPage() {
  const posts = await fetchMainDPostsServer(); // returns array instead of single
  // ...render MainPageD
}
```

### Shared DB Client Pattern (from main-b.server.ts)

```typescript
// Source: packages/web/lib/supabase/queries/main-b.server.ts lines 10-24
function getSharedClient() {
  const url =
    process.env.SHARED_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SHARED_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("[main-d] Missing SHARED_SUPABASE_URL ...");
  return createClient<Database>(url, key);
}
```

### Multi-Post Fetch Strategy

```typescript
// Extend main-b.server.ts pattern for multiple posts
// Step 1: Get pool of eligible image_ids (images with image_url, not null)
// Step 2: Client-side pick 8-15 random from pool (Math.random() OK here — server only)
// Step 3: Batch fetch image rows + post metadata via Promise.all
// Return: Array<{ id: string; imageUrl: string; artistName: string | null }>
```

## State of the Art

| Old Approach                                                        | Current Approach                                                   | When Changed | Impact                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------ | --------------------------------------------------------- |
| ScatteredCanvas (main-b) — item crop images, left/right alternating | StickerCanvas (main-d) — full post images, zone-based djb2 scatter | This phase   | More collage-like distribution, no center/item dependency |
| Single post fetch (main-b)                                          | Multi-post fetch 8-15 (main-d)                                     | This phase   | Needs new server query, same DB pattern                   |

## Open Questions

1. **Trending keywords fetch for DATA-01**
   - What we know: CONTEXT.md says "fetch trending keywords (for m9-03 wordmark use), this phase fetches only." The `main-page.server.ts` has `TrendingKeyword` type and query infrastructure using the `posts` table (view_count based).
   - What's unclear: The `fetchTrendingKeywords` function is not yet visible in main-page.server.ts (file was read partially). It may need to be created or it uses `fetchWeeklyBestPostsServer` as a proxy.
   - Recommendation: Create `fetchTrendingKeywordsServer()` in `main-d.server.ts` that returns the top 5 artist names or search terms from the `posts` table ordered by `view_count`. Keep it simple — m9-03 will consume it.

2. **Canvas container height on mobile**
   - What we know: CONTEXT.md says `overflow-y-auto` as a mobile fallback if cards overflow.
   - What's unclear: Whether `100vh` + absolute positioning is sufficient or if a taller scrollable canvas is needed.
   - Recommendation: Use `min-height: 100vh` with `position: relative; overflow: hidden` on desktop, and add `overflow-y: auto` with `min-height: 150vh` on mobile as a breakpoint-conditional style. The planner can specify this in the implementation task.

## Validation Architecture

### Test Framework

| Property           | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| Framework          | Playwright 1.58.1 (visual QA)                                        |
| Config file        | `packages/web/playwright.config.ts`                                  |
| Quick run command  | `cd packages/web && yarn test:visual --project=chromium -g "main-d"` |
| Full suite command | `cd packages/web && yarn test:visual`                                |

### Phase Requirements → Test Map

| Req ID  | Behavior                                            | Test Type | Automated Command               | File Exists? |
| ------- | --------------------------------------------------- | --------- | ------------------------------- | ------------ |
| CANV-01 | `/lab/main-d` renders dark canvas, grain visible    | smoke     | `yarn test:visual -g "CANV-01"` | ❌ Wave 0    |
| CANV-02 | Polaroid cards visible with white border + rotation | visual    | `yarn test:visual -g "CANV-02"` | ❌ Wave 0    |
| CANV-03 | Reload produces identical card positions            | smoke     | `yarn test:visual -g "CANV-03"` | ❌ Wave 0    |
| DATA-01 | Cards contain real image URLs (not placeholder)     | smoke     | `yarn test:visual -g "DATA-01"` | ❌ Wave 0    |
| DATA-02 | BottomNav visible with 4 nav items                  | smoke     | `yarn test:visual -g "DATA-02"` | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** TypeScript build check (`yarn tsc --noEmit`) — no Playwright per-commit needed
- **Per wave merge:** `cd packages/web && yarn test:visual -g "main-d"`
- **Phase gate:** Full Playwright suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/web/tests/main-d.spec.ts` — covers CANV-01, CANV-02, CANV-03, DATA-01, DATA-02
- [ ] Wave 0 task should create this test file with basic smoke assertions

## Sources

### Primary (HIGH confidence)

- Direct codebase read: `packages/web/lib/components/main-b/MainPageB.tsx` — grain SVG, BottomNav, z-index layer system
- Direct codebase read: `packages/web/lib/components/main-b/ScatteredCanvas.tsx` — scatter positioning pattern
- Direct codebase read: `packages/web/lib/supabase/queries/main-b.server.ts` — server query pattern, getSharedClient()
- Direct codebase read: `packages/shared/supabase/queries/main-b.ts` — MainBData/MainBPost/MainBItem types
- Direct codebase read: `.planning/phases/m9-01-canvas-scaffold-data-wiring/m9-01-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- djb2 algorithm: well-established string hash (Dan Bernstein, 1991) — widely used in SSR-safe PRNG patterns for React

### Tertiary (LOW confidence)

- None — all findings are grounded in direct codebase inspection

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries verified in package.json via CLAUDE.md
- Architecture: HIGH — patterns directly read from main-b source files
- Pitfalls: HIGH — derived from analyzing the actual code, not general knowledge
- djb2 scatter: HIGH — pure math, no library dependency

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable stack)
