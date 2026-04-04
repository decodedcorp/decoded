# Explore Search Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explore 검색 경험 개선 — 자동완성 드롭다운, facet 뱃지 정렬/제한, 검색 결과 하이라이트, /search 페이지 제거.

**Architecture:** `ExploreClient`의 검색 바에 기존 `SearchSuggestions` 컴포넌트를 연결하여 자동완성 제공. `PostGridItem`에 `highlight` 필드를 추가하고 `ExploreCardCell`에 아티스트명 오버레이 표시. `/search` 라우트는 `/explore?q=`로 redirect. `ExploreClient` mount 시 URL의 `q` param으로 초기 검색어 설정.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / TanStack Query 5 / Zustand / Meilisearch API (Orval)

**Spec:** [`docs/superpowers/specs/2026-04-03-explore-search-enhancement-design.md`](../specs/2026-04-03-explore-search-enhancement-design.md)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/web/app/search/page.tsx` | Modify | redirect to `/explore?q=` |
| `packages/web/app/search/SearchPageClient.tsx` | Delete | 기존 검색 페이지 클라이언트 |
| `packages/web/app/explore/ExploreClient.tsx` | Modify | 자동완성 연결, URL q param 동기화, facet 뱃지 개선 |
| `packages/web/lib/hooks/useImages.ts` | Modify | `PostGridItem`에 highlight 필드 추가 |
| `packages/web/lib/hooks/useExploreData.ts` | Modify | highlight 매핑 추가 |
| `packages/web/lib/components/explore/ExploreCardCell.tsx` | Modify | 아티스트명 오버레이 + 하이라이트 표시 |

---

## Task 1: `/search` 페이지를 `/explore?q=`로 redirect

**Files:**
- Modify: `packages/web/app/search/page.tsx`
- Delete: `packages/web/app/search/SearchPageClient.tsx`

- [ ] **Step 1: `page.tsx`를 redirect로 교체**

```typescript
// packages/web/app/search/page.tsx
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const target = q ? `/explore?q=${encodeURIComponent(q)}` : "/explore";
  redirect(target);
}
```

- [ ] **Step 2: `SearchPageClient.tsx` 삭제**

```bash
rm packages/web/app/search/SearchPageClient.tsx
```

- [ ] **Step 3: search 디렉토리에 다른 파일이 있는지 확인**

```bash
ls packages/web/app/search/
```

Expected: `page.tsx`만 남아있음. `layout.tsx`가 있으면 함께 삭제.

- [ ] **Step 4: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/search/
git commit -m "refactor(search): redirect /search to /explore?q= (#61)"
```

---

## Task 2: ExploreClient에 URL `q` param 동기화 + 자동완성

**Files:**
- Modify: `packages/web/app/explore/ExploreClient.tsx`

기존 `SearchSuggestions` 컴포넌트를 재사용한다. 이 컴포넌트는 `query`, `selectedIndex`, `onSelect`, `onClose` props를 받는다.

- [ ] **Step 1: import 추가**

```typescript
// 기존 import에 추가
import { useSearchParams } from "next/navigation";
import { SearchSuggestions } from "@/lib/components/search/SearchSuggestions";
import { useRecentSearchesStore } from "@decoded/shared";
```

- [ ] **Step 2: URL q param → 검색 초기화**

컴포넌트 내부, 기존 `debouncedQuery` 선언 아래에 추가:

```typescript
const searchParams = useSearchParams();

// URL의 q param으로 초기 검색어 설정 (mount 시 1회)
useEffect(() => {
  const urlQuery = searchParams.get("q");
  if (urlQuery && !query) {
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // mount only
```

- [ ] **Step 3: 자동완성 상태 추가**

```typescript
const [showSuggestions, setShowSuggestions] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(-1);
const addRecentSearch = useRecentSearchesStore((s) => s.addSearch);
const containerRef = useRef<HTMLDivElement>(null);

// 검색어 변경 시 suggestions 표시
useEffect(() => {
  if (query.length > 0) {
    setShowSuggestions(true);
    setSelectedIndex(-1);
  } else {
    setShowSuggestions(false);
  }
}, [query]);

// 바깥 클릭 시 닫기
useEffect(() => {
  if (!showSuggestions) return;
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showSuggestions]);

const handleSuggestionSelect = useCallback(
  (selectedQuery: string) => {
    setQuery(selectedQuery);
    setDebouncedQuery(selectedQuery);
    setShowSuggestions(false);
    addRecentSearch(selectedQuery);
    inputRef.current?.blur();
  },
  [setQuery, setDebouncedQuery, addRecentSearch],
);

// 키보드 내비게이션
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => prev + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(-1, prev - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  },
  [showSuggestions],
);
```

- [ ] **Step 4: handleClear 수정**

기존 `handleClear`에 suggestions 닫기 추가:

