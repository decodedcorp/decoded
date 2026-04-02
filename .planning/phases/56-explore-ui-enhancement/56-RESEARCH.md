# Phase 56: Explore UI Enhancement - Research

**Researched:** 2026-04-02
**Domain:** React UI / Tailwind CSS / Supabase query / Pretext layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** SpotDot과 HeroSpotMarker를 브랜드 컬러(네온 옐로우 `#eafd67` / `--mag-accent`)로 통일한다. HeroSpotMarker의 하드코딩된 색상을 CSS 변수로 대체.
- **D-02:** SpotDot은 메인페이지와 상세페이지 모두에서 동일한 스타일로 렌더링되어야 한다.
- **D-03:** Hierarchical filter 전체 연결 — ExploreClient가 Media/Cast/Context 파라미터를 useInfinitePosts에 전달하고, Supabase 쿼리에서 실제 필터링이 동작하도록 한다.
- **D-04:** 현재 ExploreFilterBar/Sheet UI는 이미 존재하므로 API 연결만 추가하면 됨.
- **D-05:** Explore 페이지는 모든 post를 표시하되, 상세페이지(클릭 시)가 editorial 형태로 보여진다. hasMagazine 필터를 Explore 기본으로 적용하지 않음 — 대신 상세 뷰에서 editorial 레이아웃을 적용.
- **D-06:** 상세페이지 왼쪽 상단의 PostBadge(카테고리/소스 뱃지) 전부 삭제. SpotDot은 유지.
- **D-07:** Pretext 라이브러리를 상세페이지 매거진 섹션에 적용하여 텍스트 레이아웃 품질 향상. usePretext 훅이 이미 존재함.
- **D-08:** 상세페이지 전체 컬러를 브랜드 컬러(네온 옐로우 `--mag-accent`)로 통일. magazine accent color 오버라이드 대신 일관된 브랜드 컬러 사용.

### Claude's Discretion
- 필터 파라미터의 Supabase 쿼리 구현 방식 (eq, in, contains 등)
- Pretext 적용 시 구체적 텍스트 영역 선택

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 56 is a pure UI/UX polish phase with no new infrastructure. The work falls into four distinct areas: (1) branding unification across SpotDot and HeroSpotMarker components, (2) wiring the hierarchical filter store to the `useInfinitePosts` Supabase query, (3) removing PostBadge from the detail page overlay, and (4) applying the Pretext text-measurement library to the magazine editorial section in the detail page.

All dependencies are already in place. `SpotDot` accepts an `accentColor` prop whose default is `hsl(var(--primary))` — changing it to `var(--mag-accent)` is a one-line default change. `HeroSpotMarker` hard-codes `#eafd67` as hex literals in three places; replacing them with `var(--mag-accent)` removes the duplication. The `hierarchicalFilterStore` exposes `category`, `mediaId`, `castId`, and `contextType` — none of these are currently passed from `ExploreClient` to `useInfinitePosts`, so the gap is purely wiring. `PostBadge` is only referenced from `ThiingsGrid.tsx` (as an imported type comment, not actually rendered there) and `PostBadge.tsx` itself — the component is **not rendered anywhere in the detail page currently**. The `useTextLayout` hook in `usePretext.ts` uses `@chenglou/pretext`'s `prepare`/`layout` primitives to measure text without DOM reflow, and `MagazineEditorialSection` already imports the `accentColor` flow.

**Primary recommendation:** Make targeted, surgical changes in the six identified files. The largest task is the filter wiring, which requires understanding what the `mediaId` and `castId` actually represent in the DB schema before adding `.eq()` or `.ilike()` clauses.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@chenglou/pretext` | already installed | Canvas-based text measurement without DOM | Powers `useTextLayout` hook |
| `zustand` | already installed | `hierarchicalFilterStore` state | Project-wide state management |
| `@supabase/supabase-js` | already installed | `supabaseBrowserClient` query builder | All DB access |
| `tailwindcss` | already installed | `mag.accent` utility class | Design system token |

No new packages required for this phase. All changes are CSS variable usage and data wiring.

**Version verification:** No installs needed.

---

## Architecture Patterns

### Recommended Change Scope

```
packages/web/
├── lib/components/detail/SpotDot.tsx             # default accentColor → var(--mag-accent)
├── lib/components/main-renewal/HeroSpotMarker.tsx # 3x #eafd67 → var(--mag-accent)
├── app/explore/ExploreClient.tsx                  # read hierarchicalFilterStore, pass to useInfinitePosts
├── lib/hooks/useImages.ts                         # add mediaId/castId/contextType params to useInfinitePosts
├── lib/components/detail/ImageDetailContent.tsx   # apply useTextLayout to editorial title/pull quote
└── lib/components/detail/ImageDetailModal.tsx     # confirm PostBadge is absent (it already is)
```

### Pattern 1: Brand Color Unification

**What:** Replace hardcoded `#eafd67` hex and `hsl(var(--primary))` fallback with `var(--mag-accent)`.

