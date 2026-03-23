---
name: react-best-practices
description: >-
  Vercel 엔지니어링의 React/Next.js 성능 최적화 가이드라인 (45규칙/8카테고리).
  React 컴포넌트 작성, Next.js 페이지, 데이터 페칭, 번들 최적화, 성능 개선 작업 시 적용.
---

# React Best Practices (Vercel Engineering)

45개 규칙, 우선순위별 8카테고리.

## 1. Waterfalls 제거 — CRITICAL

- **Promise.all()** 독립 작업 병렬화
- **await 지연**: 실제 사용 시점까지 await 미루기
- **Suspense 경계**: 독립 데이터에 별도 Suspense boundary
- **API route 직렬화 방지**: route handler에서 순차 fetch 금지

```tsx
// Bad: 순차 실행
const user = await fetchUser();
const posts = await fetchPosts();

// Good: 병렬 실행
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
```

## 2. Bundle 최적화 — CRITICAL

- **barrel import 금지**: `import { X } from '@/lib/utils'` 대신 직접 경로
- **dynamic import**: 무거운 컴포넌트 `next/dynamic`으로 지연 로드
- **3rd-party 지연**: analytics, chat 위젯 등 비핵심 라이브러리 defer
- **의도 기반 preload**: hover/focus 시 미리 로드

## 3. Server 성능 — HIGH

- **React.cache()**: 요청 내 데이터 중복 제거
- **LRU 캐시**: 요청 간 공유 데이터 캐싱
- **직렬화 최소화**: RSC → Client 전달 데이터 축소
- **after()**: 응답 후 비차단 작업 실행

## 4. Client 데이터 — MEDIUM-HIGH

- **SWR 자동 중복 제거**: 동일 키 요청 deduplicate
- **전역 이벤트 리스너**: 중복 등록 방지

## 5. Re-render 최적화 — MEDIUM

- **state 읽기 지연**: 사용 시점에서만 state 접근
- **memo 추출**: 고비용 컴포넌트 분리 + React.memo
- **effect deps 최소화**: 필요한 값만 의존성에
- **derived state 구독**: 전체 store 대신 selector 사용
- **functional setState**: `setCount(prev => prev + 1)`
- **lazy initialization**: `useState(() => expensiveCompute())`
- **useTransition**: 비긴급 업데이트 분리

## 6. Rendering 성능 — MEDIUM

- **content-visibility**: 긴 목록 CSS `content-visibility: auto`
- **static JSX hoist**: 변하지 않는 JSX 컴포넌트 외부로
- **SVG 정밀도**: 소수점 2자리로 제한
- **Activity 컴포넌트**: show/hide에 React.Activity 사용
- **명시적 조건부 렌더링**: `&&` 대신 삼항 연산자

## 7. JS 성능 — LOW-MEDIUM

- **Map/Set O(1) 조회**: 배열 대신 Map/Set
- **early return**: 조기 반환으로 불필요 연산 방지
- **loop 내 프로퍼티 캐시**: 반복 접근 변수 캐싱
- **배열 순회 합치기**: 여러 map/filter → 한 번의 reduce
- **toSorted()**: 불변 정렬 (원본 배열 유지)

## 8. Advanced — LOW

- **event handler refs**: 이벤트 핸들러를 ref에 저장
- **useLatest**: 안정적 콜백 ref 패턴

## decoded 프로젝트 적용 포인트

- GSAP/Three.js/Spline → **dynamic import 필수** (큰 번들)
- Zustand store → **selector 사용** (`useStore(s => s.field)`)
- Supabase 쿼리 → **React.cache()** 또는 React Query 활용
- 이미지 그리드 → **content-visibility** + Intersection Observer
- `'use client'` → 가능한 한 아래로 밀어내기

## 사용 예시

```
> 이 컴포넌트 성능 최적화해줘
> 번들 크기 줄이는 방법 알려줘
> waterfall 패턴 찾아서 수정해줘
> 리렌더링 최적화 해줘
```
