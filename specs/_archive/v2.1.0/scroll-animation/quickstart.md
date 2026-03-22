# 퀵스타트 가이드: 스크롤 애니메이션 & 레이지 로딩 시스템

**기능**: 001-scroll-animation
**최종 업데이트**: 2025-11-20

## 개요

이 가이드는 Next.js 애플리케이션에서 스크롤 애니메이션 및 레이지 로딩 시스템을 구현하고 사용하기 위한 단계별 지침을 제공합니다.

## 사전 요구사항

- Next.js 14.2.0+
- React 18.3.0+
- TypeScript 5.3.3+
- Tailwind CSS 3.4.1+
- IntersectionObserver를 지원하는 최신 브라우저

## 5분 퀵 스타트

### 1단계: 설치 (의존성 불필요)

이 기능은 네이티브 브라우저 API를 사용합니다 - npm 패키지가 필요 없습니다! 훅 파일만 생성하면 됩니다.

### 2단계: 훅 생성

`lib/hooks/useScrollAnimation.ts` 생성:

```typescript
import { useEffect, useRef, useCallback } from "react";

export interface UseScrollAnimationOptions {
  threshold?: number | number[];
  rootMargin?: string;
  onEnter?: (element: Element) => void;
  onExit?: (element: Element) => void;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -10% 0px",
    onEnter,
    onExit,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;

          // data 속성에서 시차 지연 설정
          const delay = element.getAttribute("data-delay") || "0";
          element.style.setProperty("--stagger", `${delay}ms`);

          if (entry.isIntersecting) {
            // 이미지 레이지 로딩 처리
            const img = element.querySelector("img[data-src]");
            if (img && !img.getAttribute("data-loaded")) {
              const src = img.getAttribute("data-src");
              if (src) {
                img.setAttribute("src", src);
                img.setAttribute("data-loaded", "true");
              }
            }

            // 애니메이션 클래스 토글
            element.classList.add("is-visible");
            element.classList.remove("is-hidden");
            onEnter?.(element);
          } else {
            element.classList.add("is-hidden");
            element.classList.remove("is-visible");
            onExit?.(element);
          }
        });
      },
      { threshold, rootMargin }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, onEnter, onExit]);

  const observeRef = useCallback((element: Element | null) => {
    if (element) {
      observerRef.current?.observe(element);
    }
  }, []);

  return { observeRef };
}
```

### 3단계: CSS 클래스 추가

전역 CSS 또는 Tailwind 설정에 추가:

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

