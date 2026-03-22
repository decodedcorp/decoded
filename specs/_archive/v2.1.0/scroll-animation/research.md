# 0단계: 리서치 - 스크롤 애니메이션 & 레이지 로딩 시스템

**기능**: 001-scroll-animation
**날짜**: 2025-11-20
**상태**: 완료

## 개요

이 문서는 IntersectionObserver API, GPU 가속 애니메이션, 점진적 이미지 로딩 기술을 사용하여 성능 최적화된 스크롤 애니메이션 및 레이지 로딩 시스템 구현을 위한 리서치 결과를 통합합니다.

## 기술 결정

### 1. IntersectionObserver API

**결정**: 뷰포트 감지를 위해 네이티브 IntersectionObserver API 사용

**근거**:

- 광범위한 지원을 가진 네이티브 브라우저 API (Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+)
- 무의존성 - 외부 라이브러리 불필요
- 뛰어난 성능 - 브라우저의 컴포지터에서 메인 스레드 외부에서 실행
- 내장된 스로틀링 및 디바운싱 메커니즘
- 스크롤 이벤트 리스너 대비 낮은 메모리 사용량
- DOM에서 요소 제거 시 자동 정리

**고려한 대안들**:

- **스크롤 이벤트 리스너**: 메인 스레드 블로킹, 수동 스로틀링 필요, 성능 저하로 기각
- **React Intersection Observer 라이브러리** (예: react-intersection-observer): 의존성 최소화 및 번들 크기 감소를 위해 기각
- **애니메이션 라이브러리** (예: Framer Motion, GSAP): 단순한 opacity/transform 애니메이션에 불필요한 오버헤드와 기능으로 인해 기각

**브라우저 호환성**:

- 최신 브라우저: 네이티브 지원
- 구형 브라우저: 이미지 전용 네이티브 `loading="lazy"`로 점진적 향상
- 폴리필 불필요 - 핵심 기능이 아닌 기능 향상

**참조**:

- MDN Web Docs: IntersectionObserver API
- Can I Use: IntersectionObserver 브라우저 지원 (전 세계 96.47% 커버리지)

---

### 2. GPU 가속 애니메이션 속성

**결정**: 애니메이션에 `opacity`와 `transform` CSS 속성만 사용

**근거**:

- GPU 가속 속성은 레이아웃 및 페인트 단계를 건너뜀
- 컴포지터 스레드에서 실행 - 메인 스레드 블로킹 없음
- 중급 기기에서도 일관된 60fps 성능
- 최소한의 리플로우/리페인트 오버헤드
- Web Performance Working Group의 부드러운 애니메이션 모범 사례

**고려한 대안들**:

- **Top/Left 포지셔닝**: 매 프레임마다 레이아웃 재계산 발생으로 기각
- **Width/Height 애니메이션**: 레이아웃 스래싱 및 CLS 문제 발생으로 기각
- **Color/Background 애니메이션**: 페인트 연산 발생으로 기각

**성능 영향**:

- 레이아웃 속성: 프레임당 ~10-30ms (프레임 드롭 발생)
- GPU 속성: 프레임당 <1ms (60fps 유지)
- 모바일 기기: GPU 속성으로 3-5배 성능 향상

**참조**:

- Google Web Fundamentals: 렌더링 성능
- Paul Irish: "What forces layout/reflow"
- CSS Triggers: csstriggers.com

---

### 3. 애니메이션 타이밍 및 이징

**결정**: 320-420ms 지속 시간과 함께 `cubic-bezier(0.22, 1, 0.36, 1)` 사용

**근거**:

- Cubic-bezier는 약간의 오버슈트가 있는 자연스러운 이징 생성 (out-back 계열)
- 빠른 가속 후 부드러운 감속으로 반응성 있는 느낌
- 320-420ms 지속 시간이 최적: 빠르면서도 부드럽게 인지됨
- Material Design 모션 가이드라인과 일치 (대형 화면 움직임에 250-500ms)
- 빠른 스크롤 중 애니메이션 피로 방지

**고려한 대안들**:

- **Linear 이징**: 기계적이고 부자연스러운 느낌으로 기각
- **Ease-in-out**: 너무 대칭적, 개성 부족으로 기각
- **긴 지속 시간 (500ms+)**: 특히 여러 카드가 애니메이션될 때 느린 느낌으로 기각
- **짧은 지속 시간 (<300ms)**: 낮은 주사율 디스플레이에서 인지하기 어려울 정도로 급격하여 기각

