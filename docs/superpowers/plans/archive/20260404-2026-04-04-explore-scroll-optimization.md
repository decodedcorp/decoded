# Explore Scroll Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix scroll sync jank between left image panel and right drawer in Explore modal.

**Architecture:** Four independent bug fixes targeting double-scroll, ScrollTrigger init delay, passive listeners, and GSAP animation races. Each fix modifies one file with no cross-dependencies.

**Tech Stack:** GSAP ScrollTrigger, React useEffect/useCallback, native DOM event listeners

---

### Task 1: Fix double-scroll in ImageDetailModal

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailModal.tsx:126-128, 259-262`

- [ ] **Step 1: Replace React onWheel with native wheel listener**

At line 126-128, replace the `handleImageScroll` callback:

```typescript
// REMOVE this:
const handleImageScroll = useCallback((e: React.WheelEvent) => {
  scrollContainerRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
}, []);
```

Add a `useEffect` that registers a native wheel listener on the left image container:

```typescript
// ADD after the existing debug useEffect (after line 123):
useEffect(() => {
  const el = leftImageContainerRef.current;
  if (!el) return;

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    scrollContainerRef.current?.scrollBy({ top: e.deltaY });
  };

  el.addEventListener("wheel", handleWheel, { passive: false });
  return () => el.removeEventListener("wheel", handleWheel);
}, []);
```

- [ ] **Step 2: Remove onWheel from JSX**

At line 262, remove the `onWheel` prop from the left image container div:

```tsx
// BEFORE:
ref={leftImageContainerRef}
className="..."
onWheel={handleImageScroll}

