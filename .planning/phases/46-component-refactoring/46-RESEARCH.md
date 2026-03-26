# Phase 46: Component Refactoring - Research

**Researched:** 2026-03-26
**Domain:** React component decomposition — custom hooks, subcomponent extraction, class-to-functional migration
**Confidence:** HIGH

## Summary

Phase 46 targets four oversized components totalling 3,356 lines. Each component mixes distinct concerns (physics engine, form logic, GSAP animations, API fetching) that can be cleanly separated into custom hooks and/or subcomponents. The goal is to bring each file under 300 lines without changing external behavior.

Phase 44 has already established GSAP contextSafe() and AbortController cleanup patterns across the codebase. Phase 46 must respect and reuse those established patterns — no cleanup regressions.

The four targets differ significantly in decomposition strategy: ThiingsGrid is a class component requiring careful encapsulation of its physics engine; VtonModal has multiple independent concerns that map cleanly to discrete hooks; ItemDetailCard mixes GSAP scroll animation with solution/adopt logic; ImageDetailModal has a complex GSAP entry/exit animation lifecycle that must stay intact.

**Primary recommendation:** Extract logic to custom hooks first, then extract subcomponent UI only where JSX naturally self-contains (e.g., VtonLoadingAnimation, BeforeAfterSlider which already exist as private functions in VtonModal).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REF-01 | ThiingsGrid(950줄) — physics, spiral, IntersectionObserver를 커스텀 훅으로 추출, 300줄 이하 | Class component encapsulation via PhysicsEngine class extraction + useThiingsPhysics hook wrapper |
| REF-02 | VtonModal(880줄) — 모달 상태, 폼 로직, 이미지 처리를 훅과 서브컴포넌트로 분리 | useVtonState + useVtonItemFetch + useVtonTryOn hooks; BeforeAfterSlider/VtonLoadingAnimation already self-contained |
| REF-03 | ItemDetailCard(771줄) — solution 관리, adopt dropdown, GSAP 스크롤 애니메이션 훅으로 추출 | useSolutionAdopt + useItemCardGSAP hooks |
| REF-04 | ImageDetailModal(726줄) — 모달 상태와 콘텐츠 컴포지션을 서브컴포넌트로 분리 | useImageModalAnimation hook; renderContent() as ImageDetailContent (already exists at ImageDetailContent.tsx) |
</phase_requirements>

---

## Standard Stack

No new libraries needed. All decomposition uses patterns already in the codebase.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React hooks | 19 | useState, useRef, useCallback, useEffect, useMemo | Already used throughout |
| @gsap/react `useGSAP` | installed | GSAP context-managed hooks | Phase 44 established this pattern |
| zustand | installed | State stores | vtonStore already uses this |
| @tanstack/react-query | installed | useSolutions, useAdoptSolution, etc. | Already used in ItemDetailCard |

### No New Dependencies
All decomposition is pure code reorganization. No new packages required.

---

## Architecture Patterns

### Recommended Directory Structure After Refactoring

```
packages/web/lib/
├── components/
│   ├── ThiingsGrid.tsx          # ~150 lines — render + event delegation only
│   ├── ThiingsGridPhysics.ts    # ~200 lines — PhysicsEngine class (extracted, not a component)
│   ├── vton/
│   │   ├── VtonModal.tsx        # ~150 lines — layout + composition only
│   │   ├── VtonLoadingAnimation.tsx  # ~80 lines — already isolated function → file
│   │   └── BeforeAfterSlider.tsx     # ~80 lines — already isolated function → file
│   └── detail/
│       ├── ImageDetailModal.tsx  # ~180 lines — layout + animation setup only
│       └── ImageDetailContent.tsx  # already exists — no change needed
└── hooks/
    ├── useVtonState.ts           # ~80 lines — modal/job/person state
    ├── useVtonItemFetch.ts       # ~60 lines — item fetch + debounced search
    ├── useVtonTryOn.ts           # ~80 lines — handleTryOn + handleSaveToProfile
    ├── useVtonScrollLock.ts      # ~30 lines — body scroll lock effect
    ├── useSolutionAdopt.ts       # ~70 lines — adopt dropdown logic (local to ItemDetailCard)
    └── useItemCardGSAP.ts        # ~40 lines — ScrollTrigger animation
```

### Pattern 1: Pure Logic Hook Extraction

