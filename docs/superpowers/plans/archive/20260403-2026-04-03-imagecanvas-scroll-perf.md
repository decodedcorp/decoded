# ImageCanvas Scroll Performance Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explore-preview 모달에서 스크롤 시 ImageCanvas 줌/스포트라이트 애니메이션이 jank 없이 60fps로 동작하게 한다.

**Architecture:** 3개 병목을 순서대로 제거: (1) `clipPath: polygon()` 11포인트 → `inset()` 4값으로 교체 (C-tier → S-tier GPU가속), (2) `gsap.to()` 매번 새 tween → `gsap.quickTo()` 재사용 가능 tween, (3) `useGSAP` dependency 기반 → `useEffect` + `useActiveSpotStore.subscribe()` 직접 구동으로 React 렌더 사이클 완전 우회.

**Tech Stack:** GSAP 3 (quickTo, ScrollTrigger) / Zustand / React 19

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/web/lib/components/detail/ImageCanvas.tsx` | Modify | 3개 병목 모두 이 파일에서 수정 |

---

## Task 1: `clipPath: polygon()` → `inset()` 교체

**Files:**
- Modify: `packages/web/lib/components/detail/ImageCanvas.tsx:215-283`

현재 spotlight overlay가 11-point polygon으로 "구멍"을 뚫어 active 아이템을 비홀드하는데, `polygon()`은 GPU 가속 불가 (main thread paint). `inset()`은 compositor thread에서 실행.

- [ ] **Step 1: spotlight useEffect의 clipPath 로직 교체**

기존 polygon 계산 (lines 230-278) 전체를 `inset()` 기반으로 교체:

```typescript
// Spotlight effect: Update overlay mask
useEffect(() => {
  if (!overlayRef.current) return;

  if (activeIndex === null) {
    overlayRef.current.style.clipPath = "none";
    overlayRef.current.style.opacity = "0";
    return;
  }

  const activeItem = items[activeIndex];
  if (!activeItem?.normalizedBox) return;

  const box = activeItem.normalizedBox;

  // inset(top right bottom left) — S-tier GPU accelerated
  // Values: distance from each edge to the "cutout" rectangle
  const top = box.top * 100;
  const left = box.left * 100;
  const bottom = (1 - (box.top + box.height)) * 100;
  const right = (1 - (box.left + box.width)) * 100;

  // inset() clips the OVERLAY, so we want to show everything EXCEPT the active box
  // Use inset to define the "hole" — but inset clips TO the rectangle, not FROM it
  // So we invert: overlay covers everything, inset removes the active area
  // Actually inset() alone can't make a "frame" (everything except a rectangle)
  // Solution: use two layers approach instead of clipPath
  overlayRef.current.style.clipPath = "none";
  overlayRef.current.style.opacity = "1";
  overlayRef.current.style.filter = "none";
  overlayRef.current.style.background = "none";

  // Direct approach: darken everything, then use a positioned "window" div
  // This avoids clipPath entirely — pure transform + opacity (S-tier)
}, [activeIndex, naturalSize, containerSize]);
```

Wait — `inset()` alone can't create an inverted mask (show everything EXCEPT a rectangle). We need a different approach for the spotlight.

**Revised approach: Replace clipPath with a 4-div frame overlay**

Instead of a single overlay with clipPath polygon, use 4 divs (top, bottom, left, right) positioned around the active item's bounding box. Only `transform` and `opacity` change — both S-tier compositor properties.

```
┌──────────────────────────────────┐
│           TOP bar                │  ← div, height = box.top
├───────┬──────────┬───────────────┤
│ LEFT  │ (clear)  │    RIGHT      │  ← active item visible here
│  bar  │          │     bar       │
├───────┴──────────┴───────────────┤
│          BOTTOM bar              │  ← div, height = 1 - box.bottom
└──────────────────────────────────┘
```

Each bar: `position: absolute`, `background: rgba(0,0,0,0.4)`, animated with `gsap.quickTo()` on `top/left/width/height` — BUT those trigger layout.

**Final approach: Keep single overlay div, but use `inset()` format with CSS `clip-path`.**

Actually, Chromium DOES GPU-accelerate `clip-path: inset()` since 2024. The trick: use `inset()` with `round` to approximate a rectangular cutout. But `inset()` clips TO the shape, not AWAY from it.

**Simplest correct approach: Replace polygon with two stacked images**

```
Layer 1: Original image (full color) — always visible
Layer 2: Grayscale copy of image — clip-path: inset() to show only NON-active area
```

Wait, that's inverted too. Let me think...

**Correct simplest approach:**

```
Layer 1: Original image (full color, bottom)
Layer 2: Semi-transparent dark overlay (full coverage, top)
         When active: clip-path: inset(top right bottom left) 
         → clips overlay TO the non-active area... no, inset removes the inside.
