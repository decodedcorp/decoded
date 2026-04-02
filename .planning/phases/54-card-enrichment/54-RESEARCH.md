# Phase 54: Card Enrichment - Research

**Researched:** 2026-04-02
**Domain:** ExploreCardCell UI enrichment — spot count badge + editorial title overlay
**Confidence:** HIGH

## Summary

This phase enriches the Explore grid card in two ways. First, the `spotCount` field is currently hardcoded to `0` in `useInfinitePosts` despite the Supabase `posts` table containing a `spot_count` column and the REST API `PostListItem` type exposing `spot_count: number`. Fixing it is a one-line data-mapping change. Second, the editorial title overlay already exists in `ExploreCardCell` (`item.editorialTitle`), and `ExploreClient` already conditionally sets it (`hasMagazine && item.title`). The only gap is confirming `post_magazine_title` is non-null when `hasMagazine=true` — which the OpenAPI spec guarantees by design (field is set only when `post_magazine_id` is present).

The spot count badge is **not** in the existing `GridItem` / `ItemConfig` type. It must be added there so `ExploreCardCell` can receive it. The design system `Badge` component is an achievement-badge card, not a numeric pill — a small inline overlay element should be built directly with Tailwind inside the card.

**Primary recommendation:** Map `post.spot_count` in `useInfinitePosts`, propagate `spotCount` through `GridItem` → `ExploreCardCell`, render a pill badge only when `spotCount > 0`. Editorial overlay is already wired; validate non-null guarantee from the `hasMagazine` filter.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | `spotCount > 0`인 Explore 카드에 숫자 배지 표시 (하드코딩 `0` 제거) | `post.spot_count` is a required `number` in `PostListItem` and exists as `spot_count` column in Supabase `posts` table; mapping fix in `useInfinitePosts` is sufficient |
| CARD-02 | Editorial 카드에 `post_magazine_title` 오버레이 표시 + non-null 검증 | `ExploreCardCell` already renders `item.editorialTitle`; `ExploreClient` already sets it when `hasMagazine=true`; OpenAPI spec confirms `post_magazine_title` is only populated when `post_magazine_id` exists |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React / Tailwind | (project) | Badge pill overlay UI | No new dep needed — inline `<span>` with Tailwind classes |
| Supabase JS browser client | (project) | Data source for `useInfinitePosts` | Already used in hook |

### No New Dependencies Needed

This phase requires zero new package installs. The changes are:
1. A one-line data-mapping fix in `useInfinitePosts`
2. Adding `spotCount` to the `GridItem` type
3. Adding a conditional `<span>` badge inside `ExploreCardCell`
4. Validating editorial title flow (likely already correct)

---

## Architecture Patterns

### Data Flow

```
Supabase posts table
  └── spot_count column (integer)
        └── useInfinitePosts (useImages.ts)
              └── PostGridItem.spotCount  ← currently hardcoded 0
                    └── ExploreClient maps to GridItem
                          └── ExploreCardCell renders badge
```

### Current State vs Required State

**54-01: spotCount fix**

In `useInfinitePosts` (`packages/web/lib/hooks/useImages.ts`, line 233):
```typescript
// CURRENT (broken)
spotCount: 0,

// FIXED
spotCount: post.spot_count ?? 0,
```

`GridItem` type in `ThiingsGrid.tsx` currently does NOT have a `spotCount` field. It must be added:
```typescript
// packages/web/lib/components/ThiingsGrid.tsx
export type GridItem = {
  id: string;
  imageUrl?: string | null;
  status?: "pending" | "extracted" | "skipped" | string;
  hasItems?: boolean;
  postId: string;
  postSource: PostSource;
  postAccount: string;
  postCreatedAt: string;
  editorialTitle?: string | null;
  spotCount?: number;          // ADD THIS
};
```

`ExploreClient` must pass `spotCount` when building `gridItems`:
```typescript
// packages/web/app/explore/ExploreClient.tsx — inside items.map()
.map((item) => ({
  // ... existing fields ...
  ...(hasMagazine && item.title && { editorialTitle: item.title }),
  ...(item.spotCount && item.spotCount > 0 && { spotCount: item.spotCount }),
}));
```

