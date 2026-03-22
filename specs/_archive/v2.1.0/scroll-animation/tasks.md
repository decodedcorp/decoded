# 작업 목록: 스크롤 애니메이션 & 레이지 로딩 시스템

**입력**: `/specs/001-scroll-animation/` 설계 문서
**사전 요구사항**: plan.md (필수), spec.md (사용자 스토리에 필수), research.md, data-model.md, quickstart.md

**테스트**: 테스트 작업은 컨스티튜션 요구사항에 따라 Playwright E2E 테스트 및 수동 테스트를 포함합니다.

**구성**: 작업은 각 스토리의 독립적인 구현 및 테스트를 가능하게 하기 위해 사용자 스토리별로 그룹화됩니다.

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## 경로 규칙

- **프로젝트 유형**: 웹 애플리케이션 (App Router가 있는 Next.js)
- **구조**: `lib/hooks/`, `lib/utils/`, `app/`, `__tests__/e2e/`
- 모든 경로는 저장소 루트 기준: `/Users/kiyeol/development/decoded/decoded-app/`

---

## 1단계: 설정 (공유 인프라)

**목적**: 프로젝트 초기화 및 기본 CSS 인프라

- [x] T001 app/globals.css에 GPU 가속 속성(opacity, transform)을 사용하여 .js-observe, .is-visible, .is-hidden 스타일이 포함된 CSS 애니메이션 클래스 생성
- [x] T002 [P] app/globals.css에 --stagger 변수용 CSS 사용자 정의 속성 지원 추가
- [x] T003 [P] tsconfig.json에서 TypeScript 설정이 React 훅과 strict 타입 검사를 지원하는지 확인

**체크포인트**: 애니메이션 구현을 위한 CSS 인프라 준비 완료

---

## 2단계: 기반 (블로킹 사전 요구사항)

**목적**: 모든 사용자 스토리가 의존하는 핵심 TypeScript 타입 및 인터페이스

**⚠️ 중요**: 이 단계가 완료될 때까지 어떤 사용자 스토리 작업도 시작할 수 없음

- [x] T004 lib/hooks/useScrollAnimation.ts에 threshold, rootMargin, onEnter, onExit 속성이 포함된 UseScrollAnimationOptions 인터페이스 생성
- [x] T005 [P] lib/hooks/useScrollAnimation.ts에 observeRef, observe, unobserve, disconnect, isObserving 메서드가 포함된 UseScrollAnimationReturn 인터페이스 생성
- [x] T006 [P] 요소 상태 추적용 내부 AnimationState 인터페이스 생성 (isVisible, imageLoaded, staggerDelay)

**체크포인트**: 기반 준비 완료 - 이제 사용자 스토리 구현을 병렬로 시작 가능

---

## 3단계: 사용자 스토리 1 - 스크롤 시 부드러운 콘텐츠 등장 (우선순위: P1) 🎯 MVP

**목표**: 시차 지연이 있는 부드러운 opacity/transform 전환과 함께 IntersectionObserver를 사용하는 핵심 스크롤 애니메이션 시스템 구현

**독립 테스트**: 여러 카드 요소가 있는 페이지를 스크롤하고 각 카드가 320-420ms에 걸쳐 부드러운 opacity 및 transform 애니메이션과 함께 보이지 않는 상태에서 보이는 상태로 전환되는지 확인하여 완전히 테스트 가능

### 사용자 스토리 1 테스트

> **참고: 구현 전에 이 테스트를 먼저 작성하고 실패하는지 확인**

- [x] T007 [P] [US1] __tests__/e2e/scroll-animation.spec.ts에 기본 카드 애니메이션용 Playwright E2E 테스트 생성 - 스크롤 시 .is-visible 클래스 추가 확인
- [x] T008 [P] [US1] __tests__/e2e/scroll-animation.spec.ts에 시차 애니메이션 타이밍용 Playwright E2E 테스트 생성 - 여러 카드에서 캐스케이딩 효과 확인
- [x] T009 [P] [US1] __tests__/e2e/scroll-animation.spec.ts에 종료 애니메이션용 Playwright E2E 테스트 생성 - 스크롤로 나갈 때 .is-hidden 클래스 추가 확인

### 사용자 스토리 1 구현