**What:** Move all non-render logic (state, effects, callbacks) into a custom hook. The component receives the hook's return values and renders only.
**When to use:** When a component has 3+ `useState`/`useEffect` blocks that relate to a single concern.
**Example (useVtonScrollLock):**
```typescript
// packages/web/lib/hooks/useVtonScrollLock.ts
import { useEffect } from "react";

export function useVtonScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);
}
```

### Pattern 2: Private Function → Separate File (Subcomponent Promotion)

**What:** Move a locally-defined function component (not exported) to its own file and export it.
**When to use:** When a private component already has clean props (VtonLoadingAnimation, BeforeAfterSlider).
**What NOT to do:** Do not split subcomponents that share internal state/callbacks via closure — they must receive everything as props.

### Pattern 3: Class Component Encapsulation (ThiingsGrid-specific)

**What:** ThiingsGrid is a class component. Converting to functional + hooks would be highest-risk refactor. The safer strategy is:
1. Extract the `PhysicsState` + physics methods into a standalone `ThiingsGridPhysics.ts` class (not a React component).
2. Keep ThiingsGrid as a class component that delegates to `ThiingsGridPhysics`.
3. Move spiral position calculation (`ensureSpiralPositions`, `getSpiralPosition`) into the physics class.
4. Move IntersectionObserver setup into a `ThiingsGridObservers.ts` helper.
**When to use:** When the component is a class component with complex lifecycle dependencies between methods.

### Pattern 4: GSAP Animation Hook with contextSafe (Phase 44 pattern)

**What:** Wrap GSAP animation logic into a hook that manages a `gsap.Context` ref.
**When to use:** ItemDetailCard's `useGSAP` block and ImageDetailModal's manual `ctxRef` GSAP context.
**Important:** Phase 44 established that `useGSAP` with `{ scope: ref }` is the correct pattern. Manual `gsap.context()` + `ctxRef` is acceptable when animation spans multiple effects (as in ImageDetailModal).

### Anti-Patterns to Avoid

- **Converting ThiingsGrid to functional component:** High risk — RAF loop, non-passive event listeners, and WeakMap caches are tightly coupled to class lifecycle. Conversion is out of scope for this phase.
- **Splitting components that share closure state:** If two JSX blocks inside a render share the same `useRef` or `useState`, they cannot be split without prop drilling or context.
- **Changing exported API:** ThiingsGrid, VtonModal, ItemDetailCard, ImageDetailModal are imported elsewhere. Their external interfaces must not change.
- **Moving logic to context/store:** Don't introduce new Zustand stores or React Context just for refactoring. Only extract to hooks.
- **Over-extracting tiny pieces:** Aim for meaningful extractions. Don't extract a single `useEffect` into its own hook file just to reduce line count.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced search in VtonModal | Custom debounce hook | The existing `useDebounce` hook at `lib/hooks/useDebounce.ts` | Already exists in the project |
| Scroll lock | Custom effect | `useVtonScrollLock` extracted from VtonModal | Reuse same logic already tested |
| GSAP cleanup | Manual `gsap.kill()` | `useGSAP` with `{ scope }` or `ctxRef.current.revert()` | Phase 44 established patterns — don't regress |

**Key insight:** The project already has `useDebounce.ts`. VtonModal currently implements its own inline debounce. Replace that with the existing hook.

---

## Component-by-Component Decomposition Plan

### REF-01: ThiingsGrid (950 lines → ~200 lines)

**Current structure:**
- Lines 1-82: Utility functions (debounce, throttle, getDistance) — hand-rolled
- Lines 83-165: Type definitions
- Lines 166-950: Class component with physics engine, spiral math, IntersectionObservers, event handlers, render

**Extraction targets:**
1. `debounce` / `throttle` functions → move to `lib/utils/throttle.ts` (or use lodash — check if installed)
2. Physics state + `startPhysicsLoop`, `loop`, `handleDown/Move/Up`, `handleWheel` → `ThiingsGridPhysics.ts` class
3. Spiral math (`ensureSpiralPositions`, `getSpiralPosition`, `getDistance`) → methods on physics class
4. IntersectionObserver setup (`initializeIntersectionObserver`, `initializeImageObserver`, `observeCardElements`, `observeImages`) → `ThiingsGridObservers.ts`
5. `checkInfiniteScroll`, `updateGridItems` → can stay on class or move to physics class

