# Phase 49: Tries Tab Frontend - Research

**Researched:** 2026-03-26
**Domain:** React / TanStack Query infinite scroll, Orval-generated hooks, IntersectionObserver
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `TryResult` 인터페이스 삭제 → Orval 생성 `TryItem` 타입 import
- `result_image_url` → `image_url` (Phase 48에서 백엔드 스키마에 맞춤)
- `item_count` 필드 제거 (백엔드 TryItem에 없음)
- `source_post_id` 제거 (백엔드 TryItem에 없음)
- `fetchMyTries` 스텁 함수 완전 삭제
- `useGetMyTries` (Orval 생성) 기반 useInfiniteQuery 패턴 적용
- page/per_page 쿼리 파라미터 사용, per_page=20 기본
- 로딩: 기존 스켈레톤 그리드 유지 (4개 플레이스홀더)
- 빈 상태: 기존 UI 유지 (Sparkles 아이콘 + "No try-on results yet")
- 에러: 간단한 에러 메시지 ("Failed to load tries" + retry 버튼)
- 무한스크롤: IntersectionObserver 기반 자동 로드

### Claude's Discretion
- IntersectionObserver vs react-intersection-observer 라이브러리
- 카드 UI 레이아웃 미세 조정 (item_count 제거 후 오버레이 구성)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRIES-03 | `TriesGrid.tsx` 타입 수정 (`result_image_url` → `image_url`, `item_count` 제거) | TryItem 타입은 `{ id: string; image_url: string; created_at: string }` — 확인 완료 |
| TRIES-04 | 무한스크롤 연결 (useInfiniteQuery 패턴) | `useUserActivities` 참조 패턴 확인 완료; `getMyActivities` raw function 기반 구성 |
| TRIES-05 | 스텁 코드(`fetchMyTries → []`) 완전 제거 | 현재 스텁 코드 위치 및 범위 확인 완료 |
</phase_requirements>

---

## Summary

Phase 49는 단일 파일(`TriesGrid.tsx`) 리라이트 작업이다. 현재 스텁 구현(`useQuery` + `fetchMyTries → []`)을 `useInfiniteQuery` + `getMyTries` raw function 기반으로 교체하고, `TryResult` 인터페이스를 Orval 생성 `TryItem`으로 완전 대체한다.

기존 `useUserActivities` 패턴(useProfile.ts)이 완벽한 참조 구현이다. Orval 생성 hook(`useGetMyTries`)은 일반 `useQuery`이므로, 무한스크롤을 위해 raw function인 `getMyTries`를 직접 `useInfiniteQuery`의 `queryFn`에 래핑해야 한다 — `useUserActivities`가 `getMyActivities`를 쓰는 방식과 동일하다.

IntersectionObserver는 네이티브 API를 직접 `useRef` + `useEffect`로 구현하거나, `react-intersection-observer` 라이브러리를 사용할 수 있다. 이 프로젝트에 이미 설치된 패키지인지 확인이 필요하며, 없다면 네이티브 구현이 의존성 추가 없이 간결하다.

**Primary recommendation:** `getMyTries` raw function을 `useInfiniteQuery`에 래핑, `useUserActivities`의 패턴을 그대로 복제한다. IntersectionObserver는 네이티브 구현을 권장 (패키지 없음).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.x | useInfiniteQuery, infinite scroll data fetching | 프로젝트 표준; useUserActivities 패턴 기확립 |
| Orval generated | — | `getMyTries`, `TryItem`, `GetMyTriesParams`, `GetMyTries200` | Phase 48에서 생성 완료 |
| Next.js Image | built-in | 이미지 최적화 | 기존 TriesGrid에서 이미 사용 중 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-intersection-observer | optional | IntersectionObserver 훅 wrapper | 이미 설치된 경우에만; 없으면 네이티브 |

**Installation:**
```bash
# 추가 패키지 설치 불필요 — 이미 있는 의존성만 사용
# react-intersection-observer가 이미 설치된 경우 활용 가능
```

---

## Architecture Patterns

### Existing Reference Implementation: `useUserActivities`

```typescript
// Source: packages/web/lib/hooks/useProfile.ts
export function useUserActivities(params?: UseUserActivitiesParams) {
  return useInfiniteQuery({
    queryKey: profileKeys.activities(params),
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      return getMyActivities({
        type: params?.type as any,
        page,
        per_page: params?.perPage ?? 20,
      });
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.pagination?.current_page < lastPage.pagination?.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
    enabled: params?.enabled !== false,
  });
}
```