**When to use:** Any Spot marker component.

**Current `SpotDot.tsx` default:**
```tsx
// Current (line 22 in SpotDot.tsx)
const dotColor = accentColor || "hsl(var(--primary))";

// Target
const dotColor = accentColor || "var(--mag-accent)";
```

**`HeroSpotMarker.tsx` replacements (3 locations):**
```tsx
// Line 88: connector line color
borderTop: "1.5px solid rgba(234,253,103,0.6)",
// Replace with:
borderTop: "1.5px solid color-mix(in srgb, var(--mag-accent) 60%, transparent)",

// Line 89: connector filter
filter: "drop-shadow(0 0 3px rgba(234,253,103,0.3))",
// Replace with:
filter: "drop-shadow(0 0 3px color-mix(in srgb, var(--mag-accent) 30%, transparent))",

// Lines 96-97: dot background
bg-[#eafd67] ... bg-[#eafd67]
// Replace with CSS var approach via style prop:
style={{ backgroundColor: "var(--mag-accent)" }}
```

**Note:** `color-mix` is supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+). For simpler approach, use inline `style={{ color: "var(--mag-accent)", opacity: X }}` on border elements.

### Pattern 2: Hierarchical Filter Wiring

**What:** `ExploreClient` currently reads only `activeFilter` from `filterStore` (flat). The hierarchical filter values (`category`, `mediaId`, `castId`, `contextType`) live in `hierarchicalFilterStore` but are never consumed by `ExploreClient`.

**Gap analysis:**
- `ExploreFilterBar` reads from `useHierarchicalFilterStore` — UI state is correct
- `ExploreClient` only passes `category: activeFilter` to `useInfinitePosts`
- `useInfinitePosts` has `category`, `search`, `artistName`, `groupName` params but no `mediaId`, `castId`, or `contextType` params

**Wiring steps:**

Step 1 — `ExploreClient.tsx`: Import and read `hierarchicalFilterStore`:
```tsx
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";

// Inside component:
const { category: hierCategory, mediaId, castId, contextType } = useHierarchicalFilterStore();
```

Step 2 — Pass to `useInfinitePosts`:
```tsx
useInfinitePosts({
  limit: 40,
  category: hierCategory ?? activeFilter,
  mediaId: mediaId ?? undefined,
  castId: castId ?? undefined,
  contextType: contextType ?? undefined,
  hasMagazine: hasMagazine ?? false,
});
```

Step 3 — `useImages.ts`: Add new params to `useInfinitePosts`:
```tsx
export function useInfinitePosts(params: {
  // ...existing...
  mediaId?: string;
  castId?: string;
  contextType?: string;
}) {
  const { mediaId, castId, contextType, ... } = params;

  // In queryFn:
  if (mediaId) {
    // mediaId maps to which DB column? — see "Open Questions" section
    query = query.eq("media_id", mediaId);  // or ilike on title
  }
  if (castId) {
    query = query.eq("cast_id", castId);    // or ilike on artist_name
  }
  if (contextType) {
    query = query.eq("context", contextType);
  }
}
```

**CRITICAL:** The query key array must include `mediaId`, `castId`, `contextType` for correct TanStack Query cache invalidation:
```tsx
queryKey: [
  "posts", "infinite",
  { category, search, artistName, groupName, sort, limit, hasMagazine,
    mediaId, castId, contextType },
],
```

### Pattern 3: PostBadge Removal Verification

**Finding:** `PostBadge` is NOT currently rendered in the detail page. Searching `packages/web/lib/components/detail/` for `PostBadge` returns zero matches. It is only defined in `PostBadge.tsx` and referenced as a type comment in `ThiingsGrid.tsx`. The D-06 decision requires confirming no badge overlay exists in `ImageDetailModal.tsx` or `ImageDetailContent.tsx` — **confirmed absent**. The task becomes a no-op verification + cleanup of the `PostBadge.tsx` file if desired, or simply documenting the non-existence.