- [x] T010 [US1] lib/hooks/useScrollAnimation.ts에서 threshold 0.15와 rootMargin "0px 0px -10% 0px"로 IntersectionObserver 초기화 구현
- [x] T011 [US1] lib/hooks/useScrollAnimation.ts에서 intersection 엔트리를 처리하고 is-visible/is-hidden 클래스를 토글하는 observer 콜백 로직 구현
- [x] T012 [US1] lib/hooks/useScrollAnimation.ts에서 data-delay 속성에서 시차 지연 추출하고 --stagger CSS 사용자 정의 속성 설정
- [x] T013 [US1] lib/hooks/useScrollAnimation.ts에서 요소 관찰용 useCallback을 사용한 observeRef 콜백 함수 구현
- [x] T014 [US1] lib/hooks/useScrollAnimation.ts에서 useEffect 정리 함수를 사용한 정리 및 disconnect 로직 구현
- [x] T015 [US1] lib/hooks/useScrollAnimation.ts에서 UseScrollAnimationOptions 및 UseScrollAnimationReturn에 대한 적절한 TypeScript 타입 내보내기 추가
- [x] T016 [US1] app/examples/scroll-animation/page.tsx에 3-5개 카드와 다양한 시차 지연을 보여주는 기본 카드 애니메이션 예시 사용 페이지 생성
- [ ] T017 [US1] Chrome DevTools Performance 패널을 사용하여 60fps에서 애니메이션 실행 확인 - 레이아웃 스래싱이나 페인트 연산 없음

**체크포인트**: 이 시점에서 사용자 스토리 1이 완전히 작동해야 함 - 스크롤 시 시차 지연과 함께 카드가 부드럽게 애니메이션

---

## 4단계: 사용자 스토리 2 - 점진적 이미지 로딩 (우선순위: P2)

**목표**: IntersectionObserver와 함께 data-src 속성 교체를 사용하는 이미지 레이지 로딩 기능 추가

**독립 테스트**: 이미지가 있는 페이지를 로드하고 네트워크 요청을 모니터링하여 스크롤 없이 보이지 않는 이미지가 근처로 스크롤할 때까지 로드되지 않는지 확인하여 테스트 가능

### 사용자 스토리 2 테스트

- [x] T018 [P] [US2] __tests__/e2e/scroll-animation.spec.ts에 레이지 이미지 로딩용 Playwright E2E 테스트 생성 - 근처로 스크롤할 때만 이미지 로드 확인
- [x] T019 [P] [US2] __tests__/e2e/scroll-animation.spec.ts에 이미지 재로드 방지용 Playwright E2E 테스트 생성 - data-loaded="true"가 중복 로드 방지 확인
- [x] T020 [P] [US2] __tests__/e2e/scroll-animation.spec.ts에 스크롤 없이 보이는 이미지용 Playwright E2E 테스트 생성 - 히어로 이미지 즉시 로드 확인

### 사용자 스토리 2 구현

- [x] T021 [US2] lib/hooks/useScrollAnimation.ts의 observer 콜백에 이미지 레이지 로딩 로직 추가 - img[data-src] 요소 쿼리
- [x] T022 [US2] lib/hooks/useScrollAnimation.ts에서 요소가 뷰포트에 진입할 때 data-src에서 src 속성으로 교체 구현
- [x] T023 [US2] lib/hooks/useScrollAnimation.ts에서 재진입 시 재로드 방지를 위한 data-loaded="true" 표시 구현
- [x] T024 [US2] lib/hooks/useScrollAnimation.ts의 UseScrollAnimationOptions 인터페이스에 enableLazyLoad 옵션 추가 (기본값: true)
- [x] T025 [US2] app/examples/scroll-animation/page.tsx의 예시 페이지 업데이트하여 적절한 치수(width/height)가 있는 여러 이미지로 레이지 이미지 로딩 시연
- [x] T026 [US2] 예시 페이지에서 이미지에 고정 치수(width/height 또는 aspect-ratio)가 있어 CLS 방지 확인
- [x] T027 [US2] 점진적 향상을 위해 app/examples/scroll-animation/page.tsx의 모든 예시 이미지에 네이티브 loading="lazy" 속성 추가

**체크포인트**: 이 시점에서 사용자 스토리 1과 2가 모두 독립적으로 작동해야 함 - 애니메이션 작동 및 이미지 레이지 로드