**타이밍 분석**:

- 0-150ms: 빠른 가속 (움직임의 80%)
- 150-380ms: 미세한 오버슈트와 함께 부드러운 감속
- 총: 320-420ms (data-delay를 통해 요소별 조정 가능)

**참조**:

- Material Design: 모션 지속 시간 및 이징
- Robert Penner의 이징 함수
- cubic-bezier.com 시각화 도구

---

### 4. 시차 애니메이션 패턴

**결정**: CSS 사용자 정의 속성 (`--stagger`)과 함께 `data-delay` 속성 사용

**근거**:

- 선언적 접근 - 디자이너가 JavaScript 지식 없이 타이밍 제어 가능
- CSS 사용자 정의 속성으로 인라인 스타일 오염 방지
- 중앙집중식 애니메이션 로직을 유지하면서 요소별 커스터마이징 가능
- 일반적인 시차: 요소당 40-80ms로 자연스러운 캐스케이딩 효과 생성
- 요소 수에 관계없이 확장 가능

**구현 패턴**:

```javascript
element.style.setProperty("--stagger", `${element.dataset.delay || 0}ms`);
```

**고려한 대안들**:

- **JavaScript 기반 지연**: 관리 어려움, 인라인 스타일 오염으로 기각
- **nth-child를 통한 고정 지연**: 유연성 부족, DOM 변경 시 재계산 필요로 기각
- **애니메이션 라이브러리 시차**: 불필요한 의존성 추가로 기각

**시차 타이밍 가이드라인**:

- 2-5개 요소: 요소당 60-80ms
- 6-10개 요소: 요소당 40-60ms
- 10개 이상 요소: 요소당 20-40ms (총 캐스케이드 시간이 1초를 초과하지 않도록)

---

### 5. 레이지 로딩 전략

**결정**: `data-src` + 네이티브 `loading="lazy"`를 통한 점진적 향상

**근거**:

- **data-src 교체**: IntersectionObserver를 통한 로드 타이밍 완전 제어
- **loading="lazy"**: JS 비활성화 시나리오를 위한 브라우저 네이티브 폴백
- **점진적 향상**: 모든 시나리오에서 작동 (JS 활성화, JS 비활성화, 구형 브라우저)
- **양쪽의 장점**: 세밀한 제어 + 자동 브라우저 최적화

**로딩 시퀀스**:

1. 이미지 요소가 `data-src` 속성으로 렌더링 (실제 이미지 미로드)
2. IntersectionObserver가 요소가 임계값에 진입함을 감지
3. JavaScript가 `data-src` → `src` 교체 (브라우저 로드 트리거)
4. 로드됨으로 표시 (`data-loaded="true"`)하여 중복 로드 방지
5. 브라우저가 캐싱, 디코딩, 렌더링 처리

**고려한 대안들**:

- **네이티브 loading="lazy"만 사용**: 임계값 제어 불가, 브라우저별 일관성 없는 동작으로 기각
- **JavaScript 전용 레이지 로딩**: JS 비활성화 시나리오 대응 불가로 기각
- **Intersection Observer 라이브러리**: 단순한 사용 사례에 불필요한 의존성으로 기각
- **플레이스홀더 이미지**: 향후 개선으로 연기 (blur-up, LQIP는 범위 외)

**참조**:

- MDN: HTMLImageElement.loading
- Web.dev: 브라우저 수준 이미지 레이지 로딩

---

### 6. 관찰 임계값 설정

**결정**: `rootMargin: "0px 0px -10% 0px"`와 함께 `threshold: 0.15`

**근거**:

- **15% 임계값**: 요소의 15%가 보일 때 트리거 - 부드러운 로드에 충분히 이르고, 잘못된 트리거를 피할 만큼 늦음
- **-10% 하단 마진**: 요소가 뷰포트 하단에 도달하기 10% 전에 "트리거 존" 생성
- **결과**: 사용자가 스크롤하기 ~200-400px 전에 이미지 로딩 시작 (뷰포트 높이에 따라 다름)
- **인지되는 로드 시간 감소**: 사용자가 도달했을 때 이미지가 준비되어 있음

