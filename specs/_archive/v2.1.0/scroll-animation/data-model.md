# 1단계: 데이터 모델 - 스크롤 애니메이션 & 레이지 로딩 시스템

**기능**: 001-scroll-animation
**날짜**: 2025-11-20
**상태**: 완료

## 개요

이 기능은 최소한의 데이터 모델링 요구사항을 가진 UI 애니메이션 시스템입니다. 데이터 모델은 영구 데이터 구조보다 훅 설정, 요소 상태, 콜백 시그니처를 위한 TypeScript 인터페이스에 초점을 맞춥니다.

## 타입 정의

### 1. 애니메이션 설정

**인터페이스**: `UseScrollAnimationOptions`

**목적**: `useScrollAnimation` 훅의 설정 옵션

```typescript
interface UseScrollAnimationOptions {
  /**
   * observer 콜백이 발생하는 임계값 (0.0 ~ 1.0)
   * @default 0.15 (15% 가시성)
   */
  threshold?: number | number[];

  /**
   * 조기/지연 트리거를 위한 root 요소 주변 마진
   * @default "0px 0px -10% 0px"
   */
  rootMargin?: string;

  /**
   * intersection 관찰을 위한 root 요소
   * @default null (뷰포트)
   */
  root?: Element | null;

  /**
   * 요소가 뷰포트에 진입할 때 발생하는 콜백
   */
  onEnter?: (element: Element, entry: IntersectionObserverEntry) => void;

  /**
   * 요소가 뷰포트에서 나갈 때 발생하는 콜백
   */
  onExit?: (element: Element, entry: IntersectionObserverEntry) => void;

  /**
   * 레이지 이미지 로딩 활성화/비활성화
   * @default true
   */
  enableLazyLoad?: boolean;

  /**
   * 애니메이션 클래스 활성화/비활성화
   * @default true
   */
  enableAnimation?: boolean;
}
```

**검증 규칙**:

- `threshold`: 0.0과 1.0 사이 (포함)여야 함, 또는 해당 값들의 배열
- `rootMargin`: 유효한 CSS margin 문자열이어야 함 (예: "0px 0px -10% 0px")
- `root`: 유효한 DOM Element 또는 null이어야 함
- 콜백은 잡히지 않는 에러를 발생시키면 안 됨

**기본값**:

- `threshold: 0.15`
- `rootMargin: "0px 0px -10% 0px"`
- `root: null` (뷰포트)
- `enableLazyLoad: true`
- `enableAnimation: true`

---

### 2. 훅 반환값

**인터페이스**: `UseScrollAnimationReturn`

**목적**: `useScrollAnimation` 훅의 반환값

```typescript
interface UseScrollAnimationReturn {
  /**
   * 관찰 가능한 요소에 연결할 Ref 콜백
   */
  observeRef: (element: Element | null) => void;

  /**
   * 요소의 관찰을 수동으로 트리거
   */
  observe: (element: Element) => void;

  /**
   * 요소의 관찰을 수동으로 중지
   */
  unobserve: (element: Element) => void;

  /**
   * 모든 관찰 연결 해제
   */
  disconnect: () => void;

  /**
   * 요소가 현재 관찰되고 있는지 확인
   */
  isObserving: (element: Element) => boolean;
}
```

**사용 패턴**:

```typescript
const { observeRef, disconnect } = useScrollAnimation({
  threshold: 0.15,
  onEnter: (el) => console.log('요소 진입:', el)
})

// ref를 통해 연결
<div ref={observeRef} className="js-observe">...</div>

// 수동 정리 (선택적 - 언마운트 시 자동 정리)
useEffect(() => {
  return () => disconnect()
}, [disconnect])
```

---

### 3. 요소 상태

**인터페이스**: `AnimationState` (내부)

**목적**: 각 관찰 요소의 애니메이션 상태 추적

```typescript
interface AnimationState {
  /**
   * 관찰되는 DOM 요소
   */
  element: Element;

  /**
   * 현재 가시성 상태
   */
  isVisible: boolean;

  /**
   * 이미지가 로드되었는지 여부 (요소에 레이지 이미지가 포함된 경우)
   */
  imageLoaded: boolean;

  /**
   * data-delay 속성에서 추출한 시차 지연
   */
  staggerDelay: number;

  /**
   * 이 요소의 IntersectionObserver entry
   */
  entry: IntersectionObserverEntry | null;
}
```

**상태 전이**:

- 초기: `isVisible: false, imageLoaded: false`
- 진입 시: `isVisible: true`, 필요시 이미지 로드 트리거
- 종료 시: `isVisible: false`
- 이미지 로드됨: `imageLoaded: true` (영구적)

