# Explore 검색/필터/패널 모달 — 잔여 작업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Issue #61의 남은 작업을 완료한다 — explore 페이지 검색 입력 UI 추가, EditorialPreviewHeader에 "전체 editorial 보기" 버튼 추가, 검색 모드 페이지네이션, 통합 검증.

**Architecture:** `SearchInput` 컴포넌트를 explore 페이지에 inline으로 배치하여 `useSearchStore.debouncedQuery`를 구동한다. `useExploreData`의 search 모드에 page 기반 페이지네이션을 추가하여 무한 스크롤을 지원한다. `EditorialPreviewHeader`에 "전체 editorial 보기" 내비게이션 버튼을 추가하여 이슈 요구사항을 완성한다.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / TanStack Query 5 / Zustand / Meilisearch API (Orval generated)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/web/app/explore/ExploreClient.tsx` | Modify | 검색 입력 UI 추가 |
| `packages/web/lib/components/detail/EditorialPreviewHeader.tsx` | Modify | description, postId, "전체 editorial 보기" 버튼 추가 |
| `packages/web/lib/components/detail/ImageDetailContent.tsx` | Modify | EditorialPreviewHeader에 새 props 전달 |
| `packages/web/lib/hooks/useExploreData.ts` | Modify | 검색 모드 페이지네이션 (useInfiniteQuery 패턴) |

---

## Task 1: Explore 페이지에 검색 입력 UI 추가

현재 `ExploreClient`는 `useSearchStore.debouncedQuery`를 읽지만, 실제로 검색어를 입력할 수 있는 UI가 explore 페이지에 없다. 기존 `SearchInput` 컴포넌트는 `/search` 페이지 전용이고 `useSearchNavigation`(URL 전환)에 의존하므로, explore에는 가벼운 inline 검색 바를 직접 추가한다.

**Files:**
- Modify: `packages/web/app/explore/ExploreClient.tsx`

- [ ] **Step 1: import 추가**

```typescript
// packages/web/app/explore/ExploreClient.tsx 상단에 추가
import { useRef, useCallback } from "react"; // useState, useEffect는 기존에 있음
import { Search, X } from "lucide-react";
import { useDebounce } from "@decoded/shared";
```

NOTE: `useDebounce`가 `@decoded/shared`에서 export되는지 먼저 확인. 없으면 직접 debounce 로직을 구현한다.

- [ ] **Step 2: 검색 상태 연결**

ExploreClient 컴포넌트 내부에 검색 입력 상태를 추가한다. 기존 `debouncedQuery`와 `useSearchStore`를 활용:

```typescript
// ExploreClient 내부, 기존 debouncedQuery 선언 아래
const query = useSearchStore((state) => state.query);
const setQuery = useSearchStore((state) => state.setQuery);
const setDebouncedQuery = useSearchStore((state) => state.setDebouncedQuery);

const inputRef = useRef<HTMLInputElement>(null);

// Debounce: query → debouncedQuery (300ms)
const debouncedValue = useDebounce(query, 300);
useEffect(() => {
  setDebouncedQuery(debouncedValue);
}, [debouncedValue, setDebouncedQuery]);