```typescript
const handleClear = useCallback(() => {
  setQuery("");
  setDebouncedQuery("");
  setShowSuggestions(false);
  inputRef.current?.focus();
}, [setQuery, setDebouncedQuery]);
```

- [ ] **Step 5: 검색 바 JSX에 자동완성 연결**

검색 바 영역의 `<div className="relative px-4 pt-3 pb-1 shrink-0">` 를 수정:

```tsx
{/* Search input + suggestions */}
<div ref={containerRef} className="relative px-4 pt-3 pb-1 shrink-0">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    <input
      ref={inputRef}
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => query.length > 0 && setShowSuggestions(true)}
      onKeyDown={handleKeyDown}
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

  {/* Autocomplete suggestions dropdown */}
  {showSuggestions && (
    <div className="absolute left-4 right-4 top-full z-50 mt-1 rounded-xl border border-border bg-card shadow-lg">
      <SearchSuggestions
        query={query}
        selectedIndex={selectedIndex}
        onSelect={handleSuggestionSelect}
        onClose={() => setShowSuggestions(false)}
      />
    </div>
  )}
</div>
```

- [ ] **Step 6: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 7: Commit**

```bash
git add packages/web/app/explore/ExploreClient.tsx
git commit -m "feat(explore): add autocomplete suggestions and URL q param sync (#61)"
```

---

## Task 3: Facet 뱃지 개선 (정렬, 최대 개수, 최소 필터)

**Files:**
- Modify: `packages/web/app/explore/ExploreClient.tsx` (뱃지 렌더링 영역)

- [ ] **Step 1: 뱃지 헬퍼 함수 추가**

ExploreClient 파일 상단 (컴포넌트 밖)에 추가:

```typescript
const MAX_BADGES_PER_CATEGORY = 5;

/** Sort facets by count desc, limit to max, return overflow count */
function prepareFacetBadges(
  facetMap: Record<string, number>,
): { badges: [string, number][]; overflowCount: number } {
  const sorted = Object.entries(facetMap).sort(([, a], [, b]) => b - a);
  const badges = sorted.slice(0, MAX_BADGES_PER_CATEGORY);
  const overflowCount = Math.max(0, sorted.length - MAX_BADGES_PER_CATEGORY);
  return { badges, overflowCount };
}
```

- [ ] **Step 2: hasFacets 조건 개선 + 뱃지 렌더링 교체**

기존 뱃지 렌더링 영역을 교체:

```tsx
{/* Facet badges — shown in search mode when facets exist */}
{mode === "search" && (() => {
  const ctxFacets = prepareFacetBadges(facets.context);
  const mtFacets = prepareFacetBadges(facets.media_type);
  const hasAnyBadges = ctxFacets.badges.length > 1 || mtFacets.badges.length > 1;
  if (!hasAnyBadges) return null;
  return (
    <div className="px-4 py-2 shrink-0 flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide">
      {ctxFacets.badges.length > 1 &&
        ctxFacets.badges.map(([value, count]) => (
          <FilterChip
            key={`ctx-${value}`}
            label={value}
            count={count}
            active={activeSearchFilters.context === value}
            onClick={() => setSearchFilter("context", value)}
            onRemove={() => setSearchFilter("context", null)}
          />
        ))}
      {ctxFacets.overflowCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-[10px] text-muted-foreground">
          +{ctxFacets.overflowCount}
        </span>
      )}
      {mtFacets.badges.length > 1 &&
        mtFacets.badges.map(([value, count]) => (
          <FilterChip
            key={`mt-${value}`}
            label={value}
            count={count}
            active={activeSearchFilters.media_type === value}
            onClick={() => setSearchFilter("media_type", value)}
            onRemove={() => setSearchFilter("media_type", null)}
          />
        ))}
      {mtFacets.overflowCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-[10px] text-muted-foreground">
          +{mtFacets.overflowCount}
        </span>
      )}
    </div>
  );
})()}
```

핵심: `badges.length > 1` — 값이 1개뿐인 카테고리는 필터링 의미가 없으므로 숨김.

