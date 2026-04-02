# Phase 44: Memory Leak Prevention - Research

**Researched:** 2026-03-26
**Domain:** React memory management — GSAP animation cleanup, AbortController, useEffect patterns
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MEM-01 | GSAP contextSafe() 패턴을 47개 GSAP 사용 컴포넌트의 이벤트 핸들러 애니메이션에 적용 | `useGSAP` hook의 `contextSafe()` 반환값 활용 — 아래 Pattern 1 참조 |
| MEM-02 | 모든 비동기 fetch 요청에 AbortController 적용 (현재 0건) | `apiClient`, `adminFetch` 헬퍼에 signal 전파 — 아래 Pattern 2 참조 |
| MEM-03 | useEffect 클린업 패턴 정비 — setTimeout 워크어라운드 제거, addEventListener/removeEventListener 직접 사용 | 코드베이스 내 setTimeout 패턴 분류 및 교체 가이드 — 아래 Pattern 3 참조 |
| MEM-04 | Chrome DevTools Memory 프로파일링으로 주요 페이지 메모리 누수 검증 | Heap snapshot diff 방법론 — 아래 검증 섹션 참조 |
</phase_requirements>

---

## Summary

Phase 44의 목표는 세 가지 독립적인 메모리 누수 원인을 전면 수정하는 것이다.

**첫째**, GSAP 이벤트 핸들러 애니메이션 문제. 현재 코드베이스에서 `useGSAP`을 사용하는 31개 컴포넌트는 스크롤 트리거와 엔트리 애니메이션은 올바르게 `useGSAP`의 자동 클린업을 받는다. 그러나 `onMouseEnter/Leave`처럼 React 합성 이벤트 핸들러 내에서 호출되는 `gsap.to/timeline()` — 예: `TrendingListSection`, `MasonryGridItem`의 hover 애니메이션 — 은 GSAP 컨텍스트 외부에서 실행되어 컴포넌트 언마운트 시 자동 클린업되지 않는다. 이를 `contextSafe()` 패턴으로 래핑해야 한다.

**둘째**, fetch AbortController 문제. 현재 `apiClient`, `adminFetch`, `uploadImage` 등 모든 fetch 호출에 `signal` 파라미터가 없다. React Query의 `queryFn`은 `signal`을 자동으로 전달하지만 fetcher가 이를 전달하지 않으면 의미가 없다. useLogStream처럼 직접 fetch를 관리하는 커스텀 훅도 AbortController 없이 cleanup에만 의존한다.

**셋째**, useEffect 내 setTimeout 워크어라운드 문제. `ItemDetailCard`(line 95)의 `setTimeout(..., 0)`은 document.addEventListener 등록을 한 tick 지연하는 패턴이며, `useImageUpload`(line 84)의 `setTimeout(..., 100)`도 UI 업데이트를 기다리는 워크어라운드다. 이것들은 명시적 `clearTimeout` 클린업이 있어도 패턴상 불안정하며 `flushSync` 또는 직접 이벤트 등록으로 대체해야 한다.

**Primary recommendation:** `useGSAP`의 `contextSafe()` + React Query `signal` 전파 + 직접 addEventListener 패턴이라는 세 가지 표준 패턴을 일관 적용한다. 새로 코드를 작성하지 않고 기존 패턴을 정규화한다.

---

## Current State (코드베이스 분석)

### GSAP 사용 현황

| 패턴 | 파일 수 | 상태 |
|------|---------|------|
| `useGSAP` hook (자동 클린업) | 31개 | 올바름 — 스크롤 애니메이션 |
| `gsap.context()` + `ctx.revert()` in useEffect | 14개 | 올바름 — 수동 클린업 |
| React 이벤트 핸들러 내 직접 `gsap.to/timeline()` | ~12개 | **문제** — contextSafe 필요 |
| `import gsap` only (useGSAP 없음) | 43개 | 일부 문제 |

### 문제 파일 예시

```
TrendingListSection.tsx   — handleMouseEnter/Leave에서 gsap.timeline() 직접 호출
MasonryGridItem.tsx       — isHovered state 변화로 useEffect에서 gsap.fromTo() 호출 (ctx 없음)
ImageDetailModal.tsx      — handleTouchMove에서 gsap.set() 직접 호출 (ctxRef 있지만 미사용)
```