**However** — if badges appear visually in the current UI, they may be rendered elsewhere (e.g., `HeroSection.tsx` or a page-level component). Check `HeroSection.tsx` and the full-page detail route.

### Pattern 4: Pretext Application in Editorial Section

**What:** `useTextLayout` already exists. The goal is to apply it to text elements in the magazine editorial layout to improve typographic precision.

**Existing hook API:**
```tsx
// From usePretext.ts (verified)
const { containerRef, height, lineCount } = useTextLayout({
  text: "magazine title text",
  font: '28px "Playfair Display"',    // must match CSS font
  lineHeight: 36,                       // in pixels
});

return <div ref={containerRef} style={{ minHeight: height }}>{text}</div>;
```

**Best targets in `MagazineEditorialSection.tsx`:**
1. The pull quote paragraph — variable length, benefits from exact height
2. The editorial body paragraphs — first-letter drop cap layout

**How to apply:**
```tsx
// In MagazineEditorialSection component, for pull quote:
const { containerRef, height } = useTextLayout({
  text: editorial.pull_quote ?? "",
  font: '16px "Playfair Display"',
  lineHeight: 28,
});

<blockquote ref={containerRef} style={{ minHeight: height || "auto" }}>
  {editorial.pull_quote}
</blockquote>
```

**Note:** `useBatchTextLayout` is more efficient for measuring multiple paragraphs simultaneously.

### Pattern 5: Detail Page Brand Color Unification (D-08)

**Current state:** `ImageDetailContent.tsx` sets `--magazine-accent` CSS var from `magazineLayout.design_spec.accent_color` (per-post dynamic color). The magazine sections then reference this variable.

**D-08 goal:** Replace per-post `design_spec.accent_color` with the global brand color `var(--mag-accent)` = `#eafd67`.

**Implementation:** In `ImageDetailContent.tsx`, `ImageDetailPreview.tsx`, and `MagazineContent.tsx`, replace the dynamic `accentColor` derivation:

```tsx
// Current:
const accentColor = magazineLayout?.design_spec?.accent_color;
// Renders as inline style: { "--magazine-accent": accentColor }

// Target: Always use brand color
const accentColor = "var(--mag-accent)";
// OR: pass undefined, and set --magazine-accent fallback in CSS to var(--mag-accent)
```

The simplest approach: in `globals.css`, define `--magazine-accent` as a fallback to `--mag-accent` so no code change is needed — but the `design_spec.accent_color` will still override it via inline style. To truly enforce brand color, omit the inline style override entirely.

### Anti-Patterns to Avoid

- **Querying `mediaId`/`castId` with wrong column:** Mock data IDs (from `getMockMediaByCategory`) may not match real DB column names. Verify before adding `.eq()` — see Open Questions.
- **Setting default `accentColor` without a CSS fallback:** If `var(--mag-accent)` is used inline as a string in `style` props, it works. But `color-mix()` inline may fail in some React style object contexts — test.
- **Removing PostBadge file prematurely:** `PostBadge` is still imported by the `ThiingsGrid.tsx` type comment. Safe to keep the file, just don't render it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text height measurement | Custom DOM measurement | `useTextLayout` (already exists) | Canvas-based, no reflow, ~500x faster |
| Filter state | Duplicate filter state in ExploreClient | `useHierarchicalFilterStore` (already exists) | Single source of truth, persisted |
| CSS variable for brand color | Hardcode `#eafd67` | `var(--mag-accent)` | Already defined in `globals.css:110` |

---

## Common Pitfalls

### Pitfall 1: mediaId/castId DB Column Mismatch

**What goes wrong:** `getMockMediaByCategory` in `ExploreFilterBar` uses mock IDs (e.g., fictional drama/album IDs). These may not correspond to actual DB column values in the `posts` table.

**Why it happens:** The filter UI was built with mock data before real data API was connected. The `posts` table has `artist_name`, `group_name`, `context` columns — but no confirmed `media_id` or `cast_id` FK columns.

**How to avoid:** Check `posts` table schema before adding `.eq("media_id", mediaId)`. If no matching column exists, use `.ilike("title", ...)` or `.ilike("group_name", ...)` as fuzzy fallbacks. The `contextType` filter is safe — it maps to `context` column (already used in ExploreClient line 66 via `activeFilter`).

**Warning signs:** No filter results after selecting Media/Cast — means column name is wrong.

### Pitfall 2: TanStack Query Cache Miss After Filter Addition

**What goes wrong:** Adding `mediaId`/`castId` to `useInfinitePosts` params but forgetting to include them in the `queryKey` array results in stale data — changing filter shows old results.