/* 숨김 상태 */
.js-observe.is-hidden {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
```

### 4단계: 컴포넌트에서 사용

```tsx
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

export default function MyPage() {
  const { observeRef } = useScrollAnimation();

  return (
    <div>
      <h1>내 콘텐츠</h1>

      {/* 시차가 있는 애니메이션 카드 */}
      <div ref={observeRef} className="js-observe" data-delay="0">
        <h2>카드 1</h2>
        <p>이 카드는 스크롤로 뷰에 들어올 때 페이드인됩니다</p>
      </div>

      <div ref={observeRef} className="js-observe" data-delay="80">
        <h2>카드 2</h2>
        <p>이 카드는 카드 1보다 80ms 후에 페이드인됩니다</p>
      </div>

      {/* 레이지 로드 이미지가 있는 카드 */}
      <div ref={observeRef} className="js-observe" data-delay="160">
        <img
          data-src="/images/photo.jpg"
          loading="lazy"
          width="400"
          height="300"
          alt="설명 텍스트"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
```

### 5단계: 테스트하기!

```bash
yarn dev
```

브라우저를 열고 아래로 스크롤하세요 - 카드들이 애니메이션되는 것을 확인할 수 있습니다!

---

## 일반적인 사용 사례

### 기본 카드 애니메이션

```tsx
function AnimatedCard({ title, children, delay = 0 }) {
  const { observeRef } = useScrollAnimation();

  return (
    <div
      ref={observeRef}
      className="js-observe rounded-lg shadow-lg p-6"
      data-delay={delay}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      {children}
    </div>
  );
}
```

### 시차가 있는 카드 그리드

```tsx
function CardGrid({ items }) {
  const { observeRef } = useScrollAnimation();

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={observeRef}
          className="js-observe"
          data-delay={index * 40} // 카드당 40ms 시차
        >
          <img
            data-src={item.imageUrl}
            loading="lazy"
            width="300"
            height="200"
            alt={item.title}
          />
          <h3>{item.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

### 콜백 사용

```tsx
function TrackedAnimation() {
  const { observeRef } = useScrollAnimation({
    onEnter: (el) => {
      console.log("요소 진입:", el);
      // 분석 추적
    },
    onExit: (el) => {
      console.log("요소 종료:", el);
    },
  });

  return (
    <div ref={observeRef} className="js-observe">
      추적이 있는 콘텐츠
    </div>
  );
}
```

### 커스텀 임계값

```tsx
function EarlyAnimation() {
  const { observeRef } = useScrollAnimation({
    threshold: 0.25, // 25% 가시성에서 트리거
    rootMargin: "0px 0px -20% 0px", // 더 일찍 트리거
  });

  return (
    <div ref={observeRef} className="js-observe">
      더 일찍 애니메이션됨
    </div>
  );
}
```

---

## Tailwind 통합

### 옵션 1: 전역 CSS

`app/globals.css`에 CSS 클래스 추가:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 스크롤 애니메이션 클래스 */
.js-observe {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--stagger, 0ms);
  will-change: opacity, transform;
}

.js-observe.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.js-observe.is-hidden {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
```

### 옵션 2: Tailwind 유틸리티 (향후 개선)

`tailwind.config.ts`에서 커스텀 유틸리티 생성:

```typescript
// 향후 개선 - Tailwind 플러그인 필요
export default {
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".animate-scroll": {
          opacity: "0",
          transform: "translateY(12px) scale(0.98)",
          transition:
            "opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1), transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
          transitionDelay: "var(--stagger, 0ms)",
          willChange: "opacity, transform",
        },
      });
    },
  ],
};
```

---

## 성능 팁

### ✅ 해야 할 것

- **이미지 치수 설정**: CLS 방지를 위해 항상 `width`와 `height` 지정
- **스크롤 없이 보이는 영역 최적화**: 히어로 이미지에 `loading="eager"` 추가
- **시차 제한**: 총 캐스케이드 시간을 1초 미만으로 유지
- **모바일 테스트**: 중급 기기에서 60fps 확인

```tsx
// 좋음 - 치수 지정됨
<img
  data-src="/image.jpg"
  loading="lazy"
  width="400"
  height="300"
  alt="설명"
/>

// 좋음 - 히어로 이미지 최적화
<img
  src="/hero.jpg"
  loading="eager"
  fetchpriority="high"
  width="1200"
  height="600"
  alt="히어로 이미지"
/>
```

### ❌ 하지 말아야 할 것

- **레이아웃 속성 애니메이션 금지**: opacity와 transform만 사용
- **콜백에서 DOM 쿼리 금지**: observer 콜백을 O(1)로 유지
- **will-change 과용 금지**: `.js-observe` 요소에만 사용
- **1초 이상 시차 금지**: 인지되는 느림 방지

```tsx
// 나쁨 - 레이아웃 스래싱 발생
<div className="animate-width"> ❌

// 나쁨 - 시차가 너무 김
data-delay="2000" ❌

// 좋음 - GPU 가속만
<div className="js-observe"> ✅
```

---

## 문제 해결

### 애니메이션이 작동하지 않음

**문제**: 카드가 애니메이션되지 않음
**해결**: 전역 CSS에 CSS 클래스가 임포트되었는지 확인

```tsx
// app/layout.tsx 또는 app/globals.css에 있어야 함
import "./globals.css";
```

### 이미지가 로드되지 않음

**문제**: 이미지가 data-src 상태로 유지됨
**해결**: 이미지 선택자와 속성 확인

```tsx
// 올바른 구조
<img
  data-src="/path.jpg" // ✅ src가 아닌 data-src
  loading="lazy" // ✅ 폴백
  className="lazy" // ✅ 선택적이지만 권장
/>
```

### 성능 문제

**문제**: 스크롤이 버벅거림
**해결**: GPU가 아닌 속성 확인

```bash
# Chrome DevTools > Performance 열기
# 스크롤 세션 녹화
# 타임라인에서 "Recalculate Style" 또는 "Layout" 찾기
# "Composite Layers"만 보여야 함
```

### TypeScript 오류

**문제**: useScrollAnimation 타입 오류
**해결**: 타입이 내보내졌는지 확인

```typescript
// lib/hooks/useScrollAnimation.ts에서
export interface UseScrollAnimationOptions { ... }
export function useScrollAnimation(...) { ... }
```

---

## 테스트

### 수동 테스트 체크리스트

- [ ] 스크롤로 뷰에 들어올 때 카드 애니메이션
- [ ] 여러 카드에서 시차 효과 확인
- [ ] 뷰포트 근처에서만 이미지 로드
- [ ] 이미지 로드 시 레이아웃 시프트 없음
- [ ] 부드러운 60fps 애니메이션
- [ ] 모바일 기기에서 작동
- [ ] 위로 스크롤 후 아래로 스크롤 시 애니메이션 재생
- [ ] 콘솔에 JavaScript 오류 없음

### Playwright E2E 테스트 (예정)

```typescript
// __tests__/e2e/scroll-animation.spec.ts
import { test, expect } from "@playwright/test";

test("스크롤 시 카드 애니메이션", async ({ page }) => {
  await page.goto("/");

  // 스크롤하여 애니메이션 트리거
  await page.evaluate(() => window.scrollBy(0, 500));

  // 애니메이션 대기
  await page.waitForTimeout(500);

  // 클래스가 추가되었는지 확인
  const card = page.locator(".js-observe").first();
  await expect(card).toHaveClass(/is-visible/);
});
```

---

## 브라우저 지원

| 브라우저 | 버전 | 지원 |
| ------- | ------- | ----------------------------------------------------------------- |
| Chrome  | 51+     | ✅ 완전 |
| Firefox | 55+     | ✅ 완전 |
| Safari  | 12.1+   | ✅ 완전 |
| Edge    | 15+     | ✅ 완전 |
| IE 11   | -       | ⚠️ 점진적 향상 (애니메이션 없음, 네이티브 레이지 로딩만) |

**점진적 향상**: IntersectionObserver가 없는 구형 브라우저에서:

- 이미지는 네이티브 `loading="lazy"` 사용 (지원되는 경우)
- 콘텐츠가 즉시 표시됨 (애니메이션 없음)
- JavaScript 오류 없음

---

## 다음 단계

- [ ] `lib/hooks/useScrollAnimation.ts`에 훅 구현
- [ ] `app/globals.css`에 CSS 클래스 추가
- [ ] 기능을 시연하는 예시 페이지 생성
- [ ] Playwright E2E 테스트 작성
- [ ] Chrome DevTools로 성능 프로파일링
- [ ] 크로스 브라우저 테스트
- [ ] 3명 이상 사용자와 사용자 테스트

---

## 리소스

- [IntersectionObserver MDN 문서](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js 이미지 최적화](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [리서치 문서](./research.md) - 전체 기술 리서치 및 결정
- [데이터 모델](./data-model.md) - TypeScript 인터페이스 및 타입 정의

---

## 지원

문제나 질문이 있으면:

1. [research.md](./research.md)에서 기술 세부사항 확인
2. [data-model.md](./data-model.md)에서 타입 정의 검토
3. 프로젝트 저장소에 이슈 열기
4. `001-scroll-animation` 라벨 태그