// AFTER:
ref={leftImageContainerRef}
className="..."
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/detail/ImageDetailModal.tsx
git commit -m "fix(modal): replace React onWheel with native listener to prevent double-scroll (#86)"
```

---

### Task 2: Replace setTimeout with condition-based ScrollTrigger init (MagazineItemsSection)

**Files:**
- Modify: `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx:116-161`

- [ ] **Step 1: Replace setTimeout(700) with RAF-based layout check**

Replace the ScrollTrigger init block (line 116-161). The current code:

```typescript
if (isModal && onActiveIndexChange && cards.length > 0) {
  const scroller = scrollContainerRef?.current || window;

  const initTimer = setTimeout(() => {
    // ... ScrollTrigger.create for each card ...
    ScrollTrigger.refresh();
  }, 700);

  return () => {
    clearTimeout(initTimer);
    // ... cleanup ...
  };
}
```

Replace with:

```typescript
if (isModal && onActiveIndexChange && cards.length > 0) {
  const scroller = scrollContainerRef?.current || window;
  let cancelled = false;

  const initScrollTriggers = () => {
    if (cancelled) return;

    cards.forEach((card, index) => {
      ScrollTrigger.create({
        scroller,
        trigger: card,
        start: "top center",
        end: "bottom center",
        invalidateOnRefresh: true,
        onEnter: () => {
          activeIndexRef.current = index;
          onActiveIndexChange(index);
        },
        onEnterBack: () => {
          activeIndexRef.current = index;
          onActiveIndexChange(index);
        },
        onLeave: () => {
          if (activeIndexRef.current === index) {
            onActiveIndexChange(null);
          }
        },
        onLeaveBack: () => {
          if (activeIndexRef.current === index) {
            onActiveIndexChange(null);
          }
        },
      });
    });
    ScrollTrigger.refresh();
  };

  // Wait for scroller to have a valid scrollHeight (layout stable)
  const scrollerEl = scroller instanceof Window ? document.documentElement : scroller as HTMLElement;
  let attempts = 0;
  const maxAttempts = 25; // ~400ms max

  const checkReady = () => {
    if (cancelled) return;
    attempts++;
    if (scrollerEl.scrollHeight > scrollerEl.clientHeight || attempts >= maxAttempts) {
      initScrollTriggers();
    } else {
      requestAnimationFrame(checkReady);
    }
  };

  requestAnimationFrame(checkReady);

  return () => {
    cancelled = true;
    ScrollTrigger.getAll().forEach((trigger) => {
      if (cards.includes(trigger.vars.trigger as HTMLElement)) {
        trigger.kill();
      }
    });
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
git commit -m "fix(magazine): replace fixed 700ms delay with layout-ready ScrollTrigger init (#86)"
```

---

### Task 3: Replace setTimeout with condition-based ScrollTrigger init (InteractiveShowcase)

**Files:**
- Modify: `packages/web/lib/components/detail/InteractiveShowcase.tsx:110-120`

- [ ] **Step 1: Replace setTimeout(300) with same RAF pattern**

Find the existing setTimeout block in the modal branch (around line 110-120):

```typescript
if (scrollContainerRef?.current) {
  const timer = setTimeout(() => ScrollTrigger.refresh(), 300);
  return () => {
    clearTimeout(timer);
    // ... cleanup
  };
}
```

Replace with:

```typescript
if (scrollContainerRef?.current) {
  let cancelled = false;
  const scrollerEl = scrollContainerRef.current;
  let attempts = 0;
  const maxAttempts = 25;

  const checkReady = () => {
    if (cancelled) return;
    attempts++;
    if (scrollerEl.scrollHeight > scrollerEl.clientHeight || attempts >= maxAttempts) {
      ScrollTrigger.refresh();
    } else {
      requestAnimationFrame(checkReady);
    }
  };

  requestAnimationFrame(checkReady);

  return () => {
    cancelled = true;
    ScrollTrigger.getAll().forEach((trigger) => {
      if (cards.includes(trigger.vars.trigger as HTMLElement)) {
        trigger.kill();
      }
    });
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/detail/InteractiveShowcase.tsx
git commit -m "fix(showcase): replace fixed 300ms delay with layout-ready ScrollTrigger init (#86)"
```

---

### Task 4: Add passive flag to ConnectorLayer scroll listener

**Files:**
- Modify: `packages/web/lib/components/detail/ConnectorLayer.tsx:122-130`

- [ ] **Step 1: Add passive: true to both event listeners**

At line 122 and 126, add passive option:

```typescript
// BEFORE (line 122):
window.addEventListener("resize", handleUpdate);

// AFTER:
window.addEventListener("resize", handleUpdate, { passive: true });

// BEFORE (line 126):
scroller.addEventListener("scroll", handleUpdate as EventListener);

// AFTER:
scroller.addEventListener("scroll", handleUpdate as EventListener, { passive: true });
```

Also update cleanup (lines 129-130):

```typescript
// No change needed — removeEventListener ignores passive option
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/detail/ConnectorLayer.tsx
git commit -m "perf(connector): add passive flag to scroll/resize listeners (#86)"
```

---

### Task 5: Prevent GSAP animation race in ImageCanvas

**Files:**
- Modify: `packages/web/lib/components/detail/ImageCanvas.tsx:132-211`

- [ ] **Step 1: Kill existing tweens before starting new ones**

In the `useGSAP` block at line 132, add `gsap.killTweensOf()` calls at the start of both branches (reset and pan/zoom):

At the start of the reset branch (after `if (!imageRef.current || activeIndex === null) {`, line 134):

```typescript
if (!imageRef.current || activeIndex === null) {
  // Reset to default state
  if (imageRef.current) {
    // Kill any running tweens before reset
    gsap.killTweensOf(imageRef.current);
    if (boxesRef.current) gsap.killTweensOf(boxesRef.current);
    if (overlayRef.current) gsap.killTweensOf(overlayRef.current);

    const resetVars = {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    };
    // ... rest unchanged
```

At the pan/zoom branch, before `gsap.to(imageRef.current, animVars)` (around line 191):

```typescript
if (rect) {
  // Kill any running tweens before pan/zoom
  gsap.killTweensOf(imageRef.current);
  if (boxesRef.current) gsap.killTweensOf(boxesRef.current);
  if (overlayRef.current) gsap.killTweensOf(overlayRef.current);

  const animVars = {
    scale,
    x: -offsetX,
    y: -offsetY,
    duration: 0.8,
    ease: "power2.out",
  };

  gsap.to(imageRef.current, animVars);
  // ... rest unchanged
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/detail/ImageCanvas.tsx
git commit -m "fix(canvas): kill running tweens before new animation to prevent race (#86)"
```

---

### Task 6: Build Verification

- [ ] **Step 1: Type check modified files**

Run: `cd packages/web && bunx tsc --noEmit 2>&1 | grep -E "ImageDetailModal|MagazineItems|InteractiveShowcase|ConnectorLayer|ImageCanvas" | head -10`
Expected: No errors in modified files (existing admin/picks error is pre-existing)

- [ ] **Step 2: Verify no regressions**

Run: `cd /Users/kiyeol/development/decoded/decoded-monorepo && git diff --stat HEAD~5..HEAD`
Expected: 5 files changed, all matching spec

- [ ] **Step 3: Push**

```bash
git push -u origin fix/explore-scroll-optimization
```
