---
title: Explore 검색/필터 연동 및 패널 모달 개선
owner: human
status: approved
updated: 2026-04-03
tags: [ui]
---

# Explore 검색/필터 연동 및 패널 모달 개선

**Issue**: [#61](https://github.com/decodedcorp/decoded/issues/61)
**Date**: 2026-04-03
**Status**: Approved
**Epic**: #35 (1차 릴리즈)

## Overview

Explore 페이지에 Meilisearch 검색 연결, hierarchical filter 로직 연동, 패널 모달 editorial 미리보기 개선. 하이브리드 검색 아키텍처(검색어 → Meilisearch, 필터 → Supabase)를 통합 훅으로 캡슐화.

## Decisions

| 결정 사항   | 선택                                | 이유                                      |
| ----------- | ----------------------------------- | ----------------------------------------- |
| 검색 방식   | 하이브리드 (Meilisearch + Supabase) | 검색어 최적화 + 필터 성능 양립            |
| 필터 데이터 | Mock 유지                           | 1차 릴리즈 스코프, 연결 검증 우선         |
| 모달 변경   | Right drawer 콘텐츠만               | 기존 레이아웃/트리거/spot scroll 보존     |
| 아키텍처    | 통합 훅 useExploreData              | ExploreClient 단순 유지, 데이터 소스 격리 |

## Architecture

### 데이터 흐름

```
searchStore.debouncedQuery ──┐
                              ├──→ useExploreData({ hasMagazine })
hierarchicalFilterStore ─────┘         │
  (mediaId, castId, contextType)       │
                                       ├── query 있음 → useSearch (Meilisearch)
                                       ├── query 없음 → useInfinitePosts (Supabase)
                                       │
                                       └── return { items, isLoading, isError,
                                             fetchNextPage, hasNextPage,
                                             isFetchingNextPage, mode, activeFilters }
```

### ExploreClient 렌더 구조 (변경 후)

```
ExploreClient.tsx
├── TrendingArtistsSection (기존 유지)
├── ExploreFilterBar (새로 추가 — 기존 컴포넌트 import)
│   └── 칩: mediaId, castId, contextType 표시
├── ThiingsGrid (기존 유지, data source → useExploreData)
│   └── items from useExploreData
└── ExploreFilterSheet (모바일 바텀시트, 새로 추가)
```

## Component Changes

### 1. 새 파일: `useExploreData` 훅

**경로**: `packages/web/lib/hooks/useExploreData.ts`

**역할**: 검색/필터 상태를 읽어 적절한 데이터 소스를 선택하고 통합된 인터페이스 반환.

```typescript
interface UseExploreDataOptions {
  hasMagazine?: boolean;
}

interface UseExploreDataReturn {
  items: PostGridItem[];
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  mode: "search" | "browse";
  activeFilters: {
    mediaId: string | null;
    castId: string | null;
    contextType: string | null;
  };
}
```

**내부 로직**:

- 두 훅 모두 항상 호출 (React 규칙), `enabled` 옵션으로 비활성화
- browse 모드: `useInfinitePosts({ enabled: !debouncedQuery, mediaName: mediaId, castName: castId, contextType, hasMagazine, limit: 40 })`
- search 모드: `useSearch({ enabled: !!debouncedQuery, query: debouncedQuery })`
- search 결과를 `PostGridItem[]`으로 매핑하는 변환 함수 포함

**queryKey 구조**:

```typescript
// browse 모드
["explore-posts", { mediaId, castId, contextType, hasMagazine }][
  // search 모드 (useSearch 내부 키 사용)
  ("search", { query: debouncedQuery })
];
```

### 2. 변경: `ExploreClient.tsx`

**변경 범위**: 데이터 소스를 `useExploreData`로 교체, 필터 UI 추가

**변경 전**:

```typescript
const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
const {
  data,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfinitePosts({ limit: 40, hasMagazine: hasMagazine ?? false });
```

**변경 후**:

```typescript
const {
  items,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  mode,
  activeFilters,
} = useExploreData({
  hasMagazine: hasMagazine ?? false,
});
```

**렌더 추가**:

- `<ExploreFilterBar />` — TrendingArtistsSection 아래에 배치
- `<ExploreFilterSheet />` — 컴포넌트 하단에 배치

**데이터 매핑 변경**:

- 기존: `data.pages.flatMap(page => page.items)`
- 변경: `items` 직접 사용 (useExploreData가 flatten 처리)

### 3. 변경: `useInfinitePosts` (minor)

**경로**: `packages/web/lib/hooks/useImages.ts`

**변경**: `enabled` 옵션 지원 추가

```typescript
export function useInfinitePosts(params: {
  // ... 기존 params
  enabled?: boolean; // 추가 — default: true
});
```

`useInfiniteQuery`의 `enabled` 옵션으로 전달.

### 4. 변경: `ImageDetailContent` — Editorial 미리보기

**variant prop 추가**:

```typescript
type ImageDetailContentProps = {
  variant?: "full" | "explore-preview"; // default: "full"
  // ... 기존 props
};
```

**variant="explore-preview" 동작**:

- `EditorialPreviewHeader` 표시: title(h2), description(2-3줄 truncate), 메타(작성자/날짜), "전체 editorial 보기" 버튼
- `ShowcaseSection` 유지 (spot scroll 그대로)
- `ShopSection`, `CommentsSection`, `RelatedSection` 숨김

**variant="full" 동작**: 기존과 동일 (변경 없음)

### 5. 새 컴포넌트: `EditorialPreviewHeader`

**경로**: `packages/web/lib/components/detail/EditorialPreviewHeader.tsx`

```typescript
interface EditorialPreviewHeaderProps {
  title: string;
  description?: string;
  author?: string;
  date?: string;
  postId: string;
  onNavigateToFull: () => void;
}
```

**렌더링**:

- Post title (h2, font-bold)
- Description 요약 (line-clamp-3)
- 메타 정보 행 (작성자 + 날짜)
- "전체 editorial 보기 →" 버튼 (Link to `/posts/[id]`, 모달 close)

### 6. 변경: Intercepting route + ExploreCardCell

**Intercepting route 경로**: `packages/web/app/@modal/(.)posts/[id]/page.tsx`

이 route는 루트 레벨 공유 모달이므로, Explore에서 온 것인지 구분이 필요합니다.

**방식**: ExploreCardCell의 Link에 query param 추가

```typescript
// ExploreCardCell.tsx
<Link href={`/posts/${imageId}?from=explore`} ...>
```

**Intercepting route에서 variant 결정**:

```typescript
// @modal/(.)posts/[id]/page.tsx
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ModalPostDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const variant = from === "explore" ? "explore-preview" : "full";
  return <ImageDetailModal imageId={id} variant={variant} />;
}
```

`ImageDetailModal`이 variant를 `ImageDetailContent`에 전달.

## Files Changed

| 파일                                                            | 변경 유형 | 설명                                    |
| --------------------------------------------------------------- | --------- | --------------------------------------- |
| `packages/web/lib/hooks/useExploreData.ts`                      | 신규      | 통합 데이터 훅                          |
| `packages/web/app/explore/ExploreClient.tsx`                    | 수정      | 데이터 소스 교체, 필터 UI 추가          |
| `packages/web/lib/hooks/useImages.ts`                           | 수정      | useInfinitePosts에 enabled 옵션 추가    |
| `packages/web/lib/components/detail/ImageDetailContent.tsx`     | 수정      | variant prop, 조건부 섹션 렌더링        |
| `packages/web/lib/components/detail/EditorialPreviewHeader.tsx` | 신규      | Editorial 미리보기 헤더                 |
| `packages/web/app/@modal/(.)posts/[id]/page.tsx`                | 수정      | searchParams에서 from 읽어 variant 결정 |
| `packages/web/lib/components/explore/ExploreCardCell.tsx`       | 수정      | Link href에 ?from=explore 추가          |

## Error Handling

- **검색 실패**: Meilisearch 에러 시 빈 결과 + 에러 토스트. Supabase 필터 브라우징으로 자동 폴백하지 않음 (사용자 의도 존중)
- **필터 결과 없음**: "선택한 필터에 맞는 결과가 없습니다" empty state 표시
- **모달 데이터 로딩 실패**: 기존 ImageDetailModal 에러 핸들링 유지

## Testing Strategy

- `useExploreData`: 모드 전환 테스트 (query 유무에 따른 분기)
- Filter → refetch: hierarchicalFilterStore 변경 시 queryKey 변경 확인
- 모달 variant: explore-preview에서 숨겨지는 섹션 확인
- "전체 보기" 버튼: 라우팅 + 모달 close 동작

## Out of Scope

- 필터 옵션을 실제 API에서 가져오기 (mock 유지)
- URL에 필터 상태 반영 (후속 이슈)
- 검색 자동완성/추천
- 필터 간 종속 관계 (media 선택 시 cast 필터링 — mock에서만 동작)
