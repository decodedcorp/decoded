# Explore: Hide Posts Without Solutions or Magazine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explore 페이지에서 solution이 등록되지 않고 magazine도 없는 포스트를 숨겨서 콘텐츠 품질을 높인다.

**Architecture:** Supabase 직접 쿼리 경로에 `.or()` 필터를 추가하여 `created_with_solutions=true` OR `post_magazine_id IS NOT NULL` 조건으로 필터링한다. REST API 경로(Editorial 탭)는 이미 `has_magazine=true`로 필터되어 변경 불필요. 검색 모드는 프론트엔드에서 `spot_count > 0` 기반 필터링 추가.

**Tech Stack:** TypeScript, Supabase JS Client, React Query, Orval (generated types)

**Data Context:**
- 총 603개 활성 포스트 중 42개(~7%)가 숨겨짐 (magazine 없음 AND solutions 없음)
- `created_with_solutions` boolean 컬럼이 posts 테이블에 존재
- `post_magazine_id` uuid 컬럼이 posts 테이블에 존재
- Orval 재생성 불필요 (기존 타입으로 충분)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/web/lib/hooks/useImages.ts:231-235` | Supabase 쿼리에 or 필터 추가 |
| Modify | `packages/web/lib/hooks/useExploreData.ts:76-83` | 검색 모드 결과 필터링 |

---

### Task 1: Supabase Browse Mode - 빈 포스트 필터링

**Files:**
- Modify: `packages/web/lib/hooks/useImages.ts:231-235`

- [ ] **Step 1: useImages.ts Supabase 쿼리에 or 필터 추가**

`packages/web/lib/hooks/useImages.ts`의 Supabase 직접 쿼리 경로(line ~231-235)에서 `.not("image_url", "is", null)` 다음에 필터를 추가한다:

```typescript
// 기존 코드 (line 231-235):
let query = supabaseBrowserClient
  .from("posts")
  .select("*", { count: "exact" })
  .eq("status", "active")
  .not("image_url", "is", null);

// 변경 후:
let query = supabaseBrowserClient
  .from("posts")
  .select("*", { count: "exact" })
  .eq("status", "active")
  .not("image_url", "is", null)
  .or("post_magazine_id.not.is.null,created_with_solutions.eq.true");
```

이 `.or()` 필터는 다음 조건 중 하나 이상 충족하는 포스트만 반환한다:
- `post_magazine_id`가 존재함 (매거진/에디토리얼 연결됨)
- `created_with_solutions`가 true (솔루션이 등록됨)

- [ ] **Step 2: 로컬에서 browse 모드 동작 확인**

Run: `http://localhost:3000/explore` 접속하여 확인

Expected:
- 기존 대비 약 42개 포스트가 줄어듦 (약 7% 감소)
- 매거진 또는 솔루션이 있는 포스트만 표시
- 무한 스크롤, 정렬, 필터 기능 정상 동작
- 빈 상태(empty state) 표시되지 않음 (561개 포스트 존재)

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/hooks/useImages.ts
git commit -m "feat(explore): hide posts without solutions or magazine in browse mode"
```

---

### Task 2: Search Mode - 빈 포스트 필터링

**Files:**
- Modify: `packages/web/lib/hooks/useExploreData.ts:76-83`

- [ ] **Step 1: useExploreData.ts 검색 결과 필터링 추가**

`packages/web/lib/hooks/useExploreData.ts`의 `items` useMemo 블록(line 76-83)에서 검색 결과를 필터링한다. 검색 API 응답의 `SearchResultItem`에는 `spot_count` 필드가 있으므로 이를 활용한다:

```typescript
// 기존 코드 (line 76-83):
const items: PostGridItem[] = useMemo(() => {
  if (isSearchMode) {
    return (searchResult.data?.data ?? []).map(mapSearchResultToGridItem);
  }
  return browseResult.data
    ? browseResult.data.pages.flatMap((page) => page.items)
    : [];
}, [isSearchMode, searchResult.data, browseResult.data]);

// 변경 후:
const items: PostGridItem[] = useMemo(() => {
  if (isSearchMode) {
    return (searchResult.data?.data ?? [])
      .filter((item) => (item.spot_count ?? 0) > 0)
      .map(mapSearchResultToGridItem);
  }
  return browseResult.data
    ? browseResult.data.pages.flatMap((page) => page.items)
    : [];
}, [isSearchMode, searchResult.data, browseResult.data]);
```

검색 모드에서는 DB 컬럼(`created_with_solutions`, `post_magazine_id`)에 접근할 수 없으므로 `spot_count > 0`을 프록시로 사용한다. spot이 하나라도 있는 포스트는 아이템이 감지된 것이므로 콘텐츠 가치가 있다.

- [ ] **Step 2: 로컬에서 search 모드 동작 확인**

Run: `http://localhost:3000/explore`에서 검색어 입력하여 확인

Expected:
- 검색 결과에서 `spot_count=0`인 포스트가 제외됨
- 검색 결과가 0건일 때 "No posts found" empty state 정상 표시
- 검색어 변경 시 필터 정상 적용

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/hooks/useExploreData.ts
git commit -m "feat(explore): filter search results to hide posts without spots"
```

---

## Orval/Zod Pipeline 참고

현재 구현은 Orval 재생성이 불필요하다:
- Supabase 직접 쿼리 경로: DB 컬럼 직접 필터링 (Orval 무관)
- REST API 경로 (`has_magazine=true`): 이미 매거진 포스트만 반환 (변경 없음)
- 검색 API: 기존 `SearchResultItem.spot_count` 타입 활용 (Orval 생성 타입 그대로 사용)

### 향후 확장 (백엔드 `has_solutions` 파라미터)

explore를 REST API 기반으로 완전 전환하려면:

1. Rust 백엔드 `GET /api/v1/posts`에 `has_solutions` 쿼리 파라미터 추가
2. `packages/api-server/openapi.json` 업데이트
3. `cd packages/web && bun run generate:api` 실행 → `ListPostsParams`에 `has_solutions` 자동 추가, Zod 스키마도 자동 업데이트
4. `useInfinitePosts`의 Supabase 직접 쿼리 경로를 REST API 호출로 교체
5. `listPosts({ has_solutions: true, ...otherParams })` 형태로 호출

이 확장은 Supabase 직접 쿼리 의존을 줄이고 API 계층에서 일관된 필터링을 제공하지만, 현재 요구사항에는 과한 접근이다.
