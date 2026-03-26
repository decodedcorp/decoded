# Phase 50: Saved Tab Frontend - Research

**Researched:** 2026-03-26
**Domain:** React infinite scroll, Orval-generated hooks, mock data cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 기존 Pins/Boards/Collage 서브탭 구조 제거 → 단순 saved posts 그리드
- `collectionStore` 의존 완전 제거
- `useGetMySaved` (Orval 생성) 기반 useInfiniteQuery로 교체
- SavedItem 타입: id, post_id, post_title, post_thumbnail_url, saved_at
- `collectionStore.ts`의 MOCK_PINS, MOCK_BOARDS 상수 완전 삭제
- collectionStore 자체는 collection 페이지에서 아직 사용할 수 있으므로 mock만 제거 (store 삭제 여부는 Claude 재량)
- 로딩: 스켈레톤 그리드 (TriesGrid와 동일 패턴)
- 빈 상태: Bookmark 아이콘 + "저장한 포스트가 없습니다" + 안내 문구
- 에러: 에러 메시지 + retry 버튼
- 무한스크롤: IntersectionObserver 기반

### Claude's Discretion
- collectionStore를 완전히 삭제할지 mock만 제거할지 (다른 페이지 사용 여부 확인)
- 카드 디자인 (포스트 썸네일 + 제목 + 저장 날짜)
- PinGrid/BoardGrid/CollageView 컴포넌트 정리 여부

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SAVED-03 | `SavedGrid.tsx`를 실제 데이터 기반으로 재구현 | `getMySaved` raw function + `useInfiniteQuery` pattern confirmed from Phase 49 TriesGrid |
| SAVED-04 | `collectionStore.ts` MOCK_PINS/MOCK_BOARDS 완전 제거 | collectionStore usage audit: mock data only referenced within store itself; 8 files import collectionStore but only SavedGrid will be rewritten |
| SAVED-05 | 무한스크롤 연결 | Native IntersectionObserver pattern confirmed from TriesGrid — react-intersection-observer not installed |
</phase_requirements>

---

## Summary

Phase 50 is a straightforward frontend-only rewrite. The backend API (`GET /api/v1/users/me/saved`) and its Orval-generated `getMySaved` raw function are already present from Phase 48. The implementation pattern is identical to the completed Phase 49 `TriesGrid.tsx` — use `getMySaved` raw function inside `useInfiniteQuery`, native `IntersectionObserver` sentinel, skeleton loading, empty/error states.

The key cleanup work is removing `MOCK_PINS` and `MOCK_BOARDS` from `collectionStore.ts`. Analysis shows that `useCollectionStore` is only imported in collection-related components (`PinGrid`, `BoardGrid`, `CollageView`, `CollectionHeader`, `BoardCard`, `PinCard`) and `SavedGrid.tsx`. After rewriting `SavedGrid.tsx`, all remaining consumers are in `packages/web/lib/components/collection/` which are themselves only imported by `SavedGrid.tsx`. This means PinGrid/BoardGrid/CollageView become dead code once SavedGrid is rewritten. The store itself (`collectionState` without the mock constants) can remain if those collection components are kept; but the mock data blocks are safe to delete unconditionally.

**Primary recommendation:** Copy the TriesGrid infinite scroll pattern verbatim, swap `getMyTries` → `getMySaved` and `TryItem` → `SavedItem`, then delete MOCK_PINS/MOCK_BOARDS from collectionStore.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | already installed | `useInfiniteQuery` for paginated data | Project standard; TriesGrid uses same |
| lucide-react | already installed | Bookmark icon for empty state | Project icon library |
| next/image | Next.js 16 built-in | Optimized image rendering for thumbnails | Project standard for images |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| getMySaved (Orval raw fn) | generated | Fetch saved posts from API | Called inside queryFn — same as getMyTries |
| IntersectionObserver | Web API built-in | Infinite scroll sentinel | react-intersection-observer NOT installed in project |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
packages/web/lib/components/profile/
└── SavedGrid.tsx       # Rewrite target (was mock-based)

packages/web/lib/stores/
└── collectionStore.ts  # Delete MOCK_PINS + MOCK_BOARDS constants

