# 성능 가이드

> 버전: 1.0.0
> 최종 업데이트: 2026-01-14
> 목적: 성능 최적화 전략 및 모니터링 가이드

---

## 개요

이 문서는 Decoded 앱의 성능 최적화 전략과 모니터링 방법을 정리합니다. Core Web Vitals 목표와 각 영역별 최적화 기법을 다룹니다.

---

## 1. 성능 목표

### 1.1 Core Web Vitals

| 지표 | 설명 | 목표 | 현재 상태 |
|------|------|------|----------|
| **LCP** (Largest Contentful Paint) | 가장 큰 콘텐츠 렌더링 시간 | <2.5s | 측정 필요 |
| **FID** (First Input Delay) | 첫 상호작용 지연 | <100ms | 측정 필요 |
| **CLS** (Cumulative Layout Shift) | 누적 레이아웃 변경 | <0.1 | 측정 필요 |
| **INP** (Interaction to Next Paint) | 상호작용 반응 시간 | <200ms | 측정 필요 |
| **TTFB** (Time to First Byte) | 첫 바이트 도착 시간 | <800ms | 측정 필요 |

### 1.2 커스텀 메트릭

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| Initial Load | <3s | Page load event |
| Infinite Scroll Trigger | <500ms | fetchNextPage 완료 시간 |
| Filter Change | <300ms | 필터 변경 → 첫 렌더링 |
| Detail Open | <200ms | 클릭 → 모달 표시 |
| Scroll FPS | 60fps | Chrome DevTools |

---

## 2. 현재 최적화