**Badge pill in ExploreCardCell** — no design-system Badge is suitable (it's for achievements). Use an inline absolute pill:
```typescript
// inside <article> after editorial overlay
{item?.spotCount && item.spotCount > 0 && (
  <div className="absolute top-2 right-2 z-10">
    <span className="inline-flex items-center gap-0.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm">
      {item.spotCount}
    </span>
  </div>
)}
```

**54-02: Editorial title overlay**

Already implemented in `ExploreCardCell` (lines 101-121). `ExploreClient` already gates it with `hasMagazine && item.title`. The `hasMagazine=true` filter (Supabase `.not("post_magazine_id", "is", null)`) guarantees rows have a magazine, and the OpenAPI spec states `post_magazine_title` is set only when `post_magazine_id` is present. However, `useInfinitePosts` queries Supabase directly, not the REST API — it maps `title` as:

```typescript
title: post.post_magazine_title ?? post.title ?? null,
```

So if a post has `post_magazine_id` but `post_magazine_title` is null for some reason, it falls back to `post.title`. The `ExploreClient` check `hasMagazine && item.title` means no overlay appears for null. This is the correct defensive behavior — no change needed here beyond verification.

### Recommended File Changes

```
packages/web/lib/hooks/useImages.ts          # Fix spotCount: 0 → post.spot_count ?? 0
packages/web/lib/components/ThiingsGrid.tsx  # Add spotCount?: number to GridItem type
packages/web/app/explore/ExploreClient.tsx   # Pass spotCount to gridItems map
packages/web/lib/components/explore/ExploreCardCell.tsx  # Render badge pill
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Numeric count pill | Complex component | Inline `<span>` with Tailwind — no abstraction needed at this scale |
| Conditional rendering logic | Heavy state management | Simple `item?.spotCount > 0` guard |

---

## Common Pitfalls

### Pitfall 1: Badge Position Conflict with Editorial Overlay
**What goes wrong:** If `spotCount` badge is positioned `bottom-right`, it overlaps the editorial title text gradient.
**How to avoid:** Position badge at `top-right` (`absolute top-2 right-2`) — no overlap with bottom gradient.
**Warning signs:** Editorial title text obscured by badge on small cards.

### Pitfall 2: `GridItem` Type Not Updated Breaks TypeScript
**What goes wrong:** Adding `spotCount` to `ExploreClient`'s map without updating `GridItem` type causes TS error.
**How to avoid:** Update `GridItem` in `ThiingsGrid.tsx` first, then propagate. Run `bun run typecheck` after.

### Pitfall 3: `spotCount` Spread in ExploreClient Only When > 0
**What goes wrong:** Spreading `spotCount: 0` into gridItems means `ExploreCardCell` receives `0` and the conditional `item.spotCount > 0` correctly hides it — BUT if you spread unconditionally, you add noise to all items.
**How to avoid:** Use `...(item.spotCount && item.spotCount > 0 && { spotCount: item.spotCount })` or always spread and let the card guard it.

### Pitfall 4: Supabase Row Type is `any`
**What goes wrong:** `useInfinitePosts` casts Supabase results to `any` (`(data ?? []).map((post: any) => ...)`). `post.spot_count` will work but is untyped.
**How to avoid:** Access `post.spot_count` directly — it works. No need for type assertion changes in this phase.

### Pitfall 5: Editorial title for non-magazine Explore posts
**What goes wrong:** On the standard Explore tab (not Editorial, `hasMagazine=false`), `item.title` could be a generic AI-extracted title, not a magazine title. `ExploreClient` gates with `hasMagazine && item.title`, so overlay only appears on the Editorial route. Correct.
**How to avoid:** Do not change the `hasMagazine` gate in `ExploreClient`.

---

## Code Examples

### Current broken mapping (useImages.ts line 233)
```typescript
// Source: packages/web/lib/hooks/useImages.ts
spotCount: 0,  // BUG: hardcoded, ignores post.spot_count
```

### Fixed mapping
```typescript
spotCount: post.spot_count ?? 0,
```

### GridItem type extension (ThiingsGrid.tsx)
```typescript
// Source: packages/web/lib/components/ThiingsGrid.tsx
export type GridItem = {
  id: string;
  imageUrl?: string | null;
  status?: "pending" | "extracted" | "skipped" | string;
  hasItems?: boolean;
  postId: string;
  postSource: PostSource;
  postAccount: string;
  postCreatedAt: string;
  editorialTitle?: string | null;
  spotCount?: number;   // new field
};
```

### Badge pill in ExploreCardCell (inside `<article>`)
```typescript
// Source: packages/web/lib/components/explore/ExploreCardCell.tsx
{item?.spotCount != null && item.spotCount > 0 && (
  <div className="absolute top-2 right-2 z-10">
    <span className="inline-flex items-center gap-0.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm">
      {item.spotCount}
    </span>
  </div>
)}
```

### ExploreClient gridItems map (add spotCount)
```typescript
// Source: packages/web/app/explore/ExploreClient.tsx
.map((item) => ({
  id: item.id,
  imageUrl: item.imageUrl,
  postId: item.postId,
  postSource: item.postSource,
  postAccount: item.postAccount,
  postCreatedAt: item.postCreatedAt,
  ...(hasMagazine && item.title && { editorialTitle: item.title }),
  ...(item.spotCount != null && item.spotCount > 0 && { spotCount: item.spotCount }),
}));
```

### Editorial title overlay (already in ExploreCardCell, lines 101-121)
```typescript
// Source: packages/web/lib/components/explore/ExploreCardCell.tsx
{item?.editorialTitle && (
  <div className="absolute inset-x-0 bottom-0">
    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent" aria-hidden />
    <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-6">
      <p className="line-clamp-2 text-[13px] font-semibold leading-[1.35] tracking-tight text-white antialiased"
        style={{ textShadow: "0 0 2px rgba(0,0,0,1), ..." }}>
        {item.editorialTitle}
      </p>
    </div>
  </div>
)}
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run test --run` |
| Full suite command | `cd packages/web && bun run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | `spotCount > 0` renders badge, `spotCount === 0` hides badge | unit | `bun run test --run -- ExploreCardCell` | ❌ Wave 0 |
| CARD-01 | `useInfinitePosts` maps `spot_count` from Supabase row correctly | unit | `bun run test --run -- useImages` | ❌ Wave 0 |
| CARD-02 | Editorial overlay renders when `editorialTitle` is non-null | unit | `bun run test --run -- ExploreCardCell` | ❌ Wave 0 |
| CARD-02 | `hasMagazine=false` — no `editorialTitle` set in ExploreClient | unit | manual / visual | manual-only |

### Wave 0 Gaps
- [ ] `packages/web/lib/components/explore/__tests__/ExploreCardCell.test.tsx` — covers CARD-01, CARD-02
- [ ] `packages/web/lib/hooks/__tests__/useImages.test.ts` — covers CARD-01 mapping fix

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `packages/web/lib/hooks/useImages.ts` — confirmed `spotCount: 0` hardcode at line 233; confirmed `post.post_magazine_title ?? post.title` mapping
- Direct file read: `packages/web/lib/components/explore/ExploreCardCell.tsx` — confirmed editorial overlay implementation; confirmed `spotCount` field absent
- Direct file read: `packages/web/lib/components/ThiingsGrid.tsx` — confirmed `GridItem` type, `editorialTitle` present, `spotCount` absent
- Direct file read: `packages/web/app/explore/ExploreClient.tsx` — confirmed `hasMagazine && item.title` gate, `spotCount` not passed
- Direct file read: `packages/web/lib/api/generated/models/postListItem.ts` — confirmed `spot_count: number` is required field
- Direct file read: `packages/api-server/openapi.json` → `PostListItem` schema — `spot_count` required integer, `post_magazine_title` nullable string set only when `post_magazine_id` present
- Direct file read: `packages/web/lib/design-system/badge.tsx` — confirmed existing Badge is achievement card, not a numeric pill

### Secondary (MEDIUM confidence)
- Design system `index.ts` — Tag and Badge exports confirmed; neither is a suitable numeric counter pill

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files directly read, no assumptions
- Architecture: HIGH — full data flow traced from Supabase query to render
- Pitfalls: HIGH — identified from direct code inspection

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable code, low churn area)
