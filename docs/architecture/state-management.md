# State Management

> Version: 1.0.0
> Last Updated: 2026-01-14
> Purpose: Zustand + React Query 상태 관리 패턴 문서화

---

## Overview

Decoded 앱은 두 가지 상태 관리 도구를 사용합니다:
- **Zustand**: 클라이언트 전역 상태 (필터, 검색, UI 상태)
- **React Query**: 서버 상태 (데이터 페칭, 캐싱, 동기화)

---

## 1. State Architecture

### 1.1 State Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            STATE ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          COMPONENT LAYER                                 │   │
│   │                                                                          │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │   │
│   │   │   Local     │  │   Local     │  │   Local     │                    │   │
│   │   │   State     │  │   State     │  │   State     │                    │   │
│   │   │             │  │             │  │             │                    │   │
│   │   │ • useState  │  │ • useRef    │  │ • useReducer│                    │   │
│   │   │ • UI toggle │  │ • DOM refs  │  │ • Complex   │                    │   │
│   │   │ • Form data │  │ • Timers    │  │   local     │                    │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                    │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       │ Props / Context                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         GLOBAL CLIENT STATE                              │   │
│   │                           (Zustand Stores)                               │   │
│   │                                                                          │   │
│   │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │   │
│   │   │  filterStore   │  │  searchStore   │  │transitionStore │           │   │
│   │   │                │  │                │  │                │           │   │
│   │   │ • activeFilter │  │ • query        │  │ • selectedId   │           │   │
│   │   │ • category     │  │ • debouncedQ   │  │ • originState  │           │   │
│   │   │ • mediaId      │  │                │  │ • rect         │           │   │
│   │   │ • castId       │  │                │  │                │           │   │
│   │   └────────────────┘  └────────────────┘  └────────────────┘           │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       │ Query Keys                               │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          SERVER STATE                                    │   │
│   │                         (React Query)                                    │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                        Query Cache                               │   │   │
│   │   │                                                                  │   │   │
│   │   │  ["images", "infinite", {...}] → ImagePage[]                    │   │   │
│   │   │  ["image", id]                 → ImageDetail                    │   │   │
│   │   │  ["related", account, id]      → ImageRow[]                     │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                     Mutation Cache                               │   │   │
│   │   │                                                                  │   │   │
│   │   │  (Future) vote, comment, upload mutations                       │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       │ Supabase Client                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        REMOTE DATA SOURCE                                │   │
│   │                          (Supabase)                                      │   │
│   │                                                                          │   │
│   │                       PostgreSQL Database                                │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Zustand Stores

### 2.1 filterStore

**File**: `lib/stores/filterStore.ts` / `shared/stores/filterStore.ts`

```typescript
// 현재 구현
interface FilterState {
  activeFilter: 'all' | 'newjeanscloset' | 'blackpinkk.style';
  setFilter: (filter: FilterType) => void;
}

const useFilterStore = create<FilterState>((set) => ({
  activeFilter: 'all',
  setFilter: (filter) => set({ activeFilter: filter }),
}));

// 사용 예시
function FilterTabs() {
  const { activeFilter, setFilter } = useFilterStore();

  return (
    <div>
      <button
        onClick={() => setFilter('all')}
        className={activeFilter === 'all' ? 'active' : ''}
      >
        All
      </button>
      {/* ... */}
    </div>
  );
}
```

**Future 확장 (D-02 계층형 필터)**:
```typescript
interface HierarchicalFilterState {
  // 현재 선택값
  category: CategoryType | null;
  mediaId: string | null;
  castId: string | null;
  contextType: ContextType | null;

  // Breadcrumb
  breadcrumb: FilterBreadcrumb[];

  // Actions
  setCategory: (cat: CategoryType | null) => void;
  setMedia: (id: string | null) => void;
  setCast: (id: string | null) => void;
  setContext: (ctx: ContextType | null) => void;
  clearAll: () => void;
  navigateToBreadcrumb: (level: number) => void;
}
```

### 2.2 searchStore

**File**: `lib/stores/searchStore.ts` / `shared/stores/searchStore.ts`

```typescript
interface SearchState {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
}

const useSearchStore = create<SearchState>((set) => ({
  query: '',
  debouncedQuery: '',
  setQuery: (query) => set({ query }),
  setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),
}));

// SearchInput 컴포넌트에서 사용
function SearchInput() {
  const { query, setQuery, setDebouncedQuery } = useSearchStore();

  // 250ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

### 2.3 transitionStore

**File**: `lib/stores/transitionStore.ts`

```typescript
interface TransitionState {
  selectedId: string | null;
  originState: Flip.FlipState | null;
  rect: DOMRect | null;

