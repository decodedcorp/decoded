# [SCR-VIEW-05] Try Gallery Section

> Route: `/posts/[id]` (section within SCR-VIEW-01) | Status: Draft | Updated: 2026-03-12

## Purpose

Display a gallery of user "Try" posts linked to the current post. Encourages community participation with a prominent CTA to add your own Try.

See: [FLW-08](../../flows/FLW-08-my-try.md) — My Try Flow
See: [SCR-VIEW-01](./SCR-VIEW-01-post-detail.md) — Parent screen
See: [SCR-CREA-TRY-01](../creation/SCR-CREA-TRY-01-try-upload.md) — Try Upload Screen

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| TryGallerySection | `packages/web/lib/components/detail/TryGallerySection.tsx` | Section orchestrator (new) |
| TryCard | `packages/web/lib/components/detail/TryCard.tsx` | Individual try thumbnail card (new) |
| TryEmptyState | (inline in TryGallerySection) | Empty state with CTA |

---

## Placement in SCR-VIEW-01

```
[Hero Section]
[AI Summary]
[Interactive Showcase / Decoded Items]
[Shop Grid]
[Related Images]
──────────────────────────────
[TryGallerySection]              ← NEW: inserted before Social Actions
──────────────────────────────
[Social Actions & Comments]
```

Integration point in `ImageDetailContent.tsx`:

```tsx
{/* Try Gallery Section — before Social Actions */}
<TryGallerySection postId={image.id} />
```

---

## Layout — Mobile

### With Tries (N > 0)

```
┌────────────────────────────────┐
│ TRIES (12)                     │  section heading + count badge
├────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │avatar│ │avatar│ │avatar│   │  2-column grid
│ │[img] │ │[img] │ │[img] │   │  TryCard components
│ │@user │ │@user │ │@user │   │
│ └──────┘ └──────┘ └──────┘   │
│ ┌──────┐ ┌──────┐            │
│ │avatar│ │ +N   │            │  "더보기" if > 6 tries
│ │[img] │ │ more │            │
│ │@user │ │      │            │
│ └──────┘ └──────┘            │
├────────────────────────────────┤
│   [ 나도 해봤어 ]              │  CTA button (primary, full-width)
└────────────────────────────────┘
```

### Empty (N = 0)

```
┌────────────────────────────────┐
│ 아직 시도한 사람이 없어요       │  heading
│ 이 룩을 직접 시도해보세요!      │  subtext
│                                │
│   [ 첫 번째로 시도하기 ]        │  CTA button (primary, outlined)
└────────────────────────────────┘
```

---

## Layout — Desktop (>=768px)

- 3-column grid (up to 6 visible, then "더보기")
- CTA button `max-w-xs mx-auto` centered
- Section has `max-w-6xl mx-auto` matching parent content width

---

## TryCard Design

```
┌───────────────┐
│ ┌─┐           │  avatar (24px, top-left overlay)
│ └─┘           │
│               │
│  [try image]  │  aspect-[3/4], object-cover, rounded-xl
│               │
│               │
├───────────────┤
│ @username     │  text-xs, truncate
│ "코멘트..."    │  text-xs, text-muted, 1-line truncate
└───────────────┘
```

---

## Requirements

| # | Requirement (EARS) | Status |
|---|--------------------|--------|
| R1 | When the post detail mounts, the system shall fetch `GET /api/v1/posts/:postId/tries?limit=6` and display the Try gallery section | Draft |
| R2 | When tries exist, the system shall render a 2-column (mobile) / 3-column (desktop) grid of TryCards | Draft |
| R3 | When more than 6 tries exist, the system shall show a "+N more" card linking to full Try list | Draft |
| R4 | When no tries exist, the system shall show an empty state with "첫 번째로 시도하기" CTA | Draft |
| R5 | When user taps CTA button, the system shall navigate to `/request/try?parent=:postId` (auth-gated) | Draft |
| R6 | When user taps a TryCard, the system shall navigate to `/posts/:tryPostId` | Draft |
| R7 | When user is not authenticated and taps CTA, the system shall redirect to login with return URL | Draft |

---

## Data

### Hook: `useTries(postId)`

```typescript
// packages/web/lib/hooks/useTries.ts (new)
function useTries(postId: string, limit = 6) {
  return useQuery({
    queryKey: ['tries', postId, limit],
    queryFn: () => fetchTries(postId, limit),
    enabled: !!postId,
  });
}
```

### API Response Shape

```typescript
interface TryPost {
  id: string;
  user_id: string;
  image_url: string;
  media_title: string | null;  // 한줄 코멘트
  created_at: string;
  user: {
    display_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

interface TriesResponse {
  tries: TryPost[];
  total: number;
}
```

---

## State

- No dedicated store needed — React Query cache only
- Query key: `['tries', postId]`
- Invalidation: After successful Try creation (FLW-08 Step 3)

---

## Navigation

| Trigger | Destination | Data |
|---------|-------------|------|
| "나도 해봤어" CTA | `/request/try?parent=:postId` | postId |
| TryCard tap | `/posts/:tryPostId` | tryPostId |
| "+N more" card | `/posts/:postId/tries` (future) | postId |

---

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Fetching tries | 2-col skeleton grid (3 cards) |
| Empty | `total === 0` | Illustration + "첫 번째로 시도하기" CTA |
| Error | API failure | Section hidden (silent fail — non-critical) |
| No auth + CTA tap | User not logged in | Redirect to `/login?redirect=...` |

---

## Animations

| Trigger | Type | Library |
|---------|------|---------|
| Section scroll into view | Fade up stagger | Motion (0.3s per card, 0.05s stagger) |
| CTA hover | Scale pulse | CSS transition (scale: 1.02) |