### fetch AbortController 현황

| 파일 | 패턴 | AbortController |
|------|------|----------------|
| `lib/api/client.ts` | apiClient 헬퍼 | 없음 |
| `lib/api/posts.ts` | uploadImage, fetch 직접 | 없음 |
| `lib/hooks/admin/*.ts` | adminFetch + React Query | signal 전달 안됨 |
| `lib/hooks/admin/useServerLogs.ts` | useLogStream (interval) | 없음 |
| 대부분 클라이언트 컴포넌트 | React Query 훅 사용 | React Query가 signal 생성하지만 fetcher가 무시 |

### setTimeout in useEffect 현황 (정비 대상)

| 파일 | 용도 | 권장 대체 |
|------|------|----------|
| `ItemDetailCard.tsx:95` | click 이벤트 등록 1-tick 지연 | 직접 등록 (지연 불필요) |
| `useImageUpload.ts:84` | startDetection UI 업데이트 대기 | `flushSync` 또는 React Query invalidation |
| `TrendingListSection.tsx:80` | GSAP 초기화 50ms 지연 | requestAnimationFrame |
| `ImageDetailModal.tsx:129` | 50ms 전환 지연 | GSAP onComplete callback |
| `AISummarySection.tsx:14` | 300ms reveal 지연 | CSS transition 또는 GSAP delay |
| `VtonModal.tsx:344` | debounce | useDebounce hook |
| `StudioLoader.tsx:21` | 300ms 언마운트 지연 | GSAP onComplete 또는 AnimatePresence |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@gsap/react` | 2.1.2 | `useGSAP` hook, contextSafe | 공식 React 통합, 자동 클린업 |
| `gsap` | 3.13.0 | 애니메이션 엔진 | 이미 사용 중 |
| `AbortController` | Web API | fetch 취소 | 브라우저 표준, polyfill 불필요 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.90.11 | 이미 signal 생성 | fetcher에 signal 전달만 하면 됨 |

**Installation:** 추가 설치 불필요 — 기존 라이브러리만 올바르게 사용

---

## Architecture Patterns

### Pattern 1: contextSafe() — 이벤트 핸들러 내 GSAP

`useGSAP`은 `contextSafe` 함수를 반환한다. 이 함수로 래핑된 콜백은 컴포넌트가 언마운트되어도 안전하게 실행되고, GSAP 컨텍스트가 자동으로 클린업된다.

**문제 패턴:**
```typescript
// MasonryGridItem.tsx — useEffect 안에 ctx 없이 gsap.fromTo 호출
useEffect(() => {
  if (isHovered) {
    gsap.fromTo(markers, { opacity: 0 }, { opacity: 1 }); // 누수!
  }
}, [isHovered]);
```

**올바른 패턴:**
```typescript
// useGSAP의 contextSafe 활용
const { contextSafe } = useGSAP({ scope: cardRef });

// contextSafe로 래핑된 핸들러는 컴포넌트 언마운트 시 자동 정리됨
const handleMouseEnter = contextSafe((ev: React.MouseEvent) => {
  gsap.timeline()
    .to(marqueeRef.current, { y: "0%" })
    .to(marqueeInnerRef.current, { y: "0%" });
});

const handleMouseLeave = contextSafe((ev: React.MouseEvent) => {
  gsap.timeline()
    .to(marqueeRef.current, { y: "-101%" })
    .to(marqueeInnerRef.current, { y: "-101%" });
});
```

**isHovered state로 useEffect에서 gsap 호출하는 경우:**
```typescript
// isHovered를 직접 state로 쓰는 대신 contextSafe 핸들러 사용
const { contextSafe } = useGSAP({ scope: cardRef });

const handleMouseEnter = contextSafe(() => {
  const markers = spotsRef.current?.querySelectorAll(".spot-marker");
  if (!markers?.length) return;
  gsap.fromTo(markers, { opacity: 0, scale: 0 }, {
    opacity: 1, scale: 1, duration: 0.3, stagger: 0.05, ease: "back.out(2)"
  });
});