const handleClear = useCallback(() => {
  setQuery("");
  setDebouncedQuery("");
  inputRef.current?.focus();
}, [setQuery, setDebouncedQuery]);
```

- [ ] **Step 3: 검색 입력 JSX 추가**

TrendingArtistsSection 위에 검색 바를 배치한다:

```tsx
{/* Search bar — explore 탭에서만 표시 */}
{!hasMagazine && (
  <div className="relative px-4 pt-3 pb-1 shrink-0">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, shows, items..."
        className="w-full rounded-full border border-border bg-card/80 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {query.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          type="button"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 4: 불필요한 import 정리**

`useRef`, `useCallback`이 기존 import 문에 포함되어 있으면 중복 추가하지 않는다. 기존 import에서 `useState, useEffect, useMemo`가 있으므로 `useRef, useCallback`만 추가하면 된다.

- [ ] **Step 5: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add packages/web/app/explore/ExploreClient.tsx
git commit -m "feat(explore): add inline search input to explore page (#61)"
```

---

## Task 2: EditorialPreviewHeader에 "전체 editorial 보기" 버튼 추가

현재 `EditorialPreviewHeader`는 title/author/date만 표시하는 스텁이다. 이슈 #61의 요구사항인 description 요약과 "전체 editorial 보기 → `/posts/[id]`" 버튼이 빠져 있다.

**Files:**
- Modify: `packages/web/lib/components/detail/EditorialPreviewHeader.tsx`

- [ ] **Step 1: Props 확장 및 전체 컴포넌트 재작성**

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
}

export function EditorialPreviewHeader({
  title,
  description,
  author,
  date,
  postId,
}: EditorialPreviewHeaderProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-3 px-6 py-5 border-b border-border">
      <h2 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
        {title}
      </h2>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {(author || formattedDate) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {author && <span>{author}</span>}
            {author && formattedDate && <span>·</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        )}

        <Link
          href={`/posts/${postId}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          전체 보기
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: `EditorialPreviewHeader`의 새 props(`description`, `postId`)가 호출 측에서 누락 에러 발생 → Task 3에서 수정

- [ ] **Step 3: Commit (Task 3과 함께)**

Task 3 완료 후 함께 커밋한다.

---

## Task 3: ImageDetailContent에서 새 EditorialPreviewHeader props 전달

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx:242-249`

- [ ] **Step 1: EditorialPreviewHeader 호출부 수정**

```tsx
// packages/web/lib/components/detail/ImageDetailContent.tsx:242-249
// 기존:
{isExplorePreview && (
  <EditorialPreviewHeader
    title={(firstPost as Record<string, unknown>)?.title as string ?? imageWithOwner.artist_name ?? "Untitled"}
    author={imageWithOwner.artist_name ?? imageWithOwner.group_name ?? null}
    date={image.created_at ?? null}
  />
)}

// 변경:
{isExplorePreview && (
  <EditorialPreviewHeader
    title={(firstPost as Record<string, unknown>)?.title as string ?? imageWithOwner.artist_name ?? "Untitled"}
    description={aiSummary}
    author={imageWithOwner.artist_name ?? imageWithOwner.group_name ?? null}
    date={image.created_at ?? null}
    postId={image.id}
  />
)}
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/detail/EditorialPreviewHeader.tsx packages/web/lib/components/detail/ImageDetailContent.tsx
git commit -m "feat(explore): complete EditorialPreviewHeader with description and nav button (#61)"
```

---

## Task 4: 검색 모드 페이지네이션 추가

현재 `useExploreData`의 search 모드는 `fetchNextPage: () => {}`, `hasNextPage: false`를 반환하여 무한 스크롤이 작동하지 않는다. Meilisearch API가 `page`/`limit` 파라미터와 `PaginationMeta`를 지원하므로 이를 활용한다.

**Files:**
- Modify: `packages/web/lib/hooks/useExploreData.ts`

- [ ] **Step 1: useSearch를 useInfiniteQuery 패턴으로 교체**

`useSearch`(Orval generated)는 단일 페이지만 반환한다. 검색 무한 스크롤을 위해 `useInfiniteQuery`로 래핑한다:

```typescript
// packages/web/lib/hooks/useExploreData.ts
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import { useInfinitePosts, type PostGridItem } from "./useImages";
import { search } from "@/lib/api/generated/search/search";
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

const SEARCH_PAGE_SIZE = 20;

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

  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const { mediaId, castId, contextType } = useHierarchicalFilterStore();

  const isSearchMode = debouncedQuery.trim().length > 0;

  // Browse mode: Supabase via useInfinitePosts
  const browseResult = useInfinitePosts({
    enabled: !isSearchMode,
    limit: 40,
    hasMagazine,
    mediaName: mediaId ?? undefined,
    castName: castId ?? undefined,
    contextType: contextType ?? undefined,
  });

  // Search mode: Meilisearch with infinite pagination
  const searchResult = useInfiniteQuery({
    queryKey: [
      "search",
      "infinite",
      { q: debouncedQuery, context: contextType, media_type: mediaId },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await search({
        q: debouncedQuery,
        context: contextType ?? undefined,
        media_type: mediaId ?? undefined,
        page: pageParam,
        limit: SEARCH_PAGE_SIZE,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.pagination;
      return current_page < total_pages ? current_page + 1 : undefined;
    },
    enabled: isSearchMode,
  });

  const items: PostGridItem[] = useMemo(() => {
    if (isSearchMode) {
      return (searchResult.data?.pages ?? []).flatMap((page) =>
        page.data.map(mapSearchResultToGridItem)
      );
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
      fetchNextPage: searchResult.fetchNextPage,
      hasNextPage: !!searchResult.hasNextPage,
      isFetchingNextPage: searchResult.isFetchingNextPage,
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

핵심 변경:
- `useSearch` (Orval hook) → `search` (raw function) + `useInfiniteQuery` 직접 사용
- `pageParam`으로 페이지 번호 관리
- `getNextPageParam`에서 `pagination.current_page < pagination.total_pages` 체크
- items 매핑에서 `.pages.flatMap()` 사용

- [ ] **Step 2: import 정리**

기존 `useSearch` import를 `search` (raw function)으로 교체한다. Orval은 raw function과 hook 모두 export한다:

```typescript
// 제거: import { useSearch } from "@/lib/api/generated/search/search";
// 추가: import { search } from "@/lib/api/generated/search/search";
```

- [ ] **Step 3: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음. `search()` 함수의 반환 타입이 `SearchResponse`인지 확인.

NOTE: Orval raw function이 `SearchResponse`를 직접 반환하는지, 아니면 `AxiosResponse<SearchResponse>`를 반환하는지 확인 필요. `customInstance` mutator 패턴에 따라 다를 수 있다. 타입 에러가 나면 `response.data`로 접근하거나 타입 단언이 필요할 수 있다.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/hooks/useExploreData.ts
git commit -m "feat(explore): add search mode infinite pagination via useInfiniteQuery (#61)"
```

---

## Task 5: 통합 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | tail -5`
Expected: 에러 0개

- [ ] **Step 2: Lint**

Run: `cd packages/web && npx eslint app/explore/ lib/hooks/useExploreData.ts lib/components/detail/EditorialPreviewHeader.tsx lib/components/detail/ImageDetailContent.tsx --max-warnings 0 2>&1 | tail -10`
Expected: 에러 없음

- [ ] **Step 3: 빌드 확인**

Run: `cd packages/web && bun run build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 4: 수동 검증 체크리스트**

- [ ] `/explore` 페이지 로드 — 검색 바 + 필터 바 + 그리드 정상 표시
- [ ] 검색어 입력 → 300ms 디바운스 후 Meilisearch 결과 표시
- [ ] 검색 결과에서 스크롤 → 다음 페이지 자동 로드 (무한 스크롤)
- [ ] 검색어 지우기(X 버튼) → browse 모드로 복귀
- [ ] 필터 선택(Media → Cast) → 그리드 refetch
- [ ] 카드 클릭 → 모달 열림 → EditorialPreviewHeader 표시 (title, description, author, date)
- [ ] "전체 보기" 버튼 → `/posts/[id]` 풀페이지 이동
- [ ] 다른 페이지에서 카드 클릭 → 기존 full variant 모달 (EditorialPreviewHeader 없음)

- [ ] **Step 5: 최종 commit (필요시)**

```bash
git add -A
git commit -m "feat(explore): complete search/filter/modal integration (#61)"
```