packages/web/lib/components/collection/
└── PinGrid.tsx         # Becomes dead code after SavedGrid rewrite
└── BoardGrid.tsx       # Becomes dead code after SavedGrid rewrite
└── CollageView.tsx     # Becomes dead code after SavedGrid rewrite
```

### Pattern 1: useInfiniteQuery with raw Orval function (Phase 49 Canonical)

**What:** Use the Orval-generated raw function (not the hook) inside TanStack `useInfiniteQuery`. Orval hooks are regular `useQuery` — they cannot do infinite pagination.
**When to use:** Any paginated list endpoint needing infinite scroll.

**Example (from TriesGrid.tsx):**
```typescript
// Source: packages/web/lib/components/profile/TriesGrid.tsx
const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
  useInfiniteQuery({
    queryKey: ["/api/v1/users/me/saved"],
    queryFn: async ({ pageParam }) =>
      getMySaved({ page: pageParam as number, per_page: PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });

const saved: SavedItem[] = data?.pages.flatMap((page) => page.data) ?? [];
```

### Pattern 2: Native IntersectionObserver sentinel (Phase 49 Canonical)

**What:** Place a zero-height `<div ref={sentinelRef}>` at the end of the list. When it enters the viewport, call `fetchNextPage()`.
**When to use:** All infinite scroll in this project (react-intersection-observer not available).

**Example:**
```typescript
// Source: packages/web/lib/components/profile/TriesGrid.tsx
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(sentinel);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// In JSX:
<div ref={sentinelRef} className="col-span-full h-1" />
```

### Pattern 3: Skeleton loading grid

```typescript
// Loading state (reuse from TriesGrid pattern):
if (isLoading) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
```

### Pattern 4: SavedItem card design (Claude's Discretion)

SavedItem has `post_thumbnail_url` (nullable), `post_title` (nullable), `saved_at`. Cards should show:
- Thumbnail image (with fallback for null)
- Post title overlay at bottom
- Saved date (small, secondary)

Aspect ratio: `[3/4]` matches TriesGrid. Title overlay with gradient (same `from-black/60` pattern).

### Anti-Patterns to Avoid
- **Using useGetMySaved hook directly for infinite scroll:** Orval hooks are `useQuery` not `useInfiniteQuery`. Use the raw `getMySaved` function.
- **Adding react-intersection-observer:** Not installed. Use native `IntersectionObserver`.
- **Deleting collectionStore entirely without checking:** magazineStore imports `MagazineIssue` type from `collection/types.ts` — this is separate from collectionStore. The store exports are only used by collection-specific UI components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Infinite scroll detection | Custom scroll event listeners | Native IntersectionObserver (same as TriesGrid) | Already proven in Phase 49; scroll events are throttle-sensitive and imprecise |
| Pagination state tracking | Manual page counter in useState | `useInfiniteQuery` pageParam mechanism | TanStack handles next-page detection, loading states, deduplication |
| API data fetching | Custom fetch/useEffect | `getMySaved` raw fn in queryFn | Orval handles auth headers via customInstance mutator |

---

## Common Pitfalls

### Pitfall 1: Null thumbnails crash `<Image>`
**What goes wrong:** `SavedItem.post_thumbnail_url` is `string | null`. Passing `null` to `next/image` `src` throws a runtime error.
**Why it happens:** OpenAPI spec marks the field optional/nullable.
**How to avoid:** Guard with fallback — `src={item.post_thumbnail_url ?? "/placeholder.png"}` or conditionally render image vs placeholder div.
**Warning signs:** TypeScript error on `src` prop assignment.

### Pitfall 2: Null post title breaks layout
**What goes wrong:** `SavedItem.post_title` is `string | null`. Rendering it directly causes "null" text to appear.
**How to avoid:** Use `item.post_title ?? "Untitled"` or hide title when null.

### Pitfall 3: collectionStore mock data still loads after deletion
**What goes wrong:** If only the constants are deleted but `loadCollection` still calls them (e.g., as empty arrays), store still sets `pins: []` and `boards: []` on mount — harmless but dead code.
**How to avoid:** After deleting MOCK_PINS/MOCK_BOARDS, update `loadCollection` to be a no-op or remove it if no other callers remain.

### Pitfall 4: Stale import references in SavedGrid
**What goes wrong:** After rewrite, old imports (`collectionStore`, `PinGrid`, `BoardGrid`, `CollageView`) still present → TypeScript/ESLint warnings.
**How to avoid:** Remove all 4 old imports in the rewrite.

---

## Code Examples

### Full SavedGrid shell (pattern reference)
```typescript
// Source: Pattern derived from packages/web/lib/components/profile/TriesGrid.tsx
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getMySaved } from "@/lib/api/generated/users/users";
import type { SavedItem } from "@/lib/api/generated/models";

const PER_PAGE = 20;

export function SavedGrid({ className }: { className?: string }) {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["/api/v1/users/me/saved"],
      queryFn: async ({ pageParam }) =>
        getMySaved({ page: pageParam as number, per_page: PER_PAGE }),
      getNextPageParam: (lastPage) =>
        lastPage.pagination.current_page < lastPage.pagination.total_pages
          ? lastPage.pagination.current_page + 1
          : undefined,
      initialPageParam: 1,
      staleTime: 1000 * 60,
    });

  const items: SavedItem[] = data?.pages.flatMap((p) => p.data) ?? [];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) { /* skeleton grid */ }
  if (isError) { /* error + retry */ }
  if (items.length === 0) { /* Bookmark icon + "저장한 포스트가 없습니다" */ }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
      {items.map((item) => (
        <SavedCard key={item.id} item={item} />
      ))}
      <div ref={sentinelRef} className="col-span-full h-1" />
      {isFetchingNextPage && /* loading more skeletons */}
    </div>
  );
}
```

### MOCK_PINS/MOCK_BOARDS deletion in collectionStore.ts
```typescript
// Delete lines 38–154 in collectionStore.ts (the two const blocks)
// Then update loadCollection to be a no-op since pins/boards come from API now:
loadCollection: async () => {
  // mock data removed — this function is now a no-op
},
```

---

## collectionStore Usage Audit (Claude's Discretion Input)

Confirmed via grep:
- `useCollectionStore` is imported in **8 files**:
  - `collectionStore.ts` (definition)
  - `SavedGrid.tsx` (being rewritten → will remove this import)
  - `PinGrid.tsx`, `BoardGrid.tsx`, `CollageView.tsx`, `CollectionHeader.tsx`, `BoardCard.tsx`, `PinCard.tsx`
- All 6 collection components (`PinGrid`, `BoardGrid`, `CollageView`, `CollectionHeader`, `BoardCard`, `PinCard`) are **only imported from `SavedGrid.tsx`** — no other consumers.
- After SavedGrid rewrite, these 6 components become dead code with no importers.
- `magazineStore.ts` imports `MagazineIssue` type from `collection/types.ts` — this is a **type-only import, not from collectionStore** — safe to ignore.

**Recommendation:** Safe to delete `PinGrid.tsx`, `BoardGrid.tsx`, `CollageView.tsx`, `CollectionHeader.tsx`, `BoardCard.tsx`, `PinCard.tsx`. Keep `collection/types.ts`, `collection/index.ts`, and the other collection components (`BookshelfView`, `IssueDetailPanel`, etc.) that are unrelated to pins/boards.

The `collectionStore` store itself (minus mock data) has no active callers after the SavedGrid rewrite, so it could be deleted entirely. However, since the decision is marked as Claude's Discretion, the safe minimum is: delete MOCK_PINS/MOCK_BOARDS constants + update `loadCollection` to no-op.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| collectionStore + mock data | useInfiniteQuery + real API | Phase 50 | Real saved posts from backend |
| Pins/Boards/Collage sub-tabs | Single saved posts grid | Phase 50 | Simpler UX, matches REQUIREMENTS.md |
| react-intersection-observer (not installed) | Native IntersectionObserver | Phase 49 established | Zero dependency, same API surface |

---

## Open Questions

1. **Card click behavior**
   - What we know: SavedItem has `post_id` field
   - What's unclear: Should clicking a saved card navigate to the post detail page? No explicit requirement stated.
   - Recommendation: No-op click for now (same as TriesGrid which has non-navigating buttons). Can link to `/post/{post_id}` if route exists.

2. **Thumbnail fallback for null values**
   - What we know: `post_thumbnail_url` is nullable
   - What's unclear: What placeholder image/color to use when null
   - Recommendation: Use `bg-muted` placeholder div matching skeleton style, consistent with design system.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in config.json — treated as enabled. However, no test framework is configured in the project for frontend components.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected for React components (no jest/vitest config in packages/web) |
| Config file | N/A |
| Quick run command | `cd packages/web && bun run typecheck` |
| Full suite command | `cd packages/web && bun run typecheck && bun run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVED-03 | SavedGrid renders real data from API | manual | `bun run typecheck` (type safety) | ❌ No component tests |
| SAVED-04 | MOCK_PINS/MOCK_BOARDS removed from collectionStore | unit/grep | `grep -c "MOCK_PINS" collectionStore.ts` should return 0 | ❌ No test file |
| SAVED-05 | Infinite scroll loads next page | manual | visual browser test | ❌ No E2E tests |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run typecheck`
- **Per wave merge:** `cd packages/web && bun run typecheck && bun run lint`
- **Phase gate:** TypeScript clean + no lint errors before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure gaps block implementation. TypeScript typecheck serves as the spec drift safety net (established in Phase 43-01).

---

## Sources

### Primary (HIGH confidence)
- `packages/web/lib/components/profile/TriesGrid.tsx` — canonical infinite scroll pattern (Phase 49)
- `packages/web/lib/api/generated/users/users.ts` — `getMySaved` raw function signature confirmed
- `packages/web/lib/api/generated/models/savedItem.ts` — `SavedItem` type fields confirmed
- `packages/web/lib/api/generated/models/getMySaved200.ts` — response shape: `{ data: SavedItem[], pagination: PaginationMeta }`
- `packages/web/lib/api/generated/models/paginationMeta.ts` — `current_page`, `total_pages` field names confirmed
- `packages/web/lib/stores/collectionStore.ts` — mock data location + store shape confirmed
- `packages/web/lib/components/profile/SavedGrid.tsx` — existing implementation fully read

### Secondary (MEDIUM confidence)
- Grep results: collectionStore import graph — all 8 consumers confirmed; 6 collection components are dead code after rewrite

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs/hooks verified against actual generated files
- Architecture: HIGH — TriesGrid pattern is proven and directly applicable
- Pitfalls: HIGH — derived from reading actual source types (nullable fields confirmed in generated models)
- collectionStore cleanup: HIGH — grep-verified import graph

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable codebase, generated types won't change without backend changes)