---

## 5단계: 사용자 스토리 3 - 성능 최적화 스크롤링 (우선순위: P3)

**목표**: 중급 기기에서 60fps 유지 및 Core Web Vitals 준수 달성을 위한 애니메이션 성능 최적화

**독립 테스트**: 다양한 기기에서 스크롤 중 프레임 레이트 측정, Core Web Vitals(CLS ≤ 0.1, LCP ≤ 2.5s) 확인, GPU 가속 렌더링 확인으로 테스트 가능

### 사용자 스토리 3 테스트

- [x] T028 [P] [US3] __tests__/e2e/scroll-animation.spec.ts에서 performance.now()를 사용하여 프레임 시간 측정하는 60fps 성능용 Playwright 테스트 생성
- [x] T029 [P] [US3] __tests__/e2e/scroll-animation.spec.ts에서 web-vitals 라이브러리를 사용하여 CLS, LCP, INP 측정하는 Core Web Vitals용 Playwright 테스트 생성
- [x] T030 [P] [US3] __tests__/e2e/scroll-animation.spec.ts에서 기기 에뮬레이션(iPhone 12, Galaxy S21)을 사용하는 모바일 성능용 Playwright 테스트 생성

### 사용자 스토리 3 구현

- [x] T031 [US3] app/globals.css의 .js-observe 클래스에 will-change: opacity, transform CSS 힌트 추가 (애니메이션 요소에만 범위 지정)
- [x] T032 [US3] lib/hooks/useScrollAnimation.ts의 observer 콜백에서 O(1) 복잡도 검증 구현 - DOM 쿼리나 측정 없음
- [x] T033 [US3] lib/hooks/useScrollAnimation.ts에서 threshold(0.0-1.0) 및 rootMargin(유효한 CSS 문자열)에 대한 입력 검증 추가
- [x] T034 [US3] lib/hooks/useScrollAnimation.ts에서 레이아웃 쿼리(getBoundingClientRect, offsetWidth) 회피하도록 observer 콜백 최적화
- [x] T035 [US3] lib/hooks/useScrollAnimation.ts에서 자동 가비지 컬렉션을 위한 요소 상태 저장용 WeakMap 추가
- [ ] T036 [US3] Chrome DevTools Performance 패널을 사용하여 애니메이션 성능 프로파일링 - 컴포지터 스레드 사용 및 <16.67ms 프레임 시간 확인
- [ ] T037 [US3] 모바일 기기(실제 기기 또는 BrowserStack)에서 테스트 - iPhone 12 및 Samsung Galaxy S21에서 60fps 확인
- [ ] T038 [US3] 예시 페이지에서 Lighthouse 감사 실행 - Core Web Vitals 점수 확인(LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)

**체크포인트**: 이제 모든 사용자 스토리가 성능 목표와 함께 독립적으로 작동해야 함

---

## 6단계: 마무리 & 교차 관심사

**목적**: 여러 사용자 스토리에 영향을 미치는 개선 및 최종 검증

- [ ] T039 [P] lib/hooks/useScrollAnimation.ts의 useScrollAnimation 훅에 사용 예시가 포함된 JSDoc 문서 추가
- [ ] T040 [P] specs/001-scroll-animation/에 API 사용법 및 예시를 문서화하는 README.md 생성
- [ ] T041 [P] lib/hooks/useScrollAnimation.ts에서 유효하지 않은 옵션(threshold, rootMargin)에 대한 설명적 오류 메시지와 함께 오류 처리 추가
- [ ] T042 [P] 접근성 고려사항 문서 추가 - 애니메이션이 prefers-reduced-motion을 존중함을 명시(향후 개선)
- [ ] T043 app/examples/scroll-animation/page.tsx에 모든 기능(애니메이션, 레이지 로딩, 시차, 성능)을 시연하는 종합 예시 페이지 생성
- [ ] T044 quickstart.md 검증 실행 - 5분 퀵 스타트 가이드를 따라하고 모든 단계가 작동하는지 확인
- [ ] T045 크로스 브라우저 테스트 - Chrome, Firefox, Safari, Edge(최신 버전)에서 기능 확인
- [ ] T046 수동 사용자 테스트 - 애니메이션 부드러움 테스트 및 피드백 제공을 위해 3명 사용자 모집(컨스티튜션 요구사항에 따라)
- [ ] T047 최종 구현 노트 및 사용 패턴으로 CLAUDE.md 에이전트 컨텍스트 업데이트
- [ ] T048 코드 리뷰 및 리팩토링 - 훅이 100줄 미만이고 React 모범 사례를 따르는지 확인
- [ ] T049 [P] 번들 크기 최적화 - 외부 의존성이 없고 최소한의 코드 크기 확인
- [ ] T050 최종 성능 검증 - 전체 Lighthouse 감사 실행 및 모든 Core Web Vitals 목표 달성 확인