const handleMouseLeave = contextSafe(() => {
  const markers = spotsRef.current?.querySelectorAll(".spot-marker");
  if (!markers?.length) return;
  gsap.to(markers, { opacity: 0, scale: 0, duration: 0.2 });
});
```

**handleTouchMove처럼 기존 ctxRef를 가진 컴포넌트:**
```typescript
// ImageDetailModal.tsx — ctxRef.current.add()로 컨텍스트 안에서 실행
const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!ctxRef.current || touchStartY.current === -1) return;
  const diff = e.touches[0].clientY - touchStartY.current;
  if (diff > 0 && drawerRef.current) {
    ctxRef.current.add(() => {
      gsap.set(drawerRef.current, { y: diff });
    });
  }
}, []);
```

### Pattern 2: AbortController — React Query + raw fetch

**apiClient 헬퍼에 signal 추가:**
```typescript
// lib/api/client.ts
export interface ApiClientOptions {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal; // 추가
}

export async function apiClient<T>(options: ApiClientOptions): Promise<T> {
  const { signal, ...rest } = options;
  // ...
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal, // 전달
  });
  // ...
}
```

**React Query queryFn에서 signal 전달:**
```typescript
// React Query가 자동으로 signal을 queryFn의 첫 번째 인자로 전달
queryFn: ({ signal }) =>
  adminFetch<KPIStats>("/api/v1/admin/dashboard/stats", { signal }),
```

**adminFetch 헬퍼에 signal 지원 추가:**
```typescript
async function adminFetch<T>(url: string, options?: { signal?: AbortSignal }): Promise<T> {
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json() as Promise<T>;
}
```

**useLogStream처럼 커스텀 폴링 훅:**
```typescript
// AbortController를 intervalRef와 함께 관리
const abortRef = useRef<AbortController | null>(null);

const poll = useCallback(async () => {
  abortRef.current?.abort();
  abortRef.current = new AbortController();
  try {
    const data = await adminFetch<StreamResponse>(url, {
      signal: abortRef.current.signal
    });
    // ...
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return; // 정상 취소
    // 에러 처리
  }
}, []);

// cleanup
useEffect(() => {
  return () => {
    abortRef.current?.abort();
    stopInterval();
  };
}, []);
```

### Pattern 3: useEffect 클린업 — setTimeout 워크어라운드 제거

**ItemDetailCard.tsx — setTimeout(0) 이벤트 등록 워크어라운드 제거:**
```typescript
// Before: setTimeout 0으로 지연 등록
useEffect(() => {
  if (!adoptTargetId) return;
  const tid = setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 0);
  return () => {
    clearTimeout(tid);
    document.removeEventListener("click", handleClickOutside);
  };
}, [adoptTargetId]);