**핵심:** Orval 생성 hook(`useGetMyActivities`)은 일반 useQuery여서 사용하지 않고, raw function(`getMyActivities`)을 직접 `useInfiniteQuery`에 래핑한다. `getMyTries`에도 동일하게 적용.

### Pattern 1: Infinite Query with Raw Orval Function

```typescript
// TriesGrid에 적용할 패턴
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyTries } from "@/lib/api/generated/users/users";
import type { TryItem } from "@/lib/api/generated/models";

const PER_PAGE = 20;

function useMyTriesInfinite() {
  return useInfiniteQuery({
    queryKey: ["/api/v1/users/me/tries"],
    queryFn: async ({ pageParam }) => {
      return getMyTries({ page: pageParam as number, per_page: PER_PAGE });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });
}
```

### Pattern 2: Native IntersectionObserver Sentinel

```typescript
// Source: MDN IntersectionObserver pattern
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = sentinelRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// JSX
<div ref={sentinelRef} className="h-1" />
```

### TryItem Type Shape (Verified)

```typescript
// Source: packages/web/lib/api/generated/models/tryItem.ts
export interface TryItem {
  id: string;
  image_url: string;    // ← NOT result_image_url
  created_at: string;
  // item_count: NONE
  // source_post_id: NONE
}
```

### GetMyTries Response Shape (Verified)

```typescript
// Source: packages/web/lib/api/generated/models/getMyTries200.ts
export type GetMyTries200 = {
  data: TryItem[];
  pagination: PaginationMeta;
};

// Source: packages/web/lib/api/generated/models/paginationMeta.ts
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}
```

### Flattening Infinite Pages to Items

```typescript
// TanStack Query v5 패턴
const tries = data?.pages.flatMap((page) => page.data) ?? [];
```

### Card Overlay Layout (item_count 제거 후)

기존 오버레이는 `item_count`와 `created_at`을 나란히 표시했다. `item_count` 제거 후 오버레이를 `created_at`만 표시하거나 완전히 제거하는 방향이 있다. `created_at` 날짜 표시는 간결하게 우측 정렬로 유지하는 것이 자연스럽다.

```tsx
// 단순화된 오버레이 (item_count 제거 후)
<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
  <span className="text-[10px] text-white/50">
    {new Date(t.created_at).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    })}
  </span>
</div>
```

### Anti-Patterns to Avoid
- **`useGetMyTries` hook을 직접 useInfiniteQuery 대신 사용:** Orval 생성 hook은 일반 useQuery — 무한스크롤 불가. 반드시 raw function(`getMyTries`) 래핑.
- **`TryResult` 인터페이스 유지:** 삭제 대상. Orval `TryItem` import로 교체.
- **`fetchMyTries` 유지:** 삭제 대상. useQuery 패턴 전체 교체.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 페이지네이션 next page 계산 | 직접 offset 계산 | `getNextPageParam` + `PaginationMeta` | 이미 백엔드가 `current_page`, `total_pages` 반환 |
| 데이터 중복 제거 | 커스텀 dedup 로직 | TanStack Query 캐시 | 동일 queryKey로 자동 관리 |
| 로딩 상태 관리 | 별도 loading state | `isLoading`, `isFetchingNextPage` from useInfiniteQuery | 이미 충분히 세분화된 상태 제공 |

---

## Common Pitfalls

### Pitfall 1: `useGetMyTries` (Orval hook) vs `getMyTries` (raw function) 혼동
**What goes wrong:** `useGetMyTries`는 `useQuery`를 내부적으로 사용하여 infinite pagination 불가. 컴파일은 되지만 다음 페이지 로드가 안 됨.
**Why it happens:** Orval은 일반 useQuery 기반 hook만 생성. Infinite query는 raw function을 직접 wrapping해야 함.
**How to avoid:** `useInfiniteQuery`에 raw `getMyTries` function을 `queryFn`으로 전달.
**Warning signs:** `fetchNextPage` 호출 후 데이터가 추가되지 않음.