**Constraint:** ThiingsGrid is a class component. The public API (`gridSize`, `renderItem`, `items`, `onReachEnd`, `hasMore`, `isLoadingMore`, `initialPosition`, `className`) must not change. The `ThiingsGrid.best-practices.md` documents `ref={gridRef}` usage — class component imperative ref remains valid.

**Line budget:** After extraction, ThiingsGrid.tsx should contain: types (30 lines), class declaration + constructor (40 lines), lifecycle methods delegating to helpers (30 lines), event handlers (40 lines), render (50 lines) = ~190 lines.

### REF-02: VtonModal (907 lines → ~150 lines)

**Current structure:**
- Lines 1-35: Utility functions (`dataUrlToBlob`, `copyImageToClipboard`)
- Lines 36-50: Type/constant definitions
- Lines 52-109: `VtonLoadingAnimation` private component
- Lines 111-189: `BeforeAfterSlider` private component
- Lines 191-231: `VtonBackgroundNotifier` exported component
- Lines 233-907: `VtonModal` main component

**Already self-contained (promote to files):**
- `VtonLoadingAnimation` → `VtonLoadingAnimation.tsx`
- `BeforeAfterSlider` → `BeforeAfterSlider.tsx`
- `VtonBackgroundNotifier` → `VtonBackgroundNotifier.tsx` (already exported, easy split)

**Hook extractions from VtonModal:**
- `useVtonScrollLock(isOpen)` — body scroll lock effect (lines 315-331)
- `useVtonKeyboardClose(isOpen, handleClose)` — Escape key effect (lines 333-341)
- `useVtonItemFetch(isOpen, activeCategory, debouncedQuery, preloadedItems)` → returns `items` (lines 358-375). Use existing `useDebounce` for debouncedQuery.
- `useVtonJobSync(isOpen, backgroundJob)` → returns loading/stage sync (lines 377-398)
- `useVtonTryOn(...)` → returns `handleTryOn` (lines 438-493)

**State that stays in VtonModal:** `personImage`, `personPreview`, `selectedItems`, `selectedPostItemIds`, `error` — these are UI state that drive the visible form.

### REF-03: ItemDetailCard (769 lines → ~200 lines)

**Current structure:**
- Lines 1-28: Imports
- Lines 57-100: Refs and adopt dropdown state
- Lines 84-100: Click-outside `useEffect` for adopt dropdown
- Lines 102-129: `useGSAP` scroll animation block
- Lines 130-175: Display derivations (displayBrand, displayName, etc.)
- Lines 176+: JSX (contains `topSolutionCard` inline IIFE and `othersSection`)

**Hook extractions:**
- `useAdoptDropdown(spotId)` → returns `{ adoptTargetId, setAdoptTargetId, adoptDropdownRef, adoptMutation, unadoptMutation }`. Encapsulates the click-outside listener and adopt/unadopt mutations. (~60 lines)
- `useItemCardGSAP(cardRef, contentRef, isModal)` → encapsulates the `useGSAP` ScrollTrigger block. (~30 lines)

**Subcomponent extractions:**
- `TopSolutionCard` — the inline IIFE building `topSolutionCard` (currently ~100 lines of JSX) → becomes a named component that receives `topSolution`, `isPostOwner`, `spotId`, adopt/unadopt handlers as props.
- `OtherSolutionsList` — the `othersSection` conditional block → becomes a named component.

**Constraint:** `useSolutions`, `useAdoptSolution`, `useUnadoptSolution` are already in `lib/hooks/useSolutions.ts`. The new `useAdoptDropdown` hook just orchestrates these plus the local dropdown state.

### REF-04: ImageDetailModal (730 lines → ~180 lines)

**Current structure:**
- Lines 1-18: Imports
- Lines 29-56: Data fetching hooks (usePostDetailForImage, usePostMagazine)
- Lines 58-69: Scroll forwarding (incomplete/TODO comment)
- Lines 71-211: handleClose, touch handlers, handleMaximize, GSAP mount animation
- Lines 282-392: GSAP entry animation for image (Floating Image animation)
- Lines 393-486: `renderContent()` inner function
- Lines 487+: JSX layout (backdrop + drawer + floating image)