// After: mousedown 대신 pointerdown 사용 또는 직접 등록
// (코멘트에 'click 사용: mousedown 시 드롭다운 내부 버튼 클릭이 선점'이라고 명시됨)
// click 이벤트 자체가 mousedown보다 늦게 발생하므로 지연 불필요
useEffect(() => {
  if (!adoptTargetId) return;
  document.addEventListener("click", handleClickOutside);
  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, [adoptTargetId, handleClickOutside]);
```

**TrendingListSection.tsx — GSAP 초기화 setTimeout(50) 제거:**
```typescript
// Before
const timer = setTimeout(setup, 50);
return () => { clearTimeout(timer); animationRef.current?.kill(); };

// After: requestAnimationFrame으로 레이아웃 확정 후 실행
const rafId = requestAnimationFrame(setup);
return () => { cancelAnimationFrame(rafId); animationRef.current?.kill(); };
```

**useImageUpload.ts — setTimeout(100) startDetection 지연:**
```typescript
// Before: UI 업데이트를 100ms 기다림
setTimeout(() => { startDetection(); }, 100);

// After: 직접 호출 (Zustand는 즉시 상태 업데이트)
startDetection();
```

**AISummarySection.tsx — setTimeout reveal:**
```typescript
// Before
const t = setTimeout(() => setRevealed(true), 300);
return () => clearTimeout(t);

// After: CSS transition으로 대체하거나 GSAP delay 사용
// CSS approach: opacity transition + useEffect 없이 처리
// 혹은 cleanup이 있으므로 현재도 누수는 없음 — 단, 스타일 일관성을 위해 GSAP delay 권장
```

### Anti-Patterns to Avoid

- **React 이벤트 핸들러에서 직접 gsap.to() 호출:** 컨텍스트 외부 애니메이션은 언마운트 시 정리되지 않음
- **useEffect 내 isHovered state → gsap 패턴:** isHovered를 state로 관리하고 useEffect에서 gsap 호출하면 불필요한 리렌더 + 컨텍스트 없는 애니메이션 발생. contextSafe 직접 핸들러로 대체
- **React Query queryFn에서 signal 무시:** React Query가 signal을 전달해도 fetcher가 받지 않으면 효과 없음
- **AbortError 미처리:** `err.name === "AbortError"` 체크 없이 에러 핸들러에 abort 에러가 들어가면 toast 등 부작용 발생

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GSAP cleanup | 수동 kill() 리스트 관리 | `useGSAP` + `contextSafe` | 자동 컨텍스트 관리, 레이스 컨디션 방지 |
| fetch 취소 | isUnmounted 플래그 | `AbortController` + `signal` | 표준 API, React Query 통합 |
| debounce | 커스텀 setTimeout ref | `useCallback` + ref 패턴 (이미 codebase에 존재) | 일관성 |

**Key insight:** 코드베이스에 이미 올바른 패턴이 부분적으로 존재한다 (`useGSAP`, `ctx.revert()`, `clearTimeout`). 새 솔루션 도입이 아니라 기존 패턴의 일관 적용이 목표다.

---

## Common Pitfalls

### Pitfall 1: contextSafe 반환값 타입
**What goes wrong:** `useGSAP`에서 `contextSafe`를 받지 않고 `const { contextSafe } = useGSAP(...)` 구문 오류 발생
**Why it happens:** `useGSAP`는 `{ context, contextSafe }` 객체를 반환하지만 대부분 destructuring 없이 사용됨
**How to avoid:** `const { contextSafe } = useGSAP(() => { /* scroll anims */ }, { scope: ref });` — 콜백과 contextSafe를 함께 사용 가능
**Warning signs:** TypeScript 오류 `Property 'contextSafe' does not exist on type 'void'`

### Pitfall 2: AbortError를 일반 에러로 처리
**What goes wrong:** 컴포넌트 언마운트 시 abort → toast.error() 표시 또는 Sentry 에러 전송
**Why it happens:** `catch (err)` 블록에서 AbortError 구분 안 함
**How to avoid:**
```typescript
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") return;
  // 실제 에러만 처리
}
```
**Warning signs:** 언마운트 시 toast 에러 메시지 노출

### Pitfall 3: ctxRef.current.add() vs contextSafe()
**What goes wrong:** `ImageDetailModal`처럼 `ctxRef.current = gsap.context(...)` 패턴에서 이벤트 핸들러 수정 시 어떤 API를 써야 할지 혼동
**Why it happens:** `gsap.context`의 `.add()` 메서드와 `useGSAP`의 `contextSafe()`는 다른 API
**How to avoid:**
- `useGSAP` 사용 컴포넌트: `contextSafe()` 사용
- `gsap.context()` 직접 사용 컴포넌트: `ctxRef.current.add(() => { ... })` 사용
- 혼용 금지

### Pitfall 4: React Query signal 전파 경로
**What goes wrong:** React Query가 signal을 넘겨도 중간 헬퍼 함수가 받지 않으면 효과 없음
**Why it happens:** `queryFn: () => adminFetch(url)` — 화살표 함수가 signal을 캡처하지 않음
**How to avoid:** `queryFn: ({ signal }) => adminFetch(url, { signal })`

### Pitfall 5: VtonModal의 fetch 패턴
**What goes wrong:** VtonModal은 직접 fetch를 사용하며, AbortController 추가 시 modal close → unmount → abort 순서 검증 필요
**How to avoid:** AbortController ref를 useEffect cleanup에서 abort하되, 성공/에러 상태 업데이트를 abort 후에도 시도하지 않도록 guard

---

## Code Examples

### contextSafe 전체 패턴 (TrendingListSection 수정 예)

```typescript
// Source: @gsap/react 2.1.2 공식 API
function FlowingMenuItem({ item, index }: ...) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  // contextSafe: 이 컴포넌트의 GSAP 컨텍스트 내에서 안전하게 실행
  const { contextSafe } = useGSAP(
    () => {
      // 마운트 시 marquee 애니메이션 설정
      const part = marqueeInnerRef.current?.querySelector(".marquee-part") as HTMLElement;
      if (!part) return;
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -part.offsetWidth, duration: 12, ease: "none", repeat: -1,
      });
    },
    { scope: itemRef, dependencies: [item.label, repetitions] }
  );

  // contextSafe로 래핑: 언마운트 후 호출되어도 안전
  const handleMouseEnter = contextSafe((ev: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = itemRef.current!.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  });

  const handleMouseLeave = contextSafe((ev: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = itemRef.current!.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  });

  return (
    <Link onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      ...
    </Link>
  );
}
```

### apiClient signal 전파

```typescript
// lib/api/client.ts (수정)
export interface ApiClientOptions {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal; // 추가
}

