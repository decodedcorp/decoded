# Explore 검색 API 적극 활용 — 컴팩트 필터 바 + 서버사이드 필터링

## Context

현재 검색은 `q`와 `page/limit`만 API에 전달하고, 아티스트 필터링은 client-side로 처리중. 이슈 #50에서 구현된 `category`, `context`, `media_type`, `has_adopted`, `sort` 파라미터를 활용하지 않음. 이를 적극 활용하여 서버사이드 필터링 + 정렬을 구현한다.

## 변경 요약

### 1. TrendingArtistsSection 제거

**파일:** `packages/web/app/explore/ExploreClient.tsx`
- `TrendingArtistsSection` import 및 렌더링 제거
- 관련 `!hasMagazine && mode === "browse"` 조건 삭제

### 2. useExploreData — API 파라미터 전부 활용

**파일:** `packages/web/lib/hooks/useExploreData.ts`

현재 `search({ q, page, limit })`만 전달 → 모든 SearchParams 활용:

```typescript
interface ActiveSearchFilters {
  context: string | null;
  sort: string;  // "relevant" | "recent" | "popular" | "solution_count"
}
```

- `context` — 드롭다운에서 선택 → API `context` param
- `sort` — 드롭다운에서 선택 → API `sort` param  
- 아티스트 뱃지 — client-side 필터 유지 (API에 artist 필터 파라미터 없음)
- `selectedArtists` 상태 유지 → items에서 client-side 필터

API 호출:
```typescript
search({
  q: debouncedQuery,
  context: activeFilters.context ?? undefined,
  sort: activeFilters.sort !== "relevant" ? activeFilters.sort : undefined,
  page: pageParam,
  limit: 40,
})
```

queryKey에 context, sort 포함 → 필터 변경 시 자동 재요청.

### 3. ExploreClient — 컴팩트 필터 바

**파일:** `packages/web/app/explore/ExploreClient.tsx`

검색 바 아래에 한 줄 필터 바:

```
[Sort ▾] [Context ▾] [Lisa ×] [Hanni ×] [Clear all]
```

**Sort 드롭다운** (고정 옵션):
- Relevant (기본)
- Recent
- Popular  
- Most Solutions

**Context 드롭다운** (검색 결과에서 추출):
- 검색 결과의 unique context 값들을 드롭다운 옵션으로 표시
- 예: airport, stage, street style, mv 등
- 선택하면 API `context` param으로 전달

**아티스트 뱃지** (검색 결과에서 추출):
- 현재 로직 유지 — client-side 다중 선택
- 드롭다운 우측에 뱃지로 표시

**구현:**
- Sort/Context 드롭다운은 간단한 `<select>` 또는 custom dropdown
- 검색 모드에서만 필터 바 표시
- browse 모드에서는 필터 바 숨김

### 4. Context facets 추출

**파일:** `packages/web/lib/hooks/useExploreData.ts`

아티스트 facets처럼 context도 client-side 집계:

```typescript
interface SearchFacets {
  artist: FacetMap;   // 기존
  context: FacetMap;  // 추가
}
```

`buildFacets(items)` 함수에서 `item.context` 값도 수집하여 드롭다운 옵션으로 제공.

### 5. 반환 타입 변경

```typescript
interface UseExploreDataReturn {
  // 기존 유지
  items, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, mode, refetch
  // 변경
  artistFacets: FacetMap;
  contextFacets: FacetMap;
  selectedArtists: string[];
  toggleArtist: (name: string) => void;
  clearArtistFilters: () => void;
  activeContext: string | null;
  setContext: (ctx: string | null) => void;
  activeSort: string;
  setSort: (sort: string) => void;
}
```

## 파일 변경 목록

| 파일 | 액션 | 내용 |
|------|------|------|
| `packages/web/lib/hooks/useExploreData.ts` | Modify | context/sort API params, context facets, 반환 타입 확장 |
| `packages/web/app/explore/ExploreClient.tsx` | Modify | TrendingArtists 제거, 컴팩트 필터 바(Sort+Context 드롭다운+아티스트 뱃지) |

## 검증

1. `bunx tsc --noEmit` — 타입 에러 없음
2. `bun run build` — 빌드 통과
3. 수동 테스트:
   - 검색 "newjeans" → 아티스트 뱃지 + context 드롭다운 옵션 표시
   - Sort 변경 → 결과 재정렬 (API 재요청)
   - Context 선택 (예: "street style") → 해당 context만 필터 (API 재요청)
   - 아티스트 뱃지 클릭 → client-side 필터
   - Sort + Context + Artist 복합 필터 동작 확인