### Pitfall 2: pages.flatMap 누락으로 인한 타입 오류
**What goes wrong:** `data.data`처럼 단일 페이지 접근 시 TypeScript 오류 또는 런타임 에러.
**Why it happens:** `useInfiniteQuery`의 `data`는 `{ pages: GetMyTries200[] }` 구조.
**How to avoid:** `data?.pages.flatMap((page) => page.data) ?? []` 패턴 사용.

### Pitfall 3: IntersectionObserver effect 의존성 배열 불완전
**What goes wrong:** `hasNextPage`/`isFetchingNextPage` 변경 시 observer가 stale closure 참조.
**Why it happens:** `useEffect` 의존성에 이 값들을 누락하면 오래된 값으로 체크.
**How to avoid:** effect deps에 `[hasNextPage, isFetchingNextPage, fetchNextPage]` 모두 포함. Observer 재등록 비용은 미미함.

### Pitfall 4: `image_url` 필드명 오타
**What goes wrong:** 기존 코드의 `result_image_url`을 그대로 남기면 TypeScript 오류 (`Property 'result_image_url' does not exist on type 'TryItem'`).
**Why it happens:** 타입 마이그레이션 누락.
**How to avoid:** `TryResult` 인터페이스 삭제와 동시에 모든 필드 참조를 `TryItem` 기준으로 변경. TypeScript 에러가 컴파일 타임에 잡아줌.

---

## Code Examples

### 최종 TriesGrid 구조 (전체 패턴)

```typescript
// Source: useUserActivities pattern (packages/web/lib/hooks/useProfile.ts) 참조
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getMyTries } from "@/lib/api/generated/users/users";
import type { TryItem } from "@/lib/api/generated/models";

const PER_PAGE = 20;

export interface TriesGridProps {
  className?: string;
}

export function TriesGrid({ className }: TriesGridProps) {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/v1/users/me/tries"],
    queryFn: async ({ pageParam }) =>
      getMyTries({ page: pageParam as number, per_page: PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tries = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) { /* 기존 스켈레톤 그리드 4개 */ }
  if (isError) { /* "Failed to load tries" + retry 버튼 */ }
  if (tries.length === 0) { /* 기존 빈 상태 UI */ }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
      {tries.map((t: TryItem) => (
        <button key={t.id} /* ... */>
          {/* image_url 사용, item_count 없음 */}
          <Image src={t.image_url} alt="Try-on result" fill /* ... */ />
          {/* 오버레이: created_at만 */}
        </button>
      ))}
      <div ref={sentinelRef} className="col-span-full h-1" />
      {isFetchingNextPage && (
        <div className="col-span-full grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 스텁 `fetchMyTries → []` + `useQuery` | `getMyTries` + `useInfiniteQuery` | Phase 49 | 실제 데이터 표시 + 무한스크롤 |
| `TryResult` 로컬 인터페이스 | Orval 생성 `TryItem` | Phase 49 | 타입 단일 진실 소스, spec drift 방지 |

---

## Open Questions

1. **react-intersection-observer 설치 여부**
   - What we know: CONTEXT.md에서 "Claude's Discretion" 항목
   - What's unclear: 패키지가 이미 설치되어 있는지 확인 필요
   - Recommendation: 플래너가 `packages/web/package.json` 확인 단계를 Wave 0에 포함. 설치 안 된 경우 네이티브 구현 사용.

---

## Sources

### Primary (HIGH confidence)
- `packages/web/lib/api/generated/models/tryItem.ts` — TryItem 타입 구조 직접 확인
- `packages/web/lib/api/generated/models/getMyTries200.ts` — 응답 타입 직접 확인
- `packages/web/lib/api/generated/models/getMyTriesParams.ts` — 쿼리 파라미터 확인
- `packages/web/lib/api/generated/models/paginationMeta.ts` — pagination 구조 확인
- `packages/web/lib/api/generated/users/users.ts` — `getMyTries` raw function 시그니처 확인
- `packages/web/lib/components/profile/TriesGrid.tsx` — 현재 스텁 구현 전체 확인
- `packages/web/lib/hooks/useProfile.ts` — `useUserActivities` 참조 패턴 확인

### Secondary (MEDIUM confidence)
- TanStack Query v5 공식 문서: `useInfiniteQuery` API, `getNextPageParam`, `initialPageParam`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 코드베이스에서 직접 확인
- Architecture: HIGH — 참조 구현(`useUserActivities`) 완전히 확인
- Pitfalls: HIGH — 기존 코드와 타입 구조에서 도출

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (안정적 도메인)