- [ ] **Step 3: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/explore/ExploreClient.tsx
git commit -m "feat(explore): improve facet badges with sorting, limits, and min-filter (#61)"
```

---

## Task 4: PostGridItem에 highlight 필드 추가 + 매핑

**Files:**
- Modify: `packages/web/lib/hooks/useImages.ts:134-145` (PostGridItem 타입)
- Modify: `packages/web/lib/hooks/useExploreData.ts` (mapSearchResultToGridItem)

- [ ] **Step 1: PostGridItem 타입에 highlight 추가**

```typescript
// packages/web/lib/hooks/useImages.ts:134-145
export type PostGridItem = {
  id: string;
  imageUrl: string;
  postId: string;
  postSource: "post";
  postAccount: string;
  postCreatedAt: string;
  spotCount: number;
  viewCount: number;
  /** 에디토리얼 그리드 오버레이용 (post.title 또는 post_magazine_title) */
  title?: string | null;
  /** Meilisearch highlight (검색 결과에서만 사용) */
  highlight?: Record<string, string> | null;
};
```

- [ ] **Step 2: mapSearchResultToGridItem에서 highlight 전달**

```typescript
// packages/web/lib/hooks/useExploreData.ts — mapSearchResultToGridItem 함수
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
    highlight: item.highlight ?? null,
  };
}
```

- [ ] **Step 3: GridItem 타입에 highlight 추가**

```typescript
// packages/web/lib/components/ThiingsGrid.tsx — GridItem 타입
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
  spotCount?: number;
  highlight?: Record<string, string> | null;
};
```

- [ ] **Step 4: ExploreClient gridItems 매핑에서 highlight 전달**

```typescript
// packages/web/app/explore/ExploreClient.tsx — gridItems useMemo 내부
.map((item) => ({
  id: item.id,
  imageUrl: item.imageUrl,
  postId: item.postId,
  postSource: item.postSource,
  postAccount: item.postAccount,
  postCreatedAt: item.postCreatedAt,
  ...(item.title != null && { editorialTitle: item.title }),
  ...(item.spotCount != null &&
    item.spotCount > 0 && { spotCount: item.spotCount }),
  ...(item.highlight && { highlight: item.highlight }),
}));
```

- [ ] **Step 5: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/hooks/useImages.ts packages/web/lib/hooks/useExploreData.ts packages/web/lib/components/ThiingsGrid.tsx packages/web/app/explore/ExploreClient.tsx
git commit -m "feat(explore): add highlight field to PostGridItem and GridItem (#61)"
```

---

## Task 5: ExploreCardCell에 아티스트명 오버레이 + 하이라이트

**Files:**
- Modify: `packages/web/lib/components/explore/ExploreCardCell.tsx`

- [ ] **Step 1: 하이라이트 텍스트 렌더링 헬퍼 추가**

파일 상단 (컴포넌트 밖)에 추가:

```tsx
/** Parse Meilisearch <em> highlight into React nodes */
function HighlightText({ html, fallback }: { html?: string; fallback: string }) {
  if (!html) return <>{fallback}</>;
  // Split on <em>...</em> tags and render <mark> instead
  const parts = html.split(/(<em>.*?<\/em>)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^<em>(.*)<\/em>$/);
        if (match) {
          return (
            <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5">
              {match[1]}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
```

- [ ] **Step 2: 아티스트명 오버레이 추가**

`ExploreCardCell` 컴포넌트 내부, `<PostImage />` 바로 다음에 추가:

```tsx
{/* Artist name overlay — search mode only (when highlight or postAccount exists) */}
{item?.highlight && item.postAccount && (
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
    <p className="text-[11px] font-medium text-white/90 truncate">
      <HighlightText
        html={item.highlight?.["artist_name"]}
        fallback={item.postAccount}
      />
    </p>
  </div>
)}
```

NOTE: 오버레이는 `item.highlight`가 있을 때만 표시 (= 검색 모드에서만). browse 모드에서는 기존 카드 그대로 유지.

- [ ] **Step 3: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/explore/ExploreCardCell.tsx
git commit -m "feat(explore): add artist name overlay with search highlight (#61)"
```

---

## Task 6: 통합 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | tail -5`
Expected: 에러 0개

- [ ] **Step 2: Lint**

Run: `cd packages/web && bunx eslint app/explore/ lib/hooks/useExploreData.ts lib/hooks/useImages.ts lib/components/explore/ExploreCardCell.tsx app/search/ --fix --max-warnings 20 2>&1 | tail -10`
Expected: fixable 에러만 자동 수정됨

- [ ] **Step 3: 빌드**

Run: `cd packages/web && bun run build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 4: 수동 검증 체크리스트**

- [ ] `/search?q=lisa` → `/explore?q=lisa` redirect 확인
- [ ] `/explore` 검색 바 입력 시 자동완성 드롭다운 표시
- [ ] 자동완성 항목 클릭 → 검색 실행 + 그리드 교체
- [ ] 키보드 ↑↓ Enter Escape 동작 확인
- [ ] Facet 뱃지: count순 정렬, 카테고리당 최대 5개
- [ ] 값이 1개뿐인 facet 카테고리는 뱃지 미표시
- [ ] 뱃지 토글 → 결과 필터링 → 재검색
- [ ] 카드에 아티스트명 오버레이 + highlight 표시 (검색 모드)
- [ ] browse 모드에서는 오버레이 없음
- [ ] 검색어 X 버튼 → browse 모드 복귀

- [ ] **Step 5: 최종 commit (필요시)**

```bash
git add -A
git commit -m "feat(explore): complete search enhancement — autocomplete, facets, highlight (#61)"
```