**상태 관리**:

- 자동 가비지 컬렉션을 위해 WeakMap에 저장
- DOM에서 요소 제거 시 수동 정리 불필요

---

### 4. 레이지 이미지 설정

**인터페이스**: `LazyImageConfig` (내부)

**목적**: 레이지 이미지 로딩 동작 설정

```typescript
interface LazyImageConfig {
  /**
   * 이미지 소스용 속성명
   * @default "data-src"
   */
  sourceAttribute: string;

  /**
   * 로드됨 상태를 표시할 속성명
   * @default "data-loaded"
   */
  loadedAttribute: string;

  /**
   * 관찰 요소 내 레이지 이미지용 CSS 선택자
   * @default ".lazy, img[data-src]"
   */
  imageSelector: string;

  /**
   * 네이티브 loading="lazy"를 폴백으로 사용할지 여부
   * @default true
   */
  useNativeLazy: boolean;
}
```

**기본 설정**:

```typescript
const DEFAULT_LAZY_CONFIG: LazyImageConfig = {
  sourceAttribute: "data-src",
  loadedAttribute: "data-loaded",
  imageSelector: ".lazy, img[data-src]",
  useNativeLazy: true,
};
```

---

### 5. 애니메이션 타이밍

**인터페이스**: `AnimationTimingConfig` (내부)

**목적**: CSS 애니메이션 타이밍 설정

```typescript
interface AnimationTimingConfig {
  /**
   * 애니메이션 지속 시간 (밀리초)
   * @default 380
   */
  duration: number;

  /**
   * CSS cubic-bezier 이징 함수
   * @default "cubic-bezier(0.22, 1, 0.36, 1)"
   */
  easing: string;

  /**
   * 기본 시차 지연 (밀리초)
   * @default 0
   */
  baseStagger: number;

  /**
   * 과도하게 긴 캐스케이드 방지를 위한 최대 시차 지연
   * @default 1000
   */
  maxStagger: number;

  /**
   * 초기 transform 오프셋
   * @default "translateY(12px) scale(0.98)"
   */
  initialTransform: string;

  /**
   * 초기 opacity
   * @default 0
   */
  initialOpacity: number;
}
```

**기본 설정**:

```typescript
const DEFAULT_TIMING: AnimationTimingConfig = {
  duration: 380,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  baseStagger: 0,
  maxStagger: 1000,
  initialTransform: "translateY(12px) scale(0.98)",
  initialOpacity: 0,
};
```

---

## HTML 속성

### 관찰 가능한 요소 속성

**요소**: 스크롤 애니메이션을 위해 관찰될 모든 요소

```html
<div class="js-observe" data-delay="80" role="listitem" aria-label="카드 제목">
  <!-- 콘텐츠 -->
</div>
```

**속성**:

- `class="js-observe"`: IntersectionObserver 대상을 위한 마커 클래스
- `data-delay="80"`: 밀리초 단위 시차 지연 (선택적, 기본값: 0)
- 표준 접근성 속성 (`role`, `aria-label` 등)

---

### 레이지 이미지 속성

**요소**: 레이지 로딩이 적용되는 이미지 요소

```html
<img
  class="lazy"
  data-src="/path/to/image.jpg"
  data-loaded="false"
  loading="lazy"
  width="400"
  height="300"
  alt="설명 텍스트"
  decoding="async"
/>
```

**속성**:

- `class="lazy"`: 레이지 이미지를 위한 마커 클래스
- `data-src`: 실제 이미지 URL (intersection 시 로드)
- `data-loaded`: 로딩 상태 (로드 후 "true", 재로드 방지)
- `loading="lazy"`: 네이티브 브라우저 레이지 로딩 (폴백)
- `width` & `height`: 레이아웃 안정성을 위해 필수 (CLS 방지)
- `alt`: 접근성을 위해 필수
- `decoding="async"`: 초기 페이지 로드 성능 향상

---

## CSS 사용자 정의 속성

### 애니메이션 변수

**요소**: 애니메이션이 적용되는 관찰 가능한 요소

```css
.js-observe {
  --stagger: 0ms; /* JavaScript를 통해 동적으로 설정 */
}
```

**사용자 정의 속성**:

- `--stagger`: 밀리초 단위 transition 지연 (`data-delay` 속성에서 설정)

**사용법**:

```javascript
element.style.setProperty("--stagger", `${element.dataset.delay || 0}ms`);
```

---

## 상태 관리

### 요소 상태 저장소

**저장소**: 자동 메모리 관리를 위한 WeakMap