  setSelectedId: (id: string | null) => void;
  setOriginState: (state: Flip.FlipState | null) => void;
  setRect: (rect: DOMRect | null) => void;
  clear: () => void;
}

const useTransitionStore = create<TransitionState>((set) => ({
  selectedId: null,
  originState: null,
  rect: null,

  setSelectedId: (id) => set({ selectedId: id }),
  setOriginState: (state) => set({ originState: state }),
  setRect: (rect) => set({ rect }),
  clear: () => set({ selectedId: null, originState: null, rect: null }),
}));

// CardCell에서 클릭 시 상태 저장
function CardCell({ image }) {
  const { setSelectedId, setOriginState } = useTransitionStore();

  const handleClick = (e) => {
    const element = e.currentTarget;
    const state = Flip.getState(element);
    setSelectedId(image.id);
    setOriginState(state);
  };

  return <div onClick={handleClick}>...</div>;
}

// Detail Modal에서 애니메이션 실행
function ImageDetailModal() {
  const { originState, clear } = useTransitionStore();

  useEffect(() => {
    if (originState) {
      Flip.from(originState, {
        duration: 0.5,
        ease: 'power2.inOut',
      });
    }
    return () => clear();
  }, []);
}
```

---

## 3. React Query Patterns

### 3.1 Query Client Configuration

**File**: `lib/react-query/client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 1분
      gcTime: 5 * 60 * 1000,          // 5분
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 3.2 Query Hooks

**File**: `lib/hooks/useImages.ts`

```typescript
// 무한 스크롤 이미지 조회
export function useInfiniteFilteredImages(options: {
  filter: FilterType;
  search: string;
  limit?: number;
  initialData?: ImagePage;
}) {
  return useInfiniteQuery({
    queryKey: ['images', 'infinite', {
      filter: options.filter,
      search: options.search,
      limit: options.limit
    }],
    queryFn: ({ pageParam }) => fetchUnifiedImages({
      filter: options.filter,
      search: options.search,
      limit: options.limit ?? 50,
      cursor: pageParam,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialData: options.initialData
      ? { pages: [options.initialData], pageParams: [null] }
      : undefined,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData, // 필터 변경 시 이전 데이터 유지
  });
}

// 단일 이미지 조회
export function useImageById(id: string) {
  return useQuery({
    queryKey: ['image', id],
    queryFn: () => fetchImageById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// 관련 이미지 조회
export function useRelatedImagesByAccount(
  account: string,
  excludeId: string
) {
  return useQuery({
    queryKey: ['related', account, excludeId],
    queryFn: () => fetchRelatedImagesByAccount(account, excludeId),
    enabled: !!account && !!excludeId,
    staleTime: 60 * 1000,
  });
}
```

### 3.3 Query Key Factory Pattern

```typescript
// lib/react-query/keys.ts

export const imageKeys = {
  all: ['images'] as const,
  lists: () => [...imageKeys.all, 'list'] as const,
  list: (filters: ImageFilters) => [...imageKeys.lists(), filters] as const,
  infinite: (filters: ImageFilters) => [...imageKeys.all, 'infinite', filters] as const,
  details: () => [...imageKeys.all, 'detail'] as const,
  detail: (id: string) => [...imageKeys.details(), id] as const,
};

export const relatedKeys = {
  all: ['related'] as const,
  byAccount: (account: string, excludeId: string) =>
    [...relatedKeys.all, account, excludeId] as const,
};

// 사용
useInfiniteQuery({
  queryKey: imageKeys.infinite({ filter, search, limit }),
  // ...
});
```

---

## 4. Store ↔ Query Integration