### 2.1 DOM 최적화

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DOM OPTIMIZATION STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   문제: 무한 스크롤로 DOM 노드 무한 증가 → 메모리 부족 + 렌더링 지연           │
│                                                                                  │
│   해결책: 300 DOM 노드 제한                                                     │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ ThiingsGrid.tsx                                                          │   │
│   │                                                                          │   │
│   │ // 최대 300개만 렌더링                                                  │   │
│   │ const MAX_RENDERED_ITEMS = 300;                                         │   │
│   │                                                                          │   │
│   │ const visibleItems = useMemo(() => {                                    │   │
│   │   return images.slice(0, MAX_RENDERED_ITEMS);                           │   │
│   │ }, [images]);                                                           │   │
│   │                                                                          │   │
│   │ 효과:                                                                   │   │
│   │ • 메모리 사용량 안정화                                                  │   │
│   │ • 스크롤 성능 60fps 유지                                                │   │
│   │ • 초기 렌더링 속도 개선                                                 │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   구현 위치: packages/web/lib/components/grid/ThiingsGrid.tsx                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 이미지 로딩 전략

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        IMAGE LOADING STRATEGY                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Priority Loading (상위 6개)                                              │   │
│   │                                                                          │   │
│   │ // 첫 6개 이미지는 우선 로딩                                           │   │
│   │ const isHighPriority = index < 6;                                       │   │
│   │                                                                          │   │
│   │ <img                                                                    │   │
│   │   loading={isHighPriority ? 'eager' : 'lazy'}                          │   │
│   │   fetchPriority={isHighPriority ? 'high' : 'auto'}                     │   │
│   │   decoding="async"                                                      │   │
│   │ />                                                                      │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Lazy Loading (나머지)                                                   │   │
│   │                                                                          │   │
│   │ // IntersectionObserver 기반 지연 로딩                                  │   │
│   │ useScrollAnimation({                                                    │   │
│   │   rootMargin: '200px',  // 200px 전에 미리 로딩                        │   │
│   │   threshold: 0.1,                                                       │   │
│   │ });                                                                     │   │
│   │                                                                          │   │
│   │ // data-src 속성 사용                                                   │   │
│   │ <img                                                                    │   │
│   │   data-src={imageUrl}                                                   │   │
│   │   className="lazy"                                                      │   │
│   │ />                                                                      │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   구현 위치:                                                                    │
│   • packages/web/lib/hooks/useScrollAnimation.ts                               │
│   • packages/web/lib/components/grid/CardCell.tsx                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 React Query 캐싱

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        REACT QUERY CACHE STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Cache Configuration:                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ lib/react-query/client.ts                                                │   │
│   │                                                                          │   │
│   │ {                                                                        │   │
│   │   staleTime: 60 * 1000,      // 1분간 fresh 유지                       │   │
│   │   gcTime: 5 * 60 * 1000,     // 5분간 캐시 보관                        │   │
│   │   retry: 1,                   // 1회 재시도                             │   │
│   │   refetchOnWindowFocus: false // 포커스 시 refetch 안함                │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   │ 효과:                                                                   │   │
│   │ • 불필요한 API 호출 감소                                               │   │
│   │ • 필터 변경 시 캐시 히트로 즉시 렌더링                                 │   │
│   │ • 메모리 효율적 관리 (gcTime 후 자동 정리)                             │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   Keep Previous Data:                                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ useInfiniteFilteredImages                                                │   │
│   │                                                                          │   │
│   │ {                                                                        │   │
│   │   placeholderData: keepPreviousData                                     │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   │ 효과:                                                                   │   │
│   │ • 필터 변경 시 깜빡임 방지                                             │   │
│   │ • 이전 데이터 표시하며 새 데이터 로딩                                  │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 애니메이션 성능

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       ANIMATION PERFORMANCE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   GPU 가속 속성만 사용:                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ app/globals.css                                                          │   │
│   │                                                                          │   │
│   │ /* GPU 가속 (레이어 생성) */                                            │   │
│   │ .animate-gpu {                                                          │   │
│   │   transform: translateZ(0);                                             │   │
│   │   will-change: transform, opacity;                                      │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   │ /* Scroll Animation */                                                  │   │
│   │ [data-scroll] {                                                         │   │
│   │   transition: transform 0.6s ease, opacity 0.6s ease;                   │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   │ [data-scroll].is-visible {                                              │   │
│   │   transform: translateY(0);                                             │   │
│   │   opacity: 1;                                                           │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   │ [data-scroll]:not(.is-visible) {                                        │   │
│   │   transform: translateY(20px);                                          │   │
│   │   opacity: 0;                                                           │   │
│   │ }                                                                        │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   권장 속성 (GPU 가속):                                                         │
│   ✅ transform (translate, scale, rotate)                                       │
│   ✅ opacity                                                                    │
│   ❌ width, height (리플로우 발생)                                              │
│   ❌ top, left (리플로우 발생)                                                  │
│   ❌ margin, padding (리플로우 발생)                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 병목 분석

### 3.1 알려진 병목

| 영역 | 문제 | 원인 | 해결 상태 |
|------|------|------|----------|
| 초기 로딩 | LCP 지연 | 큰 이미지 로딩 | 🔶 일부 해결 |
| 필터 변경 | 깜빡임 | 캐시 미스 | ✅ 해결 (keepPreviousData) |
| 무한 스크롤 | 메모리 증가 | DOM 노드 누적 | ✅ 해결 (300개 제한) |
| 상세 모달 | FLIP 지연 | GSAP 계산 시간 | 🔶 최적화 필요 |
| 검색 | 잦은 refetch | 디바운스 없음 | ✅ 해결 (250ms) |

### 3.2 계획된 최적화

| 영역 | 최적화 | 예상 효과 | 우선순위 |
|------|--------|----------|---------|
| 이미지 | srcset 반응형 이미지 | LCP 30% 개선 | P0 |
| 이미지 | WebP/AVIF 변환 | 용량 50% 감소 | P1 |
| 번들 | 동적 import | 초기 JS 40% 감소 | P1 |
| SSR | 스트리밍 SSR | TTFB 개선 | P2 |
| 캐싱 | CDN 적극 활용 | 이미지 로딩 속도 개선 | P1 |

---

## 4. 모니터링 & 측정

### 4.1 측정 도구

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE MEASUREMENT TOOLS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   개발 환경:                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ 1. Chrome DevTools Performance Tab                                       │   │
│   │    • Record 버튼으로 프로파일링                                         │   │
│   │    • 스크롤 성능, 렌더링 분석                                           │   │
│   │                                                                          │   │
│   │ 2. React DevTools Profiler                                              │   │
│   │    • 컴포넌트 렌더링 시간 분석                                          │   │
│   │    • 불필요한 리렌더링 식별                                             │   │
│   │                                                                          │   │
│   │ 3. React Query DevTools                                                 │   │
│   │    • 캐시 상태 확인                                                     │   │
│   │    • 쿼리 타이밍 분석                                                   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   CI/CD:                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ 1. Lighthouse CI                                                         │   │
│   │    • PR마다 자동 성능 측정                                              │   │
│   │    • 성능 저하 시 알림                                                  │   │
│   │                                                                          │   │
│   │ 2. Web Vitals 라이브러리                                                │   │
│   │    • 실사용자 메트릭 수집                                               │   │
│   │    • Analytics에 보고                                                   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Lighthouse CI 설정

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://preview-url.vercel.app/
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

### 4.3 Web Vitals 통합

```typescript
// lib/analytics/webVitals.ts
import { onCLS, onFID, onLCP, onINP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS((metric) => {
    console.log('CLS:', metric.value);
    // Analytics 전송
  });

  onFID((metric) => {
    console.log('FID:', metric.value);
  });

  onLCP((metric) => {
    console.log('LCP:', metric.value);
  });

  onINP((metric) => {
    console.log('INP:', metric.value);
  });

  onTTFB((metric) => {
    console.log('TTFB:', metric.value);
  });
}
```

---

## 5. 성능 예산

### 5.1 예산 정의

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "first-input-delay", "budget": 100 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "interactive", "budget": 3800 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "image", "budget": 500 },
      { "resourceType": "total", "budget": 1000 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 10 }
    ]
  }
]
```

### 5.2 번들 크기 제한

| 청크 | 제한 | 현재 | 상태 |
|------|------|------|------|
| main.js | 100KB | 측정 필요 | - |
| vendors.js | 200KB | 측정 필요 | - |
| 페이지별 | 50KB | 측정 필요 | - |
| 전체 JS | 350KB | 측정 필요 | - |

---

## 6. 최적화 체크리스트

### 6.1 개발 시 체크리스트

```
□ 이미지
  □ 적절한 크기로 리사이즈
  □ lazy loading 적용 (상위 6개 제외)
  □ alt 속성 추가
  □ decoding="async" 추가

□ 컴포넌트
  □ memo() 적용 검토
  □ useMemo/useCallback 필요 시 적용
  □ 불필요한 리렌더링 확인 (React DevTools)
  □ 이벤트 핸들러 최적화

□ 상태 관리
  □ Zustand selector로 필요한 값만 구독
  □ React Query staleTime 적절히 설정
  □ 불필요한 refetch 방지

□ 애니메이션
  □ GPU 가속 속성만 사용 (transform, opacity)
  □ will-change 필요 시 추가
  □ 애니메이션 종료 후 will-change 제거

□ 번들
  □ 동적 import 검토
  □ 사용하지 않는 코드 제거
  □ 번들 분석 (yarn build --analyze)
```

### 6.2 PR 리뷰 시 체크리스트

```
□ 새로운 의존성 추가 시 번들 사이즈 영향 확인
□ 큰 컴포넌트에 memo() 적용 검토
□ API 호출에 적절한 캐싱 전략 적용
□ 무한 스크롤 관련 코드 시 DOM 노드 제한 확인
□ 애니메이션 코드 시 GPU 가속 속성 사용 확인
```

---

## 7. 일반적인 성능 문제

### 7.1 문제 해결 가이드

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 스크롤 버벅임 | 과도한 DOM 노드 | 가상화 또는 노드 제한 |
| 느린 초기 로딩 | 큰 번들 사이즈 | 코드 스플리팅, 트리 쉐이킹 |
| 이미지 로딩 지연 | 큰 이미지 파일 | 압축, WebP, lazy loading |
| 메모리 증가 | 캐시 누적 | gcTime 설정, cleanup |
| 필터 변경 시 깜빡임 | 캐시 미스 | keepPreviousData |
| 리렌더링 과다 | 잘못된 상태 구독 | selector 최적화 |

---

## 관련 문서

- [../testing/scenarios.md](../testing/scenarios.md) - 테스트 시나리오
- [../architecture/README.md](../architecture/README.md) - 시스템 아키텍처
- [../../specs/feature-spec/workflows.md](../../specs/feature-spec/workflows.md) - 워크플로우
