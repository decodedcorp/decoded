# Explore 검색 기반 필터 UX 전환

## Context

현재 explore 페이지의 필터는 hierarchical 드롭다운(Media → Cast)으로, mock 데이터를 사용하여 실제 동작하지 않음. 사용자 요청: 검색 입력 기반으로 전환하고, 필터 결과를 뱃지(chip) 형태로 표시.

**변경 방향:** 검색어 입력 → Meilisearch facets에서 관련 필터를 뱃지로 자동 추천 → 뱃지 클릭으로 토글 필터링. 기존 드롭다운 필터 완전 제거.

## 핵심 변경

### 1. `useExploreData` — facets 반환 + hierarchicalFilterStore 제거

**파일:** `packages/web/lib/hooks/useExploreData.ts`

- `hierarchicalFilterStore` import/사용 제거
- 검색 결과에서 `facets` 데이터를 추출하여 반환
- 내부 필터 상태를 간단한 `useState`로 관리 (context, media_type)
- Meilisearch facets가 null이면 검색 결과에서 client-side 집계 (artist_name, context 등)
- 반환 타입에 `facets` 및 `activeFilters` + `toggleFilter` 추가

```typescript
// 반환에 추가:
facets: { context: Record<string, number>; media_type: Record<string, number> };
activeSearchFilters: { context?: string; media_type?: string };
setSearchFilter: (key: "context" | "media_type", value: string | null) => void;
```

### 2. `ExploreClient` — ExploreFilterBar 제거, 뱃지 UI 추가

**파일:** `packages/web/app/explore/ExploreClient.tsx`

- `ExploreFilterBar` import/렌더링 제거
- 검색 바 아래에 facet 뱃지 영역 추가
- `useExploreData`에서 facets를 받아 `FilterChip`으로 렌더링
- 활성 필터는 하이라이트 뱃지, 비활성은 ghost 스타일
- 검색어 없을 때(browse 모드)는 뱃지 숨김

뱃지 UI 구조:
```
[검색 바]
[context: airport(3) | stage(5) | ...] [media: drama(2) | mv(4) | ...]
[그리드]
```

### 3. `FilterChip` — variant 추가

**파일:** `packages/web/lib/components/explore/FilterChip.tsx`

- 기존 `FilterChip` 유지하되 `active`/`inactive` variant 추가
- active: 현재 스타일 (bg-primary/10, text-primary, X 버튼)
- inactive: ghost 스타일 (border-border, text-muted-foreground, 클릭으로 활성화)
- count 옵션 추가 (뱃지에 결과 수 표시)

### 4. 제거 대상

| 파일 | 액션 |
|------|------|
| `packages/web/lib/components/explore/ExploreFilterBar.tsx` | 삭제 |
| `packages/shared/data/mockFilterData.ts` | 삭제 |
| `packages/shared/stores/hierarchicalFilterStore.ts` | ExploreClient에서 참조만 제거 (다른 곳에서 쓸 수 있으므로 파일 자체는 유지) |

### 5. Facets null 대응

Meilisearch 서버에서 facets가 null로 오는 경우, 검색 결과에서 client-side 집계:
```typescript
// 검색 결과에서 context/media_source.type 값을 추출하여 카운트
const clientFacets = useMemo(() => {
  const context: Record<string, number> = {};
  const media_type: Record<string, number> = {};
  items.forEach(item => {
    if (item.context) context[item.context] = (context[item.context] || 0) + 1;
    // media_source.type도 유사하게
  });
  return { context, media_type };
}, [items]);
```

## 검증

1. `bunx tsc --noEmit` — 타입 에러 없음
2. `bunx eslint --fix` — lint 통과
3. 수동 테스트:
   - `/explore` 접속 → 검색 바만 표시 (드롭다운 없음)
   - "Lisa" 검색 → 결과 + facet 뱃지 표시
   - 뱃지 클릭 → 필터 적용 → 결과 갱신
   - 뱃지 X 클릭 → 필터 해제
   - 검색어 지우기 → browse 모드 복귀, 뱃지 숨김