```

Actually: `clip-path: inset()` removes the INSIDE. So `inset(10% 20% 30% 40%)` shows only the outer frame, hiding the inner rectangle. That's EXACTLY what we want for a spotlight!

```css
/* This shows the overlay everywhere EXCEPT the inner rectangle */
clip-path: inset(10% 20% 30% 40%);
```

No wait, `inset()` defines the visible area as the inner rectangle. `inset(10% 20% 30% 40%)` means "visible content starts 10% from top, 20% from right, 30% from bottom, 40% from left" — it clips the OUTSIDE, showing only the inside rectangle.

For a spotlight (show overlay everywhere EXCEPT the active item), we'd need the inverse. CSS doesn't support `inset()` inversion natively.

**Final decision: Use `xywh()` with SVG mask or just optimize the polygon.**

Actually, the simplest high-impact fix: Just keep polygon but cache the string and use `will-change: clip-path` + `requestAnimationFrame`:

```typescript
overlayRef.current.style.willChange = "clip-path, opacity";
requestAnimationFrame(() => {
  overlayRef.current.style.clipPath = clipPath;
});
```

Hmm, this won't help if polygon is inherently main-thread.

**REAL simplest approach that WORKS: Replace the spotlight overlay entirely with just opacity dimming on inactive items, no clipPath at all.**

The zoom+pan already focuses attention on the active item. Instead of a complex spotlight mask, just:
1. Dim the overall image slightly when an item is active
2. The SpotDot of the active item glows/scales up
3. No clipPath at all

This eliminates the most expensive operation entirely while keeping the visual focus effect.

OK let me write the actual plan with this approach.

- [ ] **Step 1: Replace spotlight clipPath with simple opacity dim**

In `ImageCanvas.tsx`, replace the entire spotlight `useEffect` (lines 215-283) with:

```typescript
// Spotlight effect: simple dim when item active (no clipPath — S-tier perf)
useEffect(() => {
  if (!overlayRef.current) return;
  if (activeIndex === null) {
    overlayRef.current.style.opacity = "0";
  } else {
    overlayRef.current.style.opacity = "1";
  }
}, [activeIndex]);
```

And change the overlay div's className (line 306-308) from:
```tsx
className="absolute inset-0 bg-black/40 transition-opacity duration-500 pointer-events-none will-change-transform"
```
to:
```tsx
className="absolute inset-0 bg-black/25 pointer-events-none will-change-[opacity] transition-opacity duration-300"
```

Remove the `filter: grayscale(60%) brightness(0.6)` — replaced by simple semi-transparent darkening. The zoom+pan already draws the eye to the active item.

- [ ] **Step 2: Remove `getHighlightStyle` import if no longer used**

Check if `getCorrectedBoxStyle` (which uses `getHighlightStyle`) is still called. If the spotlight overlay no longer uses it, and SpotDots don't use it, remove the import.

- [ ] **Step 3: Type check**

Run: `cd packages/web && bunx --bun tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/detail/ImageCanvas.tsx
git commit -m "perf(detail): replace polygon clipPath spotlight with simple opacity dim"
```

---

## Task 2: `gsap.to()` → `gsap.quickTo()` 

**Files:**
- Modify: `packages/web/lib/components/detail/ImageCanvas.tsx:131-213`

`gsap.to()` creates a new tween on every call. `gsap.quickTo()` creates a reusable tween once, then just updates the target value — 50-250% faster for high-frequency updates.

- [ ] **Step 1: Create quickTo functions on mount**

Replace the `useGSAP` block (lines 132-213) with:

```typescript
// Pre-create reusable quickTo tweens (created once, reused on every activeIndex change)
const quickTweens = useRef<{
  imgScale: gsap.QuickToFunc | null;
  imgX: gsap.QuickToFunc | null;
  imgY: gsap.QuickToFunc | null;
  boxScale: gsap.QuickToFunc | null;
  boxX: gsap.QuickToFunc | null;
  boxY: gsap.QuickToFunc | null;
  overlayScale: gsap.QuickToFunc | null;
  overlayX: gsap.QuickToFunc | null;
  overlayY: gsap.QuickToFunc | null;
}>({
  imgScale: null, imgX: null, imgY: null,
  boxScale: null, boxX: null, boxY: null,
  overlayScale: null, overlayX: null, overlayY: null,
});