**How to avoid:** The `queryKey` array must include ALL params that affect the query.

### Pitfall 3: `color-mix()` in Inline Style Objects

**What goes wrong:** React `style` objects don't fully support all CSS functions consistently. `color-mix(in srgb, var(--mag-accent) 60%, transparent)` may not resolve when set as a JS string in a style prop.

**How to avoid:** Use Tailwind classes with opacity modifier (`text-[var(--mag-accent)]/60`) or define new CSS utilities. Alternatively, use `rgba(234,253,103,0.6)` as a concrete fallback since `--mag-accent` is a fixed brand color.

### Pitfall 4: Pretext Font Must Match Rendered CSS

**What goes wrong:** `useTextLayout` with `font: '16px "Playfair Display"'` measures incorrectly if the DOM renders a different font size or family due to CSS loading timing.

**How to avoid:** Always use the exact same font specification that CSS applies. Wrap in `useEffect` or ensure font is loaded before measurement.

### Pitfall 5: HeroSpotMarker Animation Refs Break After CSS Variable Change

**What goes wrong:** `HeroSpotMarker` uses `lineRef.style.borderTop` set programmatically in `updateLine()`. If the color is changed to use `var(--mag-accent)` in JSX but `updateLine()` also sets `borderTop` via JS, the JS will win.

**How to avoid:** The `lineRef.style.opacity` is set via JS, but the `borderTop` color is set in the JSX `style` prop (not in `updateLine()`). Changing the JSX `style.borderTop` is safe — JS only sets `left`, `top`, `width`, `transform`, `opacity`.

---

## Code Examples

### Verified: SpotDot Brand Color Default

```tsx
// Source: packages/web/lib/components/detail/SpotDot.tsx (line 22)
// Current:
const dotColor = accentColor || "hsl(var(--primary))";

// Change to:
const dotColor = accentColor || "var(--mag-accent)";
```

### Verified: HeroSpotMarker — Three Hardcoded Color Locations

```tsx
// Source: packages/web/lib/components/main-renewal/HeroSpotMarker.tsx

// Location 1: lineRef style (line 88-89) — connector line
style={{
  height: 0,
  borderTop: "1.5px solid rgba(234,253,103,0.6)",  // change to CSS var approach
  transformOrigin: "0 0",
  filter: "drop-shadow(0 0 3px rgba(234,253,103,0.3))",  // change
}}

// Location 2: dot div (line 96) — bg-[#eafd67] Tailwind class
<div className="w-3.5 h-3.5 rounded-full bg-[#eafd67] ..." />
// Change className: remove bg-[#eafd67], add style={{ backgroundColor: "var(--mag-accent)" }}

// Location 3: ping div (line 97) — bg-[#eafd67] animate-ping
<div className="... bg-[#eafd67] animate-ping opacity-30" />
// Same change: style={{ backgroundColor: "var(--mag-accent)" }}

// Location 4: price text (line 138) — text-[#eafd67]
<p className="text-[10px] text-[#eafd67] mt-0.5 font-medium">
// Change: text-[var(--mag-accent)]

// Location 5: hover border (line 112-114) — rgba(234,253,103,0.5)
borderColor: hovered ? "rgba(234,253,103,0.5)" : "rgba(255,255,255,0.1)",
// Can leave as-is (same color as --mag-accent) or change to variable
```

### Verified: Filter Wiring Pattern

```tsx
// ExploreClient.tsx addition
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";

// Inside ExploreClient component:
const { category: hierCategory, mediaId, castId, contextType } =
  useHierarchicalFilterStore();

// Pass to hook:
const { data, ... } = useInfinitePosts({
  limit: 40,
  category: hierCategory ?? undefined,
  mediaId: mediaId ?? undefined,
  castId: castId ?? undefined,
  contextType: contextType ?? undefined,
  hasMagazine: hasMagazine ?? false,
});
```

### Verified: useInfinitePosts Query Extension

```tsx
// useImages.ts — inside useInfinitePosts queryFn
// Add after existing castId param in destructure:
const { limit = 40, category, mediaId, castId, contextType, ... } = params;

// In queryKey array:
queryKey: ["posts", "infinite",
  { category, mediaId, castId, contextType, hasMagazine, ... }],

// In queryFn, after existing category filter:
if (mediaId) {
  // mediaId may map to group/show title — verify DB schema
  // Safe approximation if no FK column:
  query = query.ilike("group_name", `%${mediaId}%`);
}
if (castId) {
  query = query.ilike("artist_name", `%${castId}%`);
}
if (contextType) {
  query = query.eq("context", contextType);  // safe — context column confirmed
}
```