---

## 의존성 & 실행 순서

### 단계 의존성

- **설정 (1단계)**: 의존성 없음 - 즉시 시작 가능
- **기반 (2단계)**: 설정 완료에 의존 - 모든 사용자 스토리 블로킹
- **사용자 스토리 (3-5단계)**: 모두 기반 단계 완료에 의존
  - 사용자 스토리 1 (P1): 기반 후 시작 가능 - 다른 스토리에 의존성 없음
  - 사용자 스토리 2 (P2): 기반 후 시작 가능 - US1에 의존성 없음 (병렬 실행 가능)
  - 사용자 스토리 3 (P3): 성능 테스트를 위해 US1 및 US2 구현에 의존
- **마무리 (6단계)**: 모든 사용자 스토리 완료에 의존

### 사용자 스토리 의존성

- **사용자 스토리 1 (P1)**: 기반(2단계) 후 시작 가능 - 다른 스토리에 의존성 없음 ✅ 독립적
- **사용자 스토리 2 (P2)**: 기반(2단계) 후 시작 가능 - US1에 의존성 없음 ✅ 독립적 (US1과 병렬 실행 가능)
- **사용자 스토리 3 (P3)**: 성능 테스트를 위해 US1 및 US2 구현 필요 ⚠️ 순차적

### 각 사용자 스토리 내에서

- 구현 전에 테스트를 작성하고 실패해야 함
- 예시 페이지 전에 핵심 훅 로직
- 레이지 로딩 통합 전에 애니메이션 시스템
- 성능 최적화 전에 구현
- 다음 우선순위로 이동하기 전에 스토리 완료

### 병렬 기회

- **설정 단계**: T001, T002, T003 병렬 실행 가능
- **기반 단계**: T005, T006 병렬 실행 가능 (T004 인터페이스 생성 후)
- **사용자 스토리 1 테스트**: T007, T008, T009 병렬 실행 가능
- **사용자 스토리 2 테스트**: T018, T019, T020 병렬 실행 가능
- **사용자 스토리 3 테스트**: T028, T029, T030 병렬 실행 가능
- **사용자 스토리 1 & 2**: 다른 개발자가 병렬로 구현 가능 (기반 단계 후)
- **마무리 단계**: T039, T040, T041, T042, T049 병렬 실행 가능

---

## 병렬 예시: 사용자 스토리 1

```bash
# 사용자 스토리 1의 모든 테스트를 함께 시작:
작업 T007: "__tests__/e2e/scroll-animation.spec.ts에 기본 카드 애니메이션용 Playwright E2E 테스트 생성"
작업 T008: "__tests__/e2e/scroll-animation.spec.ts에 시차 애니메이션 타이밍용 Playwright E2E 테스트 생성"
작업 T009: "__tests__/e2e/scroll-animation.spec.ts에 종료 애니메이션용 Playwright E2E 테스트 생성"

# 테스트 실패 후, 핵심 훅 구현 (순차적):
작업 T010 → T011 → T012 → T013 → T014 → T015
# 그 다음 예시 페이지 생성 및 검증:
작업 T016 → T017
```

## 병렬 예시: 사용자 스토리 1 & 2 (다중 개발자)

```bash
# 개발자 A: 사용자 스토리 1 (애니메이션)
3단계: T007-T017

# 개발자 B: 사용자 스토리 2 (레이지 로딩) - 기반 후 동시에 시작 가능
4단계: T018-T027

# 두 스토리 모두 독립적으로 구현하고 충돌 없이 병합 가능
```

---

## 구현 전략

### MVP 우선 (사용자 스토리 1만)