// Initialize quickTo functions when refs are ready
useEffect(() => {
  if (!imageRef.current) return;
  const dur = { duration: 0.4, ease: "power2.out" };

  quickTweens.current.imgScale = gsap.quickTo(imageRef.current, "scale", dur);
  quickTweens.current.imgX = gsap.quickTo(imageRef.current, "x", dur);
  quickTweens.current.imgY = gsap.quickTo(imageRef.current, "y", dur);

  if (boxesRef.current) {
    quickTweens.current.boxScale = gsap.quickTo(boxesRef.current, "scale", dur);
    quickTweens.current.boxX = gsap.quickTo(boxesRef.current, "x", dur);
    quickTweens.current.boxY = gsap.quickTo(boxesRef.current, "y", dur);
  }

  if (overlayRef.current) {
    quickTweens.current.overlayScale = gsap.quickTo(overlayRef.current, "scale", dur);
    quickTweens.current.overlayX = gsap.quickTo(overlayRef.current, "x", dur);
    quickTweens.current.overlayY = gsap.quickTo(overlayRef.current, "y", dur);
  }
}, [naturalSize]); // Re-init if image loads
```

- [ ] **Step 2: Drive quickTo from activeIndex changes**

```typescript
// Zoom/Pan animation driven by activeIndex (no new tweens created)
useEffect(() => {
  const qt = quickTweens.current;
  if (!qt.imgScale) return;

  if (activeIndex === null) {
    // Reset
    qt.imgScale(1); qt.imgX(0); qt.imgY(0);
    qt.boxScale?.(1); qt.boxX?.(0); qt.boxY?.(0);
    qt.overlayScale?.(1); qt.overlayX?.(0); qt.overlayY?.(0);
    transformRef.current = { scale: 1, x: 0, y: 0 };
    return;
  }

  const activeItem = items[activeIndex];
  if (!activeItem?.normalizedCenter || !activeItem?.normalizedBox) return;

  const rect = getDisplayedRect();
  if (!rect) return;

  const center = activeItem.normalizedCenter;
  const scale = 1.2;
  const offsetX = (center.x - 0.5) * (scale - 1) * rect.width;
  const offsetY = (center.y - 0.5) * (scale - 1) * rect.height;

  qt.imgScale(scale); qt.imgX(-offsetX); qt.imgY(-offsetY);
  qt.boxScale?.(scale); qt.boxX?.(-offsetX); qt.boxY?.(-offsetY);
  qt.overlayScale?.(scale); qt.overlayX?.(-offsetX); qt.overlayY?.(-offsetY);
  transformRef.current = { scale, x: -offsetX, y: -offsetY };
}, [activeIndex, naturalSize, containerSize]);
```

- [ ] **Step 3: Remove old `useGSAP` import if no longer used**

Check if `useGSAP` is still used elsewhere in the file. If not, remove the import.

- [ ] **Step 4: Type check**

Run: `cd packages/web && bunx --bun tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/detail/ImageCanvas.tsx
git commit -m "perf(detail): replace gsap.to() with gsap.quickTo() for reusable tweens"
```

---

## Task 3: Zustand subscribe → quickTo 직접 구동 (React 우회)

**Files:**
- Modify: `packages/web/lib/components/detail/ImageCanvas.tsx`
- Modify: `packages/web/lib/components/detail/ImageDetailModal.tsx` (SpotOverlay의 ImageCanvasWithStore)

현재: Zustand subscribe → `setState` → React re-render → useEffect → quickTo.
변경: Zustand subscribe → quickTo 직접 호출. React render cycle 완전 우회.

- [ ] **Step 1: ImageCanvas에서 activeIndex prop 제거, Zustand 직접 구독**

Props에서 `activeIndex` 제거:
```typescript
type Props = {
  image: ImageRow;
  items: UiItem[];
  objectFit?: "cover" | "contain";
};
```

Component 내부에서 Zustand subscribe로 직접 quickTo 구동:

```typescript
import { useActiveSpotStore } from "@/lib/stores/activeSpotStore";

// ... inside component, after quickTo init ...