### 4.1 State Sync Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STORE ↔ QUERY SYNC FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   User Action                                                                   │
│   (Filter Click)                                                                │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ FilterTabs.tsx                                                          │    │
│   │                                                                         │    │
│   │ onClick={() => setFilter('blackpinkk.style')}                          │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ filterStore (Zustand)                                                   │    │
│   │                                                                         │    │
│   │ state.activeFilter = 'blackpinkk.style'                                │    │
│   │                                                                         │    │
│   │ → All subscribers notified                                              │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ HomeClient.tsx (subscriber)                                             │    │
│   │                                                                         │    │
│   │ const filter = useFilterStore(s => s.activeFilter);                    │    │
│   │ // filter 값이 변경됨 → 컴포넌트 re-render                             │    │
│   │                                                                         │    │
│   │ const { data } = useInfiniteFilteredImages({ filter, search });        │    │
│   │ // queryKey가 변경됨                                                    │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ React Query                                                             │    │
│   │                                                                         │    │
│   │ queryKey: ["images", "infinite", { filter: "blackpinkk.style", ... }]  │    │
│   │                                                                         │    │
│   │ Cache lookup:                                                           │    │
│   │ • Cache miss → fetchUnifiedImages() 호출                               │    │
│   │ • Cache hit + fresh → 캐시 데이터 반환                                 │    │
│   │ • Cache hit + stale → 캐시 반환 + background refetch                   │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │ ThiingsGrid re-render                                                   │    │
│   │                                                                         │    │
│   │ 새로운 데이터로 그리드 업데이트                                         │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Usage Pattern

```typescript
// HomeClient.tsx

function HomeClient({ initialData }: { initialData: ImagePage }) {
  // 1. Zustand stores에서 필터/검색 상태 구독
  const filter = useFilterStore((state) => state.activeFilter);
  const search = useSearchStore((state) => state.debouncedQuery);

  // 2. React Query로 데이터 페칭 (store 값이 queryKey에 포함)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteFilteredImages({
    filter,
    search,
    limit: 50,
    initialData,
  });

  // 3. 데이터 가공
  const images = useMemo(() =>
    data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );

  // 4. 렌더링
  return (
    <ThiingsGrid
      images={images}
      onLoadMore={fetchNextPage}
      hasMore={hasNextPage}
      isLoading={isFetchingNextPage}
    />
  );
}
```

---

## 5. State Persistence

### 5.1 Current Persistence

| Store | Persistence | Location |
|-------|------------|----------|
| filterStore | URL params | `?filter=xxx` |
| searchStore | URL params | `?q=xxx` |
| transitionStore | Memory only | - |
| React Query | Memory (gcTime) | 5분 캐시 |

### 5.2 Future Persistence (사용자 설정)

```typescript
// 로그인 사용자 설정 저장 예시
const useUserPreferences = create(
  persist(
    (set) => ({
      theme: 'system',
      language: 'ko',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 6. DevTools

### 6.1 React Query DevTools

**File**: `app/providers.tsx`

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 6.2 Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

const useFilterStore = create(
  devtools(
    (set) => ({
      activeFilter: 'all',
      setFilter: (filter) => set({ activeFilter: filter }),
    }),
    { name: 'filterStore' }
  )
);
```

---

## 7. Best Practices

### 7.1 When to Use What

| Use Case | Solution | Example |
|----------|----------|---------|
| UI 상태 (토글, 열림/닫힘) | Local useState | Modal open state |
| 전역 클라이언트 상태 | Zustand | Filter, Search |
| 서버 데이터 | React Query | Images, Items |
| 애니메이션 상태 | Zustand | FLIP transition state |
| 폼 상태 | Local useState + Zustand | Create post form |

### 7.2 Performance Tips

```typescript
// 1. Zustand selector로 필요한 값만 구독
// BAD: 전체 store 구독
const store = useFilterStore();

// GOOD: 필요한 값만 구독
const filter = useFilterStore((s) => s.activeFilter);

// 2. React Query select로 데이터 변환
const { data } = useInfiniteFilteredImages({...}, {
  select: (data) => data.pages.flatMap(p => p.items),
});

// 3. 불필요한 refetch 방지
{
  staleTime: 60 * 1000,
  refetchOnWindowFocus: false,
}

// 4. 낙관적 업데이트 (mutations)
useMutation({
  mutationFn: voteItem,
  onMutate: async (newVote) => {
    await queryClient.cancelQueries(['item', newVote.itemId]);
    const previous = queryClient.getQueryData(['item', newVote.itemId]);
    queryClient.setQueryData(['item', newVote.itemId], (old) => ({
      ...old,
      votes: old.votes + 1,
    }));
    return { previous };
  },
  onError: (err, newVote, context) => {
    queryClient.setQueryData(['item', newVote.itemId], context.previous);
  },
});
```

---

## Related Documents

- [README.md](./README.md) - 시스템 아키텍처
- [data-pipeline.md](./data-pipeline.md) - 데이터 파이프라인
- [../../specs/feature-spec/workflows.md](../../specs/feature-spec/workflows.md) - 워크플로우