1. 1단계 완료: 설정 (T001-T003)
2. 2단계 완료: 기반 (T004-T006) - 중요 - 모든 스토리 블로킹
3. 3단계 완료: 사용자 스토리 1 (T007-T017)
4. **중지 및 검증**: 사용자 스토리 1 독립적으로 테스트
5. 기본 스크롤 애니메이션 배포/데모 ✅ MVP 전달!

**MVP 결과물**: 부드러운 opacity/transform 전환과 시차 지연이 있는 작동하는 스크롤 애니메이션 시스템

### 점진적 전달

1. 설정 + 기반 완료 → 기반 준비
2. 사용자 스토리 1 추가 (T007-T017) → 독립 테스트 → 배포/데모 ✅ MVP!
3. 사용자 스토리 2 추가 (T018-T027) → 독립 테스트 → 배포/데모 ✅ 레이지 로딩!
4. 사용자 스토리 3 추가 (T028-T038) → 독립 테스트 → 배포/데모 ✅ 성능 최적화!
5. 마무리 (T039-T050) → 최종 검증 → 프로덕션 준비 ✅

### 병렬 팀 전략

여러 개발자가 있는 경우:

1. 팀이 함께 설정 + 기반 완료 (T001-T006)
2. 기반 완료 후:
   - 개발자 A: 사용자 스토리 1 (T007-T017) - 애니메이션 시스템
   - 개발자 B: 사용자 스토리 2 (T018-T027) - 레이지 로딩 (병렬 시작 가능!)
3. 개발자 C: 사용자 스토리 3 (T028-T038) - 성능 최적화 (US1 & US2 필요)
4. 팀: 함께 마무리 단계 (T039-T050)

---

## 사용자 스토리별 작업 분류

### 사용자 스토리 1 (P1): 부드러운 콘텐츠 등장 - 11개 작업

- 테스트: 3개 작업 (T007-T009)
- 구현: 8개 작업 (T010-T017)
- **MVP로 전달 가능**: 예 ✅

### 사용자 스토리 2 (P2): 점진적 이미지 로딩 - 10개 작업

- 테스트: 3개 작업 (T018-T020)
- 구현: 7개 작업 (T021-T027)
- **독립적으로 전달 가능**: 예 ✅

### 사용자 스토리 3 (P3): 성능 최적화 스크롤링 - 11개 작업

- 테스트: 3개 작업 (T028-T030)
- 구현: 8개 작업 (T031-T038)
- **독립적으로 전달 가능**: 아니오 ⚠️ (테스트를 위해 US1 & US2 필요)

### 총 작업: 50개

- 설정: 3개 작업
- 기반: 3개 작업
- 사용자 스토리: 32개 작업
- 마무리: 12개 작업

---

## 참고

- [P] 작업 = 다른 파일, 의존성 없음, 병렬 실행 가능
- [Story] 라벨은 추적성을 위해 작업을 특정 사용자 스토리에 매핑
- 각 사용자 스토리는 독립적으로 완료하고 테스트 가능해야 함 (US1과 US2는 완전히 독립적)
- 구현 전에 테스트 실패 확인 (TDD 접근법)
- 각 작업 또는 논리적 그룹 후 커밋
- 스토리를 독립적으로 검증하기 위해 모든 체크포인트에서 중지
- 컨스티튜션 요구사항: Playwright E2E 테스트 ✅, 3명 사용자와 수동 테스트 ✅, 타입 안전성 ✅
- 외부 의존성 없음 - 네이티브 브라우저 API만 사용 ✅
- 성능 목표: 60fps, CLS ≤ 0.1, LCP ≤ 2.5s ✅

---

## 형식 검증

✅ 모든 작업이 체크리스트 형식 준수: `- [ ] [TaskID] [P?] [Story?] 파일 경로가 포함된 설명`
✅ 모든 사용자 스토리 작업에 [US1], [US2], 또는 [US3] 라벨 포함
✅ 모든 작업에 구현을 위한 구체적인 파일 경로 포함
✅ 순차적 작업 ID (T001-T050)
✅ 병렬 기회가 [P]로 표시됨
✅ 컨스티튜션 요구사항에 따라 테스트 포함
✅ 각 사용자 스토리에 대한 독립 테스트 기준 정의됨