**Hook extraction:**
- `useImageModalAnimation(refs, imageId, imageData, originRect)` → wraps the ctxRef management, mount animation (lines 283-391), and `handleClose` animation logic. Returns `{ handleClose, handleTouchStart, handleTouchMove, handleTouchEnd, handleMaximize, isClosing }`.
- The `renderContent()` function (lines 393-486) can become an `ImageDetailContent` component — but `ImageDetailContent.tsx` ALREADY EXISTS in `lib/components/detail/`. Check if the existing file is usable or needs consolidation.

**Important:** The GSAP context (`ctxRef`) must remain owned by `useImageModalAnimation`. The touch handlers reference `ctxRef.current.add()` — these must be in the same hook or passed the context ref.

---

## Common Pitfalls

### Pitfall 1: Breaking ThiingsGrid's Non-Passive Event Listeners
**What goes wrong:** ThiingsGrid registers `wheel` and `touchmove` with `{ passive: false }` in `componentDidMount`. If you extract to a hook and re-register, you might lose the passive:false flag and break scroll prevention.
**How to avoid:** When moving observer/event setup to helper classes, ensure the `{ passive: false }` option is explicitly passed.
**Warning signs:** Browser warning "Unable to preventDefault inside passive event listener."

### Pitfall 2: Losing the Physics Loop Reference
**What goes wrong:** The RAF loop (`this.animationFrame`) and `this.isComponentMounted` flag coordinate animation frame cancellation. If moved to an external class, they must still be accessible from `componentWillUnmount`.
**How to avoid:** Physics class returns a `destroy()` method. ThiingsGrid.componentWillUnmount calls `this.physicsEngine.destroy()`.

### Pitfall 3: VtonModal handleClose Reference in Extracted Hook
**What goes wrong:** `handleClose` in VtonModal is a `useCallback` that references `isOpen`. Extracting to a hook requires passing `handleClose` as a dependency or returning it from the same hook.
**How to avoid:** `useVtonKeyboardClose(isOpen, handleClose)` receives `handleClose` from the component — or `handleClose` itself lives in a hook.

### Pitfall 4: ImageDetailModal ctxRef Shared Across Effects
**What goes wrong:** Multiple effects in ImageDetailModal reference `ctxRef.current` (mount animation, floating image animation, touch handlers). If these are split across different hooks, the shared context ref becomes ambiguous.
**How to avoid:** `useImageModalAnimation` owns `ctxRef` and exposes the animation-integrated touch handlers as return values. Do not create a second GSAP context for a portion of the animation.

### Pitfall 5: Changing ThiingsGrid Export Shape
**What goes wrong:** ThiingsGrid is imported in at least one page as a default export (per best-practices.md `import ThiingsGrid from "@/lib/components/ThiingsGrid"`). Moving types to a separate file must preserve the re-export.
**How to avoid:** Keep `export type { GridItem, ThiingsGridProps, ItemConfig, Position, PostSource }` in ThiingsGrid.tsx even after extraction.

### Pitfall 6: ItemDetailCard Inline IIFE JSX
**What goes wrong:** `topSolutionCard` is computed as an IIFE in the component body: `const topSolutionCard = topSolution ? (() => { ... })() : null`. Extracting it as `<TopSolutionCard />` requires passing all adopt-related callbacks as props.
**How to avoid:** Extract `useAdoptDropdown` first, then use the returned values as props to `TopSolutionCard`. This keeps the flow clean without prop explosion.

---

## Code Examples

### Existing Hook Pattern to Follow (from useSolutions.ts)
```typescript
// Source: packages/web/lib/hooks/useSolutions.ts
export function useSolutions(
  spotId: string,
  options?: Omit<UseQueryOptions<...>, "queryKey" | "queryFn">
) {
  return useListSolutionsGenerated(spotId, {
    query: {
      queryKey: solutionKeys.list(spotId),
      enabled: !!spotId,
      staleTime: 1000 * 60,
      ...options,
    },
  });
}
```
Pattern: hooks return the TanStack Query result directly.

### Phase 44 GSAP cleanup pattern (established)
```typescript
// Source: Phase 44 established pattern — useGSAP with scope
useGSAP(
  () => {
    if (!contentRef.current || isModal) return;
    gsap.fromTo(contentRef.current, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1,
      scrollTrigger: { trigger: cardRef.current, ... },
    });
  },
  { scope: cardRef }
);
```
Always use `useGSAP` with `{ scope }` for component-scoped animations.