**고려한 대안들**:

- **threshold: 0.0**: 너무 일찍 트리거되어 사용자가 도달하지 않을 수 있는 요소에 대역폭 낭비로 기각
- **threshold: 0.5**: 너무 늦게 트리거되어 사용자가 로딩 스피너를 보게 됨으로 기각
- **rootMargin 없음**: 애니메이션이 예측적으로 느껴지지 않아 기각
- **더 큰 rootMargin (-20%)**: 불필요한 대역폭 사용 증가로 기각

**성능 트레이드오프**:

- 너무 이름: 대역폭 낭비, 동시 요청 증가
- 너무 늦음: 눈에 보이는 로딩 상태, 인지되는 끊김
- 최적점: 10-15% 가시성 + 10% rootMargin 오프셋

---

### 7. 성능 최적화 기법

**결정**: 다층 최적화 전략

**기법들**:

1. **will-change 힌트**: 관찰되는 요소에만 `will-change: opacity, transform` 적용
   - 컴포지터에 레이어 준비 신호
   - 첫 페인트 성능 향상
   - 애니메이션 요소에만 적용해야 함 (과용 시 메모리 문제 발생)

2. **O(1) 콜백 복잡도**: Observer 콜백은 클래스 토글과 속성 설정만 수행
   - DOM 측정 없음 (offsetWidth, getBoundingClientRect)
   - 레이아웃 쿼리 없음 (getComputedStyle)
   - 복잡한 계산 없음
   - 결과: 콜백 실행당 <0.5ms

3. **레이아웃 안정성**: width/height 또는 aspect-ratio를 통한 이미지 고정 치수
   - Cumulative Layout Shift (CLS) 방지
   - 브라우저가 이미지 로드 전에 공간 예약
   - 목표: CLS ≤ 0.1

4. **히어로 이미지용 리소스 힌트**:
   - 스크롤 없이 보이는 이미지 프리로드
   - `fetchpriority="high"` 또는 `<link rel="preload">` 사용
   - LCP (Largest Contentful Paint) 최적화
   - 목표: LCP ≤ 2.5s

**모니터링 전략**:

- Chrome DevTools Performance 패널로 측정
- 프로덕션에서 Core Web Vitals 추적
- 회귀 감지를 위한 Lighthouse 감사

**참조**:

- Web.dev: Core Web Vitals
- MDN: CSS will-change 속성
- Chrome DevTools: 성능 프로파일링

---

### 8. React 훅 아키텍처

**결정**: 모든 로직을 캡슐화하는 단일 `useScrollAnimation` 훅

**훅 인터페이스**:

```typescript
interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  onEnter?: (element: Element) => void;
  onExit?: (element: Element) => void;
}

function useScrollAnimation(options?: UseScrollAnimationOptions): {
  observeRef: RefCallback<Element>;
};
```

**근거**:

- **단일 책임**: 훅은 IntersectionObserver 라이프사이클만 관리
- **Ref 콜백 패턴**: 동적 요소 관찰 허용
- **설정 가능**: 엣지 케이스를 위한 threshold/rootMargin 오버라이드 수용
- **라이프사이클 관리**: 언마운트 시 자동 정리
- **타입 안전**: 완전한 TypeScript 지원

**고려한 대안들**:

- **다중 훅**: 불필요한 복잡성, 유지보수 어려움으로 기각
- **HOC 패턴**: 구식 React 패턴, ref 포워딩 복잡성으로 기각
- **Context 기반**: 단순한 뷰포트 감지에 과함으로 기각
- **명령형 API**: React 관용구에 맞지 않음, 수동 정리 필요로 기각

**통합 패턴**:

```tsx
// 사용 예시
function AnimatedCard() {
  const { observeRef } = useScrollAnimation();

  return (
    <div ref={observeRef} className="js-observe" data-delay="80">
      {/* 카드 콘텐츠 */}
    </div>
  );
}
```

---

### 9. CSS 아키텍처

**결정**: 애니메이션 상태용 Tailwind 유틸리티 클래스 + CSS 사용자 정의 속성

**CSS 구조**:

```css
/* 초기 상태 */
.js-observe {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--stagger, 0ms);
  will-change: opacity, transform;
}

/* 표시 상태 */
.js-observe.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 숨김 상태 (종료) */
.js-observe.is-hidden {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
```