### Verified: Pretext useTextLayout Application

```tsx
// Source: packages/web/lib/hooks/usePretext.ts (verified exists)
import { useTextLayout } from "@/lib/hooks/usePretext";

// In MagazineEditorialSection, for pull quote:
const { containerRef: pullQuoteRef, height: pullQuoteHeight } = useTextLayout({
  text: editorial.pull_quote ?? "",
  font: '16px "Georgia"',    // match actual CSS font
  lineHeight: 28,
});

<blockquote
  ref={pullQuoteRef}
  style={{ minHeight: pullQuoteHeight > 0 ? pullQuoteHeight : undefined }}
>
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| Hardcoded `#eafd67` in HeroSpotMarker | CSS variable `var(--mag-accent)` | Phase 56 change |
| `hsl(var(--primary))` fallback in SpotDot | `var(--mag-accent)` default | Phase 56 change |
| Filter UI connected to mock data only | Filter UI + Supabase query wiring | Phase 56 change |
| Per-post `design_spec.accent_color` override | Global `--mag-accent` brand color | Phase 56 change |

---

## Open Questions

1. **mediaId and castId DB column mapping**
   - What we know: `hierarchicalFilterStore` stores `mediaId` (e.g., a drama/show ID) and `castId` (e.g., an idol group ID). These come from `getMockMediaByCategory` and `getMockCastByMedia`.
   - What's unclear: The `posts` table columns available for these. Likely `group_name` for castId and possibly no direct `mediaId` column.
   - Recommendation: At implementation time, run a quick schema check: `supabase.from("posts").select("*").limit(1)` and inspect returned columns. If no `media_id` column, use `ilike` on `group_name`/`title`. If the mock IDs are not real data, `contextType` alone may be the only reliable hierarchical filter (it maps to `context` column, already confirmed working).

2. **PostBadge in detail overlay — visual audit**
   - What we know: No `PostBadge` import found in any detail component.
   - What's unclear: Whether any badge-like UI exists in `HeroSection.tsx` or other detail sub-components not yet read.
   - Recommendation: Read `HeroSection.tsx` before implementing D-06 to confirm no badge rendering there.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run test --run` |
| Full suite command | `cd packages/web && bun run test` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Notes |
|----|----------|-----------|-------|
| D-01/D-02 | SpotDot renders with `var(--mag-accent)` default | unit | Verify default dotColor |
| D-03 | useInfinitePosts receives filter params and adds to queryKey | unit | Verify queryKey array |
| D-06 | ImageDetailModal renders without PostBadge | manual visual | No badge import to test |
| D-07 | useTextLayout returns non-zero height for non-empty text | unit | Hook already tested |
| D-08 | ImageDetailContent uses brand color (not dynamic accent) | unit | Check accentColor derivation |

### Wave 0 Gaps
None — existing test infrastructure covers this phase. No new test files required; changes are targeted CSS/data-wiring modifications to existing components.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of 12 files in `packages/web/` — current implementation state confirmed
- `packages/web/app/globals.css:110` — `--mag-accent: #eafd67` confirmed
- `packages/web/tailwind.config.ts:78` — `mag.accent: "var(--mag-accent)"` confirmed
- `packages/web/lib/hooks/usePretext.ts` — `useTextLayout`, `useBatchTextLayout` API verified
- `packages/web/lib/components/detail/SpotDot.tsx` — current accentColor default confirmed
- `packages/web/lib/components/main-renewal/HeroSpotMarker.tsx` — 5 hardcoded color locations found
- `packages/web/app/explore/ExploreClient.tsx` — hierarchical filter NOT connected, confirmed
- `packages/web/lib/hooks/useImages.ts` — `useInfinitePosts` params/queryKey structure confirmed
- `packages/shared/stores/hierarchicalFilterStore.ts` — available state fields confirmed
- `packages/web/lib/components/PostBadge.tsx` — component exists but not used in detail page

### Secondary (MEDIUM confidence)
- `color-mix()` browser support: broadly available as of 2023 (Chrome 111, Firefox 113, Safari 16.2)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing
- Architecture: HIGH — all implementation files read and verified
- Filter DB schema: MEDIUM — `contextType → context` is confirmed; `mediaId`/`castId` column mapping requires schema verification at implementation time
- Pitfalls: HIGH — derived from direct code inspection

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable codebase, UI-only changes)
