# Explore 검색/필터 연동 및 패널 모달 개선 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explore 페이지에서 Meilisearch 하이브리드 검색, hierarchical 필터 연동, editorial 미리보기 패널 모달을 구현한다.

**Architecture:** `useExploreData` 통합 훅이 searchStore와 hierarchicalFilterStore를 구독하여, 검색어가 있으면 Meilisearch API(`useSearch`)를, 없으면 Supabase(`useInfinitePosts`)를 선택한다. ExploreClient는 이 훅만 호출하고 UI 렌더링에 집중한다. 패널 모달은 `?from=explore` query param으로 variant를 결정하여 editorial 미리보기를 표시한다.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / TanStack Query 5 / Zustand / Supabase / Orval generated hooks

**Spec:** [`docs/superpowers/specs/2026-04-03-explore-search-filter-modal-design.md`](../specs/2026-04-03-explore-search-filter-modal-design.md)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/web/lib/hooks/useImages.ts` | Modify | `useInfinitePosts`에 `enabled` 옵션 추가 |
| `packages/web/lib/hooks/useExploreData.ts` | Create | 통합 데이터 훅 — 검색/필터 상태 구독, 데이터 소스 선택 |
| `packages/web/app/explore/ExploreClient.tsx` | Modify | `useExploreData` 사용, 필터 UI 추가 |
| `packages/web/lib/components/explore/ExploreCardCell.tsx` | Modify | Link href에 `?from=explore` 추가 |
| `packages/web/app/@modal/(.)posts/[id]/page.tsx` | Modify | `searchParams`에서 `from` 읽어 variant 결정 |
| `packages/web/lib/components/detail/ImageDetailModal.tsx` | Modify | `variant` prop 수신 및 전달 |
| `packages/web/lib/components/detail/ImageDetailContent.tsx` | Modify | `variant` prop으로 조건부 섹션 렌더링 |
| `packages/web/lib/components/detail/EditorialPreviewHeader.tsx` | Create | Editorial 미리보기 헤더 컴포넌트 |

---

## Task 1: `useInfinitePosts`에 `enabled` 옵션 추가

**Files:**
- Modify: `packages/web/lib/hooks/useImages.ts:159-300`

- [ ] **Step 1: params 타입에 `enabled` 추가**

`packages/web/lib/hooks/useImages.ts`의 `useInfinitePosts` 함수 시그니처를 수정한다:

```typescript
// packages/web/lib/hooks/useImages.ts:159
export function useInfinitePosts(params: {
  limit?: number;
  category?: string;
  search?: string;
  artistName?: string;
  groupName?: string;
  sort?: "recent" | "popular" | "trending";
  hasMagazine?: boolean;
  mediaName?: string;
  castName?: string;
  contextType?: string;
  enabled?: boolean; // 추가
}) {
```

destructuring에도 추가:

```typescript
// :173 부근
const {
  limit = 40,
  category,
  search,
  artistName,
  groupName,
  sort = "recent",
  hasMagazine,
  mediaName,
  castName,
  contextType,
  enabled = true, // 추가
} = params;
```

- [ ] **Step 2: `useInfiniteQuery`에 `enabled` 전달**

```typescript
// :186 부근
return useInfiniteQuery<PostsPage>({
  queryKey: [
    "posts",
    "infinite",
    { category, search, artistName, groupName, sort, limit, hasMagazine, mediaName, castName, contextType },
  ],
  enabled, // 추가
  queryFn: async ({ pageParam }) => {
    // ... 기존 코드 유지
  },
  // ... 나머지 옵션 유지
});
```

- [ ] **Step 3: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: `useInfinitePosts` 관련 에러 없음

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/hooks/useImages.ts
git commit -m "feat(explore): add enabled option to useInfinitePosts"
```

---

## Task 2: `useExploreData` 통합 훅 생성

**Files:**
- Create: `packages/web/lib/hooks/useExploreData.ts`

- [ ] **Step 1: 훅 파일 생성**

```typescript
// packages/web/lib/hooks/useExploreData.ts
"use client";

import { useMemo } from "react";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import { useInfinitePosts, type PostGridItem } from "./useImages";
import { useSearch } from "@/lib/api/generated/search/search";
import type { SearchResultItem } from "@/lib/api/generated/models";

interface UseExploreDataOptions {
  hasMagazine?: boolean;
}

interface UseExploreDataReturn {
  items: PostGridItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  mode: "search" | "browse";
  activeFilters: {
    mediaId: string | null;
    castId: string | null;
    contextType: string | null;
  };
  refetch: () => void;
}

/** Map Meilisearch SearchResultItem → PostGridItem for grid compatibility */
function mapSearchResultToGridItem(item: SearchResultItem): PostGridItem {
  return {
    id: item.id,
    imageUrl: item.image_url,
    postId: item.id,
    postSource: "post" as const,
    postAccount: item.artist_name ?? item.group_name ?? "",
    postCreatedAt: "",
    spotCount: item.spot_count ?? 0,
    viewCount: item.view_count ?? 0,
    title: null,
  };
}

export function useExploreData(
  options: UseExploreDataOptions = {}
): UseExploreDataReturn {
  const { hasMagazine = false } = options;

  // ① Store 구독
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const { mediaId, castId, contextType } = useHierarchicalFilterStore();

  const isSearchMode = debouncedQuery.trim().length > 0;

  // ② Browse 모드: useInfinitePosts (Supabase)
  const browseResult = useInfinitePosts({
    enabled: !isSearchMode,
    limit: 40,
    hasMagazine,
    mediaName: mediaId ?? undefined,
    castName: castId ?? undefined,
    contextType: contextType ?? undefined,
  });

  // ③ Search 모드: useSearch (Meilisearch API)
  const searchResult = useSearch(
    { q: debouncedQuery, context: contextType ?? undefined },
    { query: { enabled: isSearchMode } }
  );

  // ④ 통합 반환
  const items: PostGridItem[] = useMemo(() => {
    if (isSearchMode) {
      return (searchResult.data?.data ?? []).map(mapSearchResultToGridItem);
    }
    return browseResult.data
      ? browseResult.data.pages.flatMap((page) => page.items)
      : [];
  }, [isSearchMode, searchResult.data, browseResult.data]);

  if (isSearchMode) {
    return {
      items,
      isLoading: searchResult.isLoading,
      isError: searchResult.isError,
      error: searchResult.error as Error | null,
      fetchNextPage: () => {},
      hasNextPage: false,
      isFetchingNextPage: false,
      mode: "search",
      activeFilters: { mediaId, castId, contextType },
      refetch: searchResult.refetch,
    };
  }

  return {
    items,
    isLoading: browseResult.isLoading,
    isError: browseResult.isError,
    error: browseResult.error as Error | null,
    fetchNextPage: browseResult.fetchNextPage,
    hasNextPage: !!browseResult.hasNextPage,
    isFetchingNextPage: browseResult.isFetchingNextPage,
    mode: "browse",
    activeFilters: { mediaId, castId, contextType },
    refetch: browseResult.refetch,
  };
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음. `SearchResultItem`의 `view_count` 필드가 없으면 매핑 함수에서 `0`으로 폴백.

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/hooks/useExploreData.ts
git commit -m "feat(explore): add useExploreData hybrid hook"
```

---

## Task 3: `ExploreClient` 데이터 소스 교체 및 필터 UI 연결

**Files:**
- Modify: `packages/web/app/explore/ExploreClient.tsx`

- [ ] **Step 1: import 변경**

기존 import를 교체하고 필터 컴포넌트를 추가한다:

```typescript
// 제거:
// import { useInfinitePosts, type PostGridItem } from "@/lib/hooks/useImages";
// import { useSearchStore } from "@/lib/stores/searchStore";

// 추가:
import { useExploreData } from "@/lib/hooks/useExploreData";
import type { PostGridItem } from "@/lib/hooks/useImages";
import { ExploreFilterBar } from "@/lib/components/explore/ExploreFilterBar";
```

- [ ] **Step 2: 데이터 소스를 `useExploreData`로 교체**

기존 코드 (라인 28-67):

```typescript
// 삭제할 코드:
const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
const {
  data,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfinitePosts({
  limit: 40,
  hasMagazine: hasMagazine ?? false,
});
const items: PostGridItem[] = useMemo(() => {
  return data ? data.pages.flatMap((page) => page.items) : [];
}, [data]);
```

교체 코드:

```typescript
const {
  items,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  mode,
} = useExploreData({
  hasMagazine: hasMagazine ?? false,
});

const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
```

NOTE: `debouncedQuery`는 `AnimatePresence`의 key와 empty state 메시지에서 여전히 사용되므로 남겨둔다. 단, `useSearchStore`를 다시 import해야 한다:

```typescript
import { useSearchStore } from "@/lib/stores/searchStore";
```

- [ ] **Step 3: `useMemo` → `items` import 정리**

기존 `items` 변수를 삭제하고 (Step 2에서 이미 `useExploreData`에서 받음), `gridItems` useMemo에서 `items` 사용은 그대로 유지:

```typescript
// 기존 gridItems useMemo는 변경 없이 유지 — items가 이제 useExploreData에서 옴
const gridItems: GridItem[] = useMemo(() => {
  return items
    .filter((item) => item.imageUrl != null)
    .map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      postId: item.postId,
      postSource: item.postSource,
      postAccount: item.postAccount,
      postCreatedAt: item.postCreatedAt,
      ...(hasMagazine &&
        item.title != null && { editorialTitle: item.title }),
      ...(item.spotCount != null &&
        item.spotCount > 0 && { spotCount: item.spotCount }),
    }));
}, [items, hasMagazine]);
```

- [ ] **Step 4: 필터 바 렌더링 추가**

TrendingArtistsSection 바로 아래에 ExploreFilterBar를 추가한다:

```tsx
{/* Trending artists section */}
{!hasMagazine && <TrendingArtistsSection />}

{/* Filter bar */}
{!hasMagazine && (
  <ExploreFilterBar className="px-4 py-2 shrink-0" />
)}
```

- [ ] **Step 5: `data` 참조 제거**

loading state 조건에서 `!data`를 `items.length === 0`으로 변경:

```typescript
// 기존: {isLoading && !data && (
// 변경:
{isLoading && items.length === 0 && (
```

- [ ] **Step 6: 불필요한 import 정리**

`useMemo`는 `gridItems`에서 여전히 사용하므로 유지. `useInfinitePosts` import만 제거 확인.

- [ ] **Step 7: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 8: Commit**

```bash
git add packages/web/app/explore/ExploreClient.tsx
git commit -m "feat(explore): wire useExploreData and filter bar to ExploreClient"
```

---

## Task 4: `ExploreCardCell`에 `?from=explore` 추가

**Files:**
- Modify: `packages/web/lib/components/explore/ExploreCardCell.tsx:73`

- [ ] **Step 1: Link href 변경**

```typescript
// 기존 (라인 73):
<Link
  href={`/posts/${imageId}`}
  scroll={false}
  onClick={handleClick}
  className="absolute inset-1"
>

// 변경:
<Link
  href={`/posts/${imageId}?from=explore`}
  scroll={false}
  onClick={handleClick}
  className="absolute inset-1"
>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/explore/ExploreCardCell.tsx
git commit -m "feat(explore): add ?from=explore to card links for modal variant"
```

---

## Task 5: `EditorialPreviewHeader` 컴포넌트 생성

**Files:**
- Create: `packages/web/lib/components/detail/EditorialPreviewHeader.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// packages/web/lib/components/detail/EditorialPreviewHeader.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface EditorialPreviewHeaderProps {
  title: string;
  description?: string | null;
  author?: string | null;
  date?: string | null;
  postId: string;
  onNavigateToFull: () => void;
}

export function EditorialPreviewHeader({
  title,
  description,
  author,
  date,
  postId,
  onNavigateToFull,
}: EditorialPreviewHeaderProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-4 px-6 py-5 border-b border-border">
      <h2 className="text-xl font-bold text-foreground leading-tight">
        {title}
      </h2>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {description}
        </p>
      )}

      {(author || formattedDate) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {author && <span>{author}</span>}
          {author && formattedDate && <span>·</span>}
          {formattedDate && <span>{formattedDate}</span>}
        </div>
      )}

      <Link
        href={`/posts/${postId}`}
        onClick={(e) => {
          e.preventDefault();
          onNavigateToFull();
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        전체 editorial 보기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/detail/EditorialPreviewHeader.tsx
git commit -m "feat(explore): add EditorialPreviewHeader component"
```

---

## Task 6: `ImageDetailContent`에 `variant` 조건부 렌더링 추가

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx`

- [ ] **Step 1: Props에 `variant` 추가**

```typescript
// 기존 Props (라인 37-47):
type Props = {
  image: ImageDetail & { ai_summary?: string | null };
  magazineLayout?: PostMagazineLayout | null;
  relatedEditorials?: RelatedEditorialItem[];
  isModal?: boolean;
  scrollContainerRef?: RefObject<HTMLElement>;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  hideImage?: boolean;
  onHeroClick?: () => void;
  variant?: "full" | "explore-preview"; // 추가
};
```

함수 시그니처에서 destructure:

```typescript
export function ImageDetailContent({
  image,
  magazineLayout,
  relatedEditorials,
  isModal = false,
  scrollContainerRef,
  activeIndex,
  onActiveIndexChange,
  hideImage = false,
  onHeroClick,
  variant = "full", // 추가
}: Props) {
```

- [ ] **Step 2: `EditorialPreviewHeader` import 및 렌더링**

파일 상단에 import 추가:

```typescript
import { EditorialPreviewHeader } from "./EditorialPreviewHeader";
import { useRouter } from "next/navigation";
```

(`useRouter`가 이미 import되어 있으면 스킵)

컴포넌트 내부에서 router 추가:

```typescript
const router = useRouter();
```

(`router`가 이미 있으면 스킵 — grep으로 확인)

- [ ] **Step 3: variant="explore-preview" 일 때 조건부 렌더링**

`ImageDetailContent`의 JSX에서 variant에 따라 섹션을 조건부로 표시한다.

렌더링 구조 (기존 JSX를 감싸는 방식):

```tsx
{/* Editorial preview header — explore 모달에서만 표시 */}
{variant === "explore-preview" && (
  <EditorialPreviewHeader
    title={image.title ?? image.artist_name ?? "Untitled"}
    description={image.ai_summary ?? null}
    author={image.artist_name ?? image.group_name ?? null}
    date={image.created_at ?? null}
    postId={image.id}
    onNavigateToFull={() => {
      router.push(`/posts/${image.id}`);
    }}
  />
)}
```

기존 HeroSection 숨김 (explore-preview에서):

```tsx
{variant !== "explore-preview" && (
  <HeroSection ... /> 
)}
```

하단 섹션 숨김:

```tsx
{variant !== "explore-preview" && (
  <>
    <ShopSection ... />
    <CommentsSection ... />
    <RelatedSection ... />
  </>
)}
```

NOTE: 정확한 JSX 구조는 기존 코드를 읽어서 적절한 위치에 조건문을 삽입해야 한다. 각 섹션 컴포넌트를 `{variant !== "explore-preview" && ...}`으로 감싸는 것이 핵심.

- [ ] **Step 4: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/detail/ImageDetailContent.tsx packages/web/lib/components/detail/EditorialPreviewHeader.tsx
git commit -m "feat(explore): add explore-preview variant to ImageDetailContent"
```

---

## Task 7: `ImageDetailModal`에 variant prop 전달

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailModal.tsx:17-19`
- Modify: `packages/web/app/@modal/(.)posts/[id]/page.tsx`

- [ ] **Step 1: `ImageDetailModal` Props에 `variant` 추가**

```typescript
// packages/web/lib/components/detail/ImageDetailModal.tsx
// 기존 (라인 17-19):
type Props = {
  imageId: string;
};

// 변경:
type Props = {
  imageId: string;
  variant?: "full" | "explore-preview";
};
```

함수 시그니처:

```typescript
// 기존 (라인 25):
export function ImageDetailModal({ imageId }: Props) {

// 변경:
export function ImageDetailModal({ imageId, variant = "full" }: Props) {
```

- [ ] **Step 2: `ImageDetailContent`에 variant 전달**

`renderContent()` 함수 내부에서 `ImageDetailContent`를 렌더링하는 두 곳에 `variant`를 추가한다:

```typescript
// 라인 200-212 (magazine post):
return (
  <ImageDetailContent
    image={image}
    magazineLayout={publishedMagazineLayout}
    relatedEditorials={magazine?.related_editorials ?? []}
    isModal
    variant={variant} // 추가
    scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement>}
    activeIndex={activeIndex}
    onActiveIndexChange={setActiveIndex}
  />
);

// 라인 216-227 (non-magazine post):
return (
  <ImageDetailContent
    image={image}
    magazineLayout={null}
    relatedEditorials={[]}
    isModal
    hideImage
    variant={variant} // 추가
    scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement>}
    activeIndex={activeIndex}
    onActiveIndexChange={setActiveIndex}
  />
);
```

- [ ] **Step 3: Intercepting route에서 `searchParams` 읽기**

```typescript
// packages/web/app/@modal/(.)posts/[id]/page.tsx
import { ImageDetailModal } from "@/lib/components/detail/ImageDetailModal";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ModalPostDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const variant = from === "explore" ? "explore-preview" : "full";
  return <ImageDetailModal imageId={id} variant={variant} />;
}
```

- [ ] **Step 4: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/detail/ImageDetailModal.tsx packages/web/app/@modal/\(.\)posts/\[id\]/page.tsx
git commit -m "feat(explore): pass variant through modal route to ImageDetailContent"
```

---

## Task 8: 통합 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | tail -5`
Expected: 에러 0개

- [ ] **Step 2: Lint**

Run: `cd packages/web && npx eslint app/explore/ lib/hooks/useExploreData.ts lib/components/detail/EditorialPreviewHeader.tsx --max-warnings 0 2>&1 | tail -10`
Expected: 에러 없음

- [ ] **Step 3: 빌드 확인**

Run: `cd packages/web && bun run build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 4: (선택) 로컬 개발 서버에서 수동 확인**

체크리스트:
- [ ] `/explore` 페이지 로드 — 기존 그리드 정상 표시
- [ ] 필터 바 표시 — media/cast 드롭다운 동작
- [ ] 필터 선택 시 그리드 refetch 확인
- [ ] 검색어 입력 시 Meilisearch 결과 표시
- [ ] 카드 클릭 → 모달 열림 → editorial 미리보기 헤더 표시
- [ ] "전체 editorial 보기" 버튼 → `/posts/[id]` 이동
- [ ] 다른 페이지(예: `/`)에서 카드 클릭 → 기존 full 모달 표시

- [ ] **Step 5: 최종 commit (필요시)**

```bash
git add -A
git commit -m "feat(explore): complete search/filter/modal integration (#61)"
```