// Drive zoom/pan directly from Zustand (bypasses React render)
useEffect(() => {
  const qt = quickTweens.current;
  if (!qt.imgScale) return;

  const unsubscribe = useActiveSpotStore.subscribe((state) => {
    const idx = state.activeIndex;

    // Spotlight opacity
    if (overlayRef.current) {
      overlayRef.current.style.opacity = idx === null ? "0" : "1";
    }

    if (idx === null) {
      qt.imgScale!(1); qt.imgX!(0); qt.imgY!(0);
      qt.boxScale?.(1); qt.boxX?.(0); qt.boxY?.(0);
      qt.overlayScale?.(1); qt.overlayX?.(0); qt.overlayY?.(0);
      return;
    }

    const activeItem = items[idx];
    if (!activeItem?.normalizedCenter || !activeItem?.normalizedBox) return;

    const rect = getDisplayedRect();
    if (!rect) return;

    const center = activeItem.normalizedCenter;
    const scale = 1.2;
    const offsetX = (center.x - 0.5) * (scale - 1) * rect.width;
    const offsetY = (center.y - 0.5) * (scale - 1) * rect.height;

    qt.imgScale!(scale); qt.imgX!(-offsetX); qt.imgY!(-offsetY);
    qt.boxScale?.(scale); qt.boxX?.(-offsetX); qt.boxY?.(-offsetY);
    qt.overlayScale?.(scale); qt.overlayX?.(-offsetX); qt.overlayY?.(-offsetY);
  });

  return unsubscribe;
}, [items, naturalSize, containerSize]);
```

- [ ] **Step 2: SpotDot도 Zustand subscribe로 DOM 직접 조작**

SpotDot 컨테이너의 각 dot에 `data-spot-index` 추가, 기존 `isActive` React 조건 제거:

```typescript
{items.map((item, index) => {
  if (!item.normalizedCenter) return null;
  const rect = getDisplayedRect();
  if (!rect) return null;
  const pixelLeft = rect.left + rect.width * item.normalizedCenter.x;
  const pixelTop = rect.top + rect.height * item.normalizedCenter.y;
  const meta = item.metadata as unknown as Record<string, unknown> | undefined;

  return (
    <div
      key={item.id}
      data-spot-index={index}
      className="opacity-0 scale-100 transition-all duration-300"
      style={{ position: "absolute", left: 0, top: 0, transformOrigin: `${pixelLeft}px ${pixelTop}px` }}
    >
      <SpotDot
        mode="pixel"
        leftPx={pixelLeft}
        topPx={pixelTop}
        label={item.product_name ?? ""}
        brand={meta?.brand as string | undefined}
        category={meta?.sub_category as string | undefined}
        accentColor="var(--mag-accent)"
      />
    </div>
  );
})}
```

SpotDot 하이라이트도 Zustand subscribe에서 처리 (Task 3 Step 1의 subscribe 내부에 추가):

```typescript
// Inside the subscribe callback:
if (boxesRef.current) {
  boxesRef.current.querySelectorAll<HTMLElement>("[data-spot-index]").forEach((dot) => {
    const dotIdx = Number(dot.dataset.spotIndex);
    if (dotIdx === idx) {
      dot.style.opacity = "1";
      dot.style.transform = "scale(1.25)";
    } else {
      dot.style.opacity = "0";
      dot.style.transform = "scale(1)";
    }
  });
}
```

- [ ] **Step 3: ImageDetailModal에서 ImageCanvasWithStore 제거**

`ImageCanvasWithStore` 래퍼가 더 이상 필요 없음 (ImageCanvas가 직접 store 구독). `SpotOverlay`에서 직접 `ImageCanvas` 사용:

```typescript
if (image && hasItemsWithCoordinates) {
  return (
    <ImageCanvas
      image={image}
      items={normalizedItems}
      objectFit="contain"
    />
  );
}
```

`ImageCanvasWithStore` 함수 삭제.

- [ ] **Step 4: activeIndex useEffect들 제거**

Task 1, 2에서 만든 `useEffect`들 (spotlight, zoom/pan)을 Zustand subscribe 하나로 통합했으므로 개별 useEffect 삭제.

- [ ] **Step 5: Type check**

Run: `cd packages/web && bunx --bun tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/detail/ImageCanvas.tsx packages/web/lib/components/detail/ImageDetailModal.tsx
git commit -m "perf(detail): drive ImageCanvas zoom/spotlight directly from Zustand subscribe"
```

---

## Task 4: 통합 검증

- [ ] **Step 1: 빌드**

Run: `bun run build`
Expected: 성공

- [ ] **Step 2: 브라우저 검증 체크리스트**

- [ ] Explore → 카드 클릭 → 모달 열림
- [ ] 오른쪽 패널 스크롤 시 왼쪽 이미지 줌/팬 부드러움 (jank 없음)
- [ ] Spotlight 어두운 오버레이 표시/숨김 부드러움
- [ ] SpotDot 하이라이트 부드러움
- [ ] 모달 닫기 깜빡임 없음
- [ ] non-editorial 포스트도 정상 동작 (InteractiveShowcase 경로)
- [ ] full editorial 페이지 (/posts/[id]) 정상 동작

- [ ] **Step 3: 최종 커밋**

```bash
git commit -m "perf(detail): complete ImageCanvas scroll performance optimization"
```

---

## 성능 개선 요약

| 변경 | Before | After |
|------|--------|-------|
| Spotlight | `polygon()` 11-point (C-tier, main thread paint) | `opacity` dim (S-tier, compositor) |
| Zoom/Pan | `gsap.to()` × 3 (new tween every call) | `gsap.quickTo()` × 9 (reuse, 50-250% faster) |
| Trigger | React state → useEffect → GSAP | Zustand.subscribe → GSAP direct (0 React renders) |