export async function apiClient<T>(options: ApiClientOptions): Promise<T> {
  const { path, method = "GET", body, requiresAuth = false, headers = {}, signal } = options;
  // ... (기존 auth 로직)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal, // 추가
  });
  // ...
}
```

### React Query queryFn signal 전달

```typescript
// lib/hooks/admin/useDashboard.ts (수정)
async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useDashboardStats(): UseQueryResult<KPIStats> {
  return useQuery<KPIStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: ({ signal }) =>
      adminFetch<KPIStats>("/api/v1/admin/dashboard/stats", { signal }),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gsap.context()` 수동 관리 | `useGSAP` hook | GSAP 3.11+ / @gsap/react | cleanup 자동화, contextSafe 제공 |
| `isUnmounted` ref 플래그 | `AbortController` | React 18+ | 표준 API, React Query 통합 |
| scroll animation in useEffect | `useGSAP` + ScrollTrigger | GSAP 3.12+ | scope-based cleanup |

**Deprecated/outdated:**
- `gsap.context()` + 수동 `ctx.revert()` in useEffect: `useGSAP`으로 대체 가능 (단, 이미 올바르게 cleanup 중이면 유지해도 무방)
- `isUnmounted = true` 패턴: AbortController로 대체

---

## Scope of Changes (파일 목록)

### MEM-01 대상 — contextSafe 적용 필요 파일

이벤트 핸들러 애니메이션이 있는 파일:

| 파일 | 문제 패턴 | 수정 방법 |
|------|----------|----------|
| `lib/components/main/TrendingListSection.tsx` | handleMouseEnter/Leave gsap.timeline() | contextSafe 래핑 |
| `lib/components/main-renewal/MasonryGridItem.tsx` | isHovered→useEffect gsap.fromTo() | contextSafe 핸들러로 전환 |
| `lib/components/detail/ImageDetailModal.tsx` | handleTouchMove gsap.set(), handleTouchEnd gsap.to() | ctxRef.current.add() |
| `lib/components/main-d/DraggableDoodle.tsx` | 드래그 이벤트 핸들러 내 gsap | contextSafe 래핑 |
| `lib/components/main-d/PolaroidCard.tsx` | hover 이벤트 핸들러 내 gsap | contextSafe 래핑 |
| `lib/components/main-d/StickerPeel.tsx` | pointer 이벤트 핸들러 내 gsap | contextSafe 래핑 |
| 기타 useGSAP 없이 직접 gsap.to/set 호출하는 파일 | — | 개별 확인 필요 |

이미 올바르게 처리된 파일 (수정 불필요):
- `MasonryGrid.tsx`, `ShopGrid.tsx`, `ItemDetailCard.tsx`(스크롤 애니메이션), `HeroSection.tsx` 등 — useGSAP + { scope } 패턴 사용 중

### MEM-02 대상 — AbortController 적용

| 파일 | 수정 내용 |
|------|----------|
| `lib/api/client.ts` | `signal?: AbortSignal` 파라미터 추가 |
| `lib/hooks/admin/useDashboard.ts` | `({ signal })` queryFn 수정 |
| `lib/hooks/admin/useServerLogs.ts` | adminFetch signal + useLogStream AbortController |
| `lib/hooks/admin/usePipeline.ts` | signal 전달 |
| `lib/hooks/admin/useAudit.ts` | signal 전달 |
| `lib/hooks/admin/useAiCost.ts` | signal 전달 |
| `lib/components/vton/VtonModal.tsx` | fetch signal 추가 |
| `lib/api/posts.ts` | uploadImage — AbortController (이미 retry 있음) |

### MEM-03 대상 — setTimeout 클린업 정비

| 파일 | 현재 | 수정 방법 |
|------|------|----------|
| `lib/components/detail/ItemDetailCard.tsx:95` | setTimeout(0) click 등록 | 직접 등록 |
| `lib/components/main/TrendingListSection.tsx:80` | setTimeout(50) GSAP init | requestAnimationFrame |
| `lib/hooks/useImageUpload.ts:84` | setTimeout(100) startDetection | 직접 호출 |
| `lib/components/detail/ImageDetailModal.tsx:129` | setTimeout(50) transition | GSAP onComplete 유지 (50ms는 의도적) |
| `lib/components/collection/StudioLoader.tsx:21` | setTimeout(300) unmount | cleanup 있음, AnimatePresence 검토 |
| `lib/components/detail/AISummarySection.tsx:14` | setTimeout(300) reveal | cleanup 있음, GSAP delay로 대체 검토 |

---

## Validation Architecture (MEM-04)

### Chrome DevTools Memory 프로파일링 방법

MEM-04는 자동 테스트가 아닌 수동 프로파일링으로 검증한다.

**절차:**
1. Chrome → DevTools → Memory 탭
2. "Heap snapshot" 선택
3. 주요 페이지(메인, 피드, 아이템 상세) 순서로 네비게이션 5회 반복
4. Snapshot 3개 촬영: 초기 → 5회 후 → GC 강제 후
5. "Comparison" 뷰에서 `#Delta` 음수 확인 (누수 없음)

**검증 대상:**
- `GSAP` 관련 객체가 snapshot에 남지 않음
- `EventListener` 개수가 반복 네비게이션 후 증가하지 않음
- Detached DOM nodes 없음

**자동 대리 지표 (CI 가능):**
- 빌드 성공 + TypeScript 오류 없음
- ESLint `react-hooks/exhaustive-deps` 경고 없음 (새로 추가되지 않음)

---

## Open Questions

1. **DraggableDoodle, PolaroidCard, StickerPeel의 정확한 GSAP 사용 방식**
   - What we know: main-d 폴더 파일들이 gsap import 있음
   - What's unclear: 이벤트 핸들러 내 직접 호출 여부
   - Recommendation: 실행 전 각 파일 확인 필요 (각 100-300줄 규모)

2. **useLogStream 폴링 AbortController 적용 범위**
   - What we know: 500줄 미만의 커스텀 훅, interval 기반
   - What's unclear: abort 시 partial response 처리 방법
   - Recommendation: interval clear + AbortController.abort() 동시 처리

3. **uploadImage의 XHR vs fetch**
   - What we know: `lib/api/posts.ts`의 uploadImage는 fetch 기반이며 retry 로직 포함
   - What's unclear: onProgress 콜백이 fetch로 구현되어 있어 실제로는 progress 이벤트가 없을 가능성
   - Recommendation: AbortController만 추가, onProgress는 별도 이슈

---

## Sources

### Primary (HIGH confidence)
- `@gsap/react` 2.1.2 (현재 설치 버전) — useGSAP API, contextSafe 반환값
- `@tanstack/react-query` 5.90.11 — queryFn signal 파라미터
- 코드베이스 직접 분석 — 43개 GSAP 파일, 41개 fetch 파일, setTimeout 패턴

### Secondary (MEDIUM confidence)
- GSAP 공식 문서 — contextSafe는 @gsap/react 2.x 공식 기능
- MDN — AbortController, AbortSignal Web API

### Tertiary (LOW confidence)
- 해당 없음 — 모든 패턴이 기존 코드베이스에서 검증됨

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 이미 설치된 라이브러리 버전 확인
- Architecture: HIGH — 코드베이스에서 올바른 패턴과 문제 패턴 직접 확인
- Pitfalls: HIGH — 기존 코드에서 실제 패턴 분석

**Research date:** 2026-03-26
**Valid until:** 2026-09-26 (GSAP 3.x / @gsap/react 2.x stable period)