### Existing useDebounce hook (use instead of inline timer)
```typescript
// Source: packages/web/lib/hooks/useDebounce.ts (already exists)
// VtonModal currently implements inline debounce — replace with:
import { useDebounce } from "@/lib/hooks/useDebounce";
const debouncedQuery = useDebounce(searchQuery, 300);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All logic in one component file | Logic in custom hooks, UI in component | React 16.8+ (hooks) | Standard practice |
| setTimeout in effects | Direct addEventListener / gsap.delayedCall | Phase 44 | No setTimeout workarounds |
| Raw gsap.to() | useGSAP with contextSafe / scope | Phase 44 | Auto-cleanup on unmount |
| AbortController missing | AbortController on all fetches | Phase 44 | Memory leak prevention |

**Not applicable for ThiingsGrid:** Class components with heavy physics loops are a legitimate exception to "convert everything to functional." Functional migration of ThiingsGrid is a v10.1+ concern (XREF scope).

---

## Open Questions

1. **Does `lib/components/detail/ImageDetailContent.tsx` overlap with `renderContent()`?**
   - What we know: `ImageDetailContent.tsx` exists in the detail directory. `ImageDetailModal.tsx` has an inner `renderContent()` function.
   - What's unclear: Whether the existing file handles the same loading/error/content rendering or is for a different context (the full-page view).
   - Recommendation: Read `ImageDetailContent.tsx` before planning — if it's the full-page equivalent, `renderContent()` should become a new subcomponent named `ImageDetailModalContent`.

2. **Is `lodash/debounce` or similar already available?**
   - What we know: `useDebounce.ts` exists in `lib/hooks/`.
   - What's unclear: Whether ThiingsGrid's inline debounce/throttle should be replaced with the hook (it's a class component, so hooks aren't applicable).
   - Recommendation: For ThiingsGrid, keep the inline throttle/debounce as utility functions but move them to `lib/utils/` shared location.

3. **Line count target: strictly 300 or pragmatically close?**
   - What we know: Requirements say "300줄 이하."
   - What's unclear: Whether 310 lines with a comment explaining why is acceptable.
   - Recommendation: Plan for strict 300. If a component is 305 lines, extract one more small subcomponent.

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from config.json — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) — for Wave 0 validation |
| Config file | `packages/web/playwright.config.ts` |
| Quick run command | `cd packages/web && bun run typecheck` (TypeScript as fast verification) |
| Full suite command | `cd packages/web && bun run build` (build success = no regressions) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REF-01 | ThiingsGrid renders and physics loop works | smoke (build) | `bun run build` in packages/web | N/A (build test) |
| REF-02 | VtonModal compiles and external interface unchanged | type check | `bun run typecheck` | N/A |
| REF-03 | ItemDetailCard compiles, adopt logic works | type check + smoke | `bun run typecheck` | N/A |
| REF-04 | ImageDetailModal compiles and animation refs are valid | type check + smoke | `bun run typecheck` | N/A |

**Note:** These components have no existing unit tests. Vitest unit tests are Phase 48 scope (REF-05/E2E-04). For Phase 46, the verification strategy is: TypeScript strict mode type-check passes + `bun run build` succeeds = refactoring is non-breaking.

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run typecheck`
- **Per wave merge:** `cd packages/web && bun run build`
- **Phase gate:** Build success + no TypeScript errors before closing Phase 46

### Wave 0 Gaps
None — no new test files needed for Phase 46. Build/typecheck is sufficient verification. Phase 48 adds Vitest units and data-testid markers.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of ThiingsGrid.tsx (950 lines), VtonModal.tsx (907 lines), ItemDetailCard.tsx (769 lines), ImageDetailModal.tsx (730 lines)
- Phase 44 decisions in STATE.md — established cleanup patterns
- Existing hooks in `packages/web/lib/hooks/` — confirms useDebounce, useSolutions exist

### Secondary (MEDIUM confidence)
- ThiingsGrid.best-practices.md — documents expected external API contract
- vtonStore.ts — confirms Zustand store boundaries (what stays in store vs. local state)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed, all patterns already in codebase
- Architecture: HIGH — extracted by reading actual component code line-by-line
- Pitfalls: HIGH — identified from direct inspection of problematic patterns (ctxRef sharing, passive event listeners, class lifecycle)

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable code — no fast-moving external dependencies)