**근거**:

- **Tailwind 유틸리티**: 유틸리티 클래스를 통한 주요 스타일링
- **사용자 정의 속성**: `--stagger`를 통한 동적 타이밍 값
- **클래스 기반 상태**: `.is-visible/.is-hidden`을 통한 선언적 상태 관리
- **인라인 스타일 없음**: 동적 `--stagger` 값 제외
- **유지보수 용이**: 모든 애니메이션 설정이 한 곳에

**고려한 대안들**:

- **인라인 스타일만**: 유지보수 어려움, CSS 캐스케이드 이점 없음으로 기각
- **CSS-in-JS**: 정적 애니메이션에 불필요한 런타임 오버헤드로 기각
- **Tailwind JIT만**: 동적 값을 위한 CSS 사용자 정의 속성 필요로 기각

---

### 10. 테스트 전략

**결정**: 다층 테스트 접근법

**테스트 레이어**:

1. **Playwright E2E 테스트**:
   - 시각적 회귀: 애니메이션 상태에 대한 스크린샷 비교
   - 성능: Core Web Vitals 측정 (CLS, LCP)
   - 동작: 클래스 토글, 이미지 로딩 시퀀스 검증
   - 크로스 브라우저: Chrome, Firefox, Safari, Edge

2. **수동 테스트**:
   - 시각적 부드러움: 최소 3명 사용자
   - 애니메이션 느낌: 타이밍, 이징 인지
   - 기기 테스트: 데스크톱, 태블릿, 모바일
   - 네트워크 조건: 3G, 4G, WiFi

3. **성능 모니터링**:
   - Chrome DevTools: 프레임 레이트, 페인트 연산
   - Lighthouse: 자동화된 성능 감사
   - Real User Monitoring: 프로덕션 메트릭

**테스트 시나리오**:

- 아래로 스크롤: 카드가 시차를 두고 애니메이션됨
- 위로 스크롤: 카드가 재진입 시 다시 애니메이션됨
- 빠른 스크롤: 성능 저하 없음
- 느린 스크롤: 부드러운 전환 유지
- 이미지 로딩: 레이아웃 시프트 없음, 순차적 로딩
- 뷰포트 리사이즈: IntersectionObserver가 올바르게 재계산

---

## 구현 체크리스트

- [ ] `lib/hooks/useScrollAnimation.ts` 훅 생성
- [ ] TypeScript 인터페이스 및 타입 추가
- [ ] 라이프사이클 관리가 포함된 IntersectionObserver 로직 구현
- [ ] CSS 클래스 추가 (`.js-observe`, `.is-visible`, `.is-hidden`)
- [ ] 애니메이션 유틸리티용 Tailwind 설정
- [ ] Playwright E2E 테스트 스위트 생성
- [ ] 문서에 사용 예시 추가
- [ ] 성능 프로파일링 및 최적화
- [ ] 크로스 브라우저 테스트
- [ ] 수동 사용자 테스트 (최소 3명 사용자)

---

## 미해결 질문

없음 - 모든 기술 결정이 해결됨. 1단계로 구현 진행 가능.

---

## 참조

### 웹 표준

- [MDN: IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: HTMLImageElement.loading](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading)
- [W3C: Intersection Observer Specification](https://www.w3.org/TR/intersection-observer/)

### 성능

- [Web.dev: Core Web Vitals](https://web.dev/vitals/)
- [Web.dev: 브라우저 수준 이미지 레이지 로딩](https://web.dev/browser-level-image-lazy-loading/)
- [Google: 렌더링 성능](https://developers.google.com/web/fundamentals/performance/rendering)
- [CSS Triggers](https://csstriggers.com/)

### 애니메이션

- [Material Design: 모션](https://m3.material.io/styles/motion/overview)
- [cubic-bezier.com](https://cubic-bezier.com/)
- [Robert Penner의 이징 함수](http://robertpenner.com/easing/)

### 브라우저 호환성

- [Can I Use: IntersectionObserver](https://caniuse.com/intersectionobserver)
- [Can I Use: loading 속성](https://caniuse.com/loading-lazy-attr)

### React 패턴

- [React Docs: Hooks](https://react.dev/reference/react/hooks)
- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [React Docs: useRef](https://react.dev/reference/react/useRef)