```typescript
// 내부 저장소 (내보내지 않음)
const elementStates = new WeakMap<Element, AnimationState>();
```

**연산**:

```typescript
// 상태 설정
elementStates.set(element, {
  element,
  isVisible: false,
  imageLoaded: false,
  staggerDelay: 0,
  entry: null,
});

// 상태 가져오기
const state = elementStates.get(element);

// 상태 삭제 (DOM에서 요소 제거 시 자동)
// 수동 정리 불필요
```

---

## CSS 클래스 상태

### 애니메이션 상태

**클래스**: IntersectionObserver에 의해 토글되는 상태 클래스

```css
/* 초기 상태 - CSS를 통해 적용 */
.js-observe {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* 표시 상태 - JavaScript에 의해 추가 */
.js-observe.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 숨김 상태 - JavaScript에 의해 추가 */
.js-observe.is-hidden {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
```

**상태 전이**:

1. 초기: `.js-observe`만
2. 뷰포트 진입: `.is-visible` 추가, `.is-hidden` 제거
3. 뷰포트 종료: `.is-hidden` 추가, `.is-visible` 제거

---

## 검증 규칙

### 입력 검증

**훅 옵션**:

- `threshold`: 0.0 ≤ 값 ≤ 1.0
- `rootMargin`: 유효한 CSS margin 문자열 (px, %, em 단위)
- `root`: Element 또는 null이어야 함
- 콜백: 함수여야 함 (선택적)

**HTML 속성**:

- `data-delay`: 음이 아닌 정수여야 함 (밀리초)
- `data-src`: 유효한 URL 문자열이어야 함
- `width`/`height`: 양의 정수여야 함

**런타임 검사**:

```typescript
function validateOptions(options: UseScrollAnimationOptions): void {
  if (options.threshold !== undefined) {
    const thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold];

    for (const t of thresholds) {
      if (t < 0 || t > 1) {
        throw new Error(`유효하지 않은 threshold: ${t}. 0과 1 사이여야 합니다.`);
      }
    }
  }

  if (options.root !== undefined && options.root !== null) {
    if (!(options.root instanceof Element)) {
      throw new Error("유효하지 않은 root: Element 또는 null이어야 합니다.");
    }
  }
}
```

---

## 성능 고려사항

### 메모리 관리

**전략**: 요소 상태 저장에 WeakMap 사용

- 요소 제거 시 자동 가비지 컬렉션
- 고아 참조로 인한 메모리 누수 없음
- O(1) 조회 성능

**정리**:

- 컴포넌트 언마운트 시 IntersectionObserver.disconnect()
- WeakMap 항목 자동 해제
- 수동 정리 불필요

### 애니메이션 성능

**최적화 전략**:

1. **GPU 가속**: opacity와 transform만 애니메이션
2. **레이어 승격**: 관찰되는 요소에 `will-change: opacity, transform` 사용
3. **최소 콜백**: IntersectionObserver 콜백에서 O(1) 복잡도
4. **레이아웃 쿼리 없음**: 콜백에서 getBoundingClientRect, offsetWidth 회피
5. **CSS 기반**: 애니메이션이 컴포지터 스레드에서 실행

**성능 목표**:

- Observer 콜백: 실행당 <0.5ms
- 애니메이션 프레임 시간: <16.67ms (60fps)
- 총 메모리 오버헤드: 관찰 요소 100개당 <100KB

---

## 타입 내보내기

**Public API** (`lib/hooks/useScrollAnimation.ts`에서 내보냄):

```typescript
export type { UseScrollAnimationOptions, UseScrollAnimationReturn };

export { useScrollAnimation };
```

**내부 타입** (내보내지 않음):

```typescript
// AnimationState, LazyImageConfig, AnimationTimingConfig
// 구현 변경을 허용하기 위해 내부에 유지
```

---

## 브라우저 API 통합

### IntersectionObserver 설정

**생성**:

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // intersection 처리
    });
  },
  {
    threshold: options.threshold ?? 0.15,
    rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
    root: options.root ?? null,
  }
);
```

**라이프사이클**:

- 훅 인스턴스당 한 번 생성
- 여러 요소 관찰
- 컴포넌트 언마운트 시 연결 해제

---

## 영구 데이터 없음

**참고**: 이 기능은 다음을 필요로 하지 않습니다:

- 데이터베이스 저장
- 서버 측 상태
- localStorage/sessionStorage
- 쿠키
- IndexedDB

모든 상태는 일시적이며 컴포넌트 라이프사이클 동안만 존재합니다. 페이지 새로고침이나 세션 간에 데이터가 유지되지 않습니다.
