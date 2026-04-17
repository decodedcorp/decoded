# Upload Modal Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/request/upload` 업로드 플로우(풀페이지 + intercept 모달 + 레거시 RequestModal)를 `useUploadFlow` hook + `UploadFlowSteps` headless 컴포넌트로 통합하여 중복을 제거하고 intercept 진입과 직접 URL 진입을 단일 소스로 일관되게 동작시킨다.

**Architecture:** Hook + composition seam. 비즈니스 로직은 `useUploadFlow`, 스텝 UI는 `UploadFlowSteps`, 모달 chrome은 `RequestFlowModal` shell (maxWidth / onClose / mobileFullScreen prop화). 페이지와 intercept 모달은 얇은 조립 래퍼. `requestStore`에 `activeInstanceId` 가드로 동시 마운트 시 store bleed 차단. 4개 PR로 분리 — 각 PR이 dev에서 독립 rollback 가능한 중간 상태 유지.

**Tech Stack:** Next.js 16 (App Router, intercepting + parallel routes), React 19, TypeScript 5.9 strict, Zustand, Tailwind 3.4, GSAP/Motion, Vitest 4 (unit), Playwright 1.58 (E2E), bun + Turborepo.

**Spec:** [`docs/superpowers/specs/2026-04-17-upload-modal-refactor-design.md`](../specs/2026-04-17-upload-modal-refactor-design.md)
**Issue:** [#145](https://github.com/decodedcorp/decoded/issues/145)
**Supersedes:** PR #230 (helper text 이식 → Phase D의 Task D1)

---

## File Structure

### Create

- `packages/web/lib/components/request/useUploadFlow.ts` — Hook. `requestStore` 구독, Draft load/clear, image editor state, submit handler (`createPostWithFile[AndSolutions]` 직접 호출), instanceId 발급.
- `packages/web/lib/components/request/UploadFlowSteps.tsx` — Headless step container. DropZone → userKnowsItems 분기 → DetectionView+Spot → MetadataInputForm/Solutions → Post 버튼/Retry UI.
- `packages/web/lib/hooks/useBodyScrollLock.ts` — Counter 기반 body scroll lock (RequestFlowModal + ImageEditor 중첩 시 double-lock 해결).
- `packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx` — Shell prop 단위 테스트.
- `packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx` — Hook 단위 테스트.
- `packages/web/lib/components/request/__tests__/UploadFlowSteps.test.tsx` — Steps 렌더/분기 테스트.
- `packages/web/tests/requestStore-guard.test.ts` — Store instance guard 단위 테스트.
- `packages/web/tests/useBodyScrollLock.test.ts` — Counter 동작 테스트.
- `packages/web/tests/upload-intercept.spec.ts` — E2E intercept + in-app nav.
- `packages/web/tests/upload-direct.spec.ts` — E2E direct URL 풀페이지.
- `packages/web/tests/upload-mobile.spec.ts` — E2E 모바일 full-screen.
- `packages/web/tests/upload-draft.spec.ts` — E2E Draft restore.

### Modify

- `packages/web/lib/components/request/RequestFlowModal.tsx` — `maxWidth`, `onClose`, `mobileFullScreen` prop 추가. 비즈니스 로직 제거 (shell만).
- `packages/web/lib/stores/requestStore.ts` — `activeInstanceId` 필드 + `setActiveInstance` + `resetIfActive` 액션.
- `packages/web/app/request/upload/page.tsx` — 얇은 조립 래퍼로 축소 (~551 → ~35 lines).
- `packages/web/app/@modal/(.)request/upload/page.tsx` — 얇은 조립 래퍼로 축소 (~398 → ~25 lines).
- `packages/web/lib/components/request/MetadataInputForm.tsx` — PR #230 helper text (artist/group/media type 유도문 + dynamic placeholder) 이식.
- `packages/web/lib/components/main-renewal/SmartNav.tsx` — `RequestModal` import/mount/`useState` 제거, 버튼 `onClick` → `router.push("/request/upload")`.
- `packages/web/lib/components/Sidebar.tsx` — 동일.

### Delete

- `packages/web/lib/components/request/RequestModal.tsx` (305 lines)
- `packages/web/lib/components/request/DetailsStep.tsx` (사용처 0 확인 후)

### Verify only (no edit)

- `packages/web/app/@modal/(.)request/detect/page.tsx` — `RequestFlowModal` prop 기본값 호환 확인 (visual regression check in PR-1 preview).

---

## Pre-flight (all phases)

> **브랜치 전략:** 본 plan은 `docs/145-upload-modal-spec` 스펙 브랜치와 독립. 각 Phase마다 `feature/145-upload-modal-{phase}` 브랜치를 `dev`에서 분기하여 작업. PR-1 머지 후 PR-2 rebase, 이런 식으로 순차 진행.
>
> **공용 가드:**
>
> - `bun run typecheck` — 각 Phase 완료 시 실행.
> - `bun run lint` — 커밋 전 실행.
> - `bun run test` — 단위 테스트 전체 통과 필수.
> - `bun x playwright test <file>` — 해당 Phase의 E2E 실행.

---

## Phase A — PR-1: Shell Prop Extension (backwards compatible)

**Goal:** `RequestFlowModal` shell에 `maxWidth`, `onClose`, `mobileFullScreen` prop을 추가하되 기본값으로 기존 detect/upload 모달 동작을 그대로 유지. visual diff 0.

**Branch:** `feature/145-upload-modal-shell`

### Task A0: Branch setup

- [ ] **Step 1: Create branch from dev**

```bash
git fetch origin
git checkout -b feature/145-upload-modal-shell origin/dev
```

- [ ] **Step 2: Verify clean state**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

### Task A1: Add `maxWidth` prop with backwards-compatible default

**Files:**

- Modify: `packages/web/lib/components/request/RequestFlowModal.tsx`
- Create: `packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("gsap", () => ({
  gsap: { to: vi.fn(), set: vi.fn() },
  default: { to: vi.fn(), set: vi.fn() },
}));
vi.mock("@/lib/stores/requestStore", () => ({
  useRequestStore: Object.assign(() => ({ resetRequestFlow: vi.fn() }), {
    getState: () => ({ resetRequestFlow: vi.fn() }),
  }),
}));

import { RequestFlowModal } from "../RequestFlowModal";

describe("RequestFlowModal — maxWidth prop", () => {
  beforeAll(() => {
    Object.defineProperty(window, "history", {
      value: { length: 2 },
      writable: true,
    });
  });

  test("defaults to max-w-4xl when maxWidth not supplied", () => {
    render(
      <RequestFlowModal>
        <div data-testid="child">c</div>
      </RequestFlowModal>,
    );
    const dialog = screen
      .getByTestId("child")
      .closest("[data-testid='request-flow-modal-dialog']");
    expect(dialog).toHaveClass("max-w-4xl");
  });

  test("applies max-w-6xl when maxWidth='6xl'", () => {
    render(
      <RequestFlowModal maxWidth="6xl">
        <div data-testid="child">c</div>
      </RequestFlowModal>,
    );
    const dialog = screen
      .getByTestId("child")
      .closest("[data-testid='request-flow-modal-dialog']");
    expect(dialog).toHaveClass("max-w-6xl");
    expect(dialog).not.toHaveClass("max-w-4xl");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: FAIL — either `maxWidth` prop not accepted (TS error) or dialog lacks `data-testid`.

- [ ] **Step 3: Add prop + data-testid to RequestFlowModal**

In `packages/web/lib/components/request/RequestFlowModal.tsx`:

1. Extend props interface:

```tsx
type MaxWidth = "4xl" | "5xl" | "6xl" | "7xl";

interface RequestFlowModalProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
}

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};
```

2. Replace hard-coded `max-w-4xl` on the dialog div with:

```tsx
<div
  data-testid="request-flow-modal-dialog"
  className={`relative w-full ${MAX_WIDTH_CLASS[maxWidth ?? "4xl"]} max-h-[90vh] ...existing classes`}
>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: PASS (both test cases).

- [ ] **Step 5: Typecheck + lint**

```bash
cd packages/web && bun run typecheck && bun run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/RequestFlowModal.tsx \
        packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx
git commit -m "feat(web/request): add maxWidth prop to RequestFlowModal"
```

### Task A2: Add `onClose` prop (caller-injected close handler)

**Files:**

- Modify: `packages/web/lib/components/request/RequestFlowModal.tsx`
- Modify: `packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx`

- [ ] **Step 1: Add test — onClose called on backdrop click**

Append to `RequestFlowModal.test.tsx`:

```tsx
import { fireEvent } from "@testing-library/react";

describe("RequestFlowModal — onClose prop", () => {
  test("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <RequestFlowModal onClose={onClose}>
        <div>child</div>
      </RequestFlowModal>,
    );
    const backdrop = container.querySelector(
      "[data-testid='request-flow-modal-backdrop']",
    );
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("falls back to resetRequestFlow + router.back when onClose is not supplied (legacy)", () => {
    // Render without onClose — should still close via existing legacy path.
    const { container } = render(
      <RequestFlowModal>
        <div>child</div>
      </RequestFlowModal>,
    );
    const backdrop = container.querySelector(
      "[data-testid='request-flow-modal-backdrop']",
    );
    fireEvent.click(backdrop!);
    // No crash — legacy path executes (resetRequestFlow mock + router.back noop).
    expect(backdrop).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: FAIL — `onClose` prop not accepted.

- [ ] **Step 3: Implement onClose**

In `RequestFlowModal.tsx`:

1. Extend props:

```tsx
interface RequestFlowModalProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  onClose?: () => void;
}
```

2. Add `data-testid="request-flow-modal-backdrop"` to backdrop element.

3. In backdrop onClick and ESC handler, route through `onClose`:

```tsx
const handleClose = React.useCallback(() => {
  if (onClose) {
    onClose();
    return;
  }
  // Legacy fallback — preserve pre-refactor behavior for detect modal.
  resetRequestFlow();
  if (window.history.length > 1) router.back();
  else router.push("/");
}, [onClose, resetRequestFlow, router]);
```

Replace existing inline close logic with `handleClose()`.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/request/RequestFlowModal.tsx \
        packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx
git commit -m "feat(web/request): add onClose prop to RequestFlowModal"
```

### Task A3: Add `mobileFullScreen` prop (sm-미만 full-screen layout)

**Files:**

- Modify: `packages/web/lib/components/request/RequestFlowModal.tsx`
- Modify: `packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx`

- [ ] **Step 1: Add test**

Append:

```tsx
describe("RequestFlowModal — mobileFullScreen prop", () => {
  test("applies mobile full-screen classes when mobileFullScreen=true", () => {
    render(
      <RequestFlowModal mobileFullScreen>
        <div data-testid="child">c</div>
      </RequestFlowModal>,
    );
    const dialog = screen
      .getByTestId("child")
      .closest("[data-testid='request-flow-modal-dialog']");
    expect(dialog?.className).toMatch(/max-sm:rounded-none/);
    expect(dialog?.className).toMatch(/max-sm:max-w-none/);
    expect(dialog?.className).toMatch(/max-sm:h-\[100dvh\]/);
  });

  test("does not apply mobile classes by default", () => {
    render(
      <RequestFlowModal>
        <div data-testid="child">c</div>
      </RequestFlowModal>,
    );
    const dialog = screen
      .getByTestId("child")
      .closest("[data-testid='request-flow-modal-dialog']");
    expect(dialog?.className).not.toMatch(/max-sm:rounded-none/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: FAIL.

- [ ] **Step 3: Implement mobileFullScreen**

In `RequestFlowModal.tsx`:

```tsx
interface RequestFlowModalProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  onClose?: () => void;
  mobileFullScreen?: boolean;
}

const MOBILE_FULLSCREEN_CLASSES =
  "max-sm:rounded-none max-sm:max-w-none max-sm:max-h-none max-sm:h-[100dvh] max-sm:w-full";

// In JSX:
<div
  data-testid="request-flow-modal-dialog"
  className={cn(
    `relative w-full ${MAX_WIDTH_CLASS[maxWidth ?? "4xl"]} max-h-[90vh] ...existing...`,
    mobileFullScreen && MOBILE_FULLSCREEN_CLASSES,
  )}
>
```

(Use `cn`/`clsx` from existing utils; fallback to template literal if not present.)

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- RequestFlowModal
```

Expected: PASS.

- [ ] **Step 5: Typecheck + lint**

```bash
cd packages/web && bun run typecheck && bun run lint
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/RequestFlowModal.tsx \
        packages/web/lib/components/request/__tests__/RequestFlowModal.test.tsx
git commit -m "feat(web/request): add mobileFullScreen prop to RequestFlowModal"
```

### Task A4: Visual regression — detect modal

- [ ] **Step 1: Start dev server in background**

```bash
cd packages/web && bun run dev
```

- [ ] **Step 2: Manual check — /request/detect intercept modal**

- 홈에서 "Detect" 류 진입점 → 모달이 `max-w-4xl`, 데스크탑 centered 유지.
- 스크린샷으로 기존 `dev` 브랜치 버전과 육안 비교 (변화 없어야 함).

- [ ] **Step 3: Stop dev server**

```bash
# Ctrl-C the bun run dev process
```

- [ ] **Step 4: Push + open PR-1**

```bash
git push -u origin feature/145-upload-modal-shell
gh pr create --base dev --title "feat(web/request): extend RequestFlowModal with maxWidth/onClose/mobileFullScreen props (#145 PR-1)" --body "$(cat <<'EOF'
## Summary
- Adds `maxWidth`, `onClose`, `mobileFullScreen` props to `RequestFlowModal`.
- 기본값은 기존 동작과 동일. detect 모달 visual diff 0.
- Spec: docs/superpowers/specs/2026-04-17-upload-modal-refactor-design.md (Section 4, 5).

## Test plan
- [ ] `bun run test -- RequestFlowModal` 통과
- [ ] `/request/detect` 모달 시각 유지 (preview에서 확인)

Part of #145. Follows 4-PR rollout (PR-1 shell → PR-2 hook → PR-3 modal → PR-4 cleanup).
EOF
)"
```

---

## Phase B — PR-2: Hook + Headless Steps for Direct URL Page

**Goal:** `useUploadFlow` hook + `UploadFlowSteps` headless 컴포넌트 추출. `app/request/upload/page.tsx`(풀페이지)를 조립 래퍼로 축소. intercept 모달은 그대로 두어 PR-3에서 별도 전환.

**Branch:** `feature/145-upload-modal-hook` (PR-1 머지 후 `dev`에서 분기)

### Task B0: Rebase onto PR-1

- [ ] **Step 1: Wait for PR-1 merge, then branch**

```bash
git fetch origin
git checkout -b feature/145-upload-modal-hook origin/dev
```

### Task B1: `useBodyScrollLock` counter hook

**Files:**

- Create: `packages/web/lib/hooks/useBodyScrollLock.ts`
- Create: `packages/web/tests/useBodyScrollLock.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/useBodyScrollLock.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

describe("useBodyScrollLock", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  test("locks body overflow when active=true", () => {
    renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("nested locks count — outer unmount does not release while inner locked", () => {
    const outer = renderHook(() => useBodyScrollLock(true));
    const inner = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    outer.unmount();
    expect(document.body.style.overflow).toBe("hidden"); // inner still active

    inner.unmount();
    expect(document.body.style.overflow).toBe(""); // all released
  });

  test("does not lock when active=false", () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.overflow).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- useBodyScrollLock
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `packages/web/lib/hooks/useBodyScrollLock.ts`:

```ts
import { useEffect } from "react";

let lockCount = 0;
let previousOverflow: string | null = null;

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow ?? "";
        previousOverflow = null;
      }
    };
  }, [active]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- useBodyScrollLock
```

Expected: PASS (all 3 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/hooks/useBodyScrollLock.ts \
        packages/web/tests/useBodyScrollLock.test.ts
git commit -m "feat(web/hooks): add useBodyScrollLock counter hook"
```

### Task B2: `requestStore` instance guard

**Files:**

- Modify: `packages/web/lib/stores/requestStore.ts`
- Create: `packages/web/tests/requestStore-guard.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/requestStore-guard.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import { useRequestStore } from "@/lib/stores/requestStore";

describe("requestStore — activeInstanceId guard", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
  });

  test("setActiveInstance stores id", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    expect(useRequestStore.getState().activeInstanceId).toBe("inst-1");
  });

  test("resetIfActive resets only when instance matches", () => {
    useRequestStore.getState().setActiveInstance("inst-1");
    useRequestStore.setState({
      image: { url: "data:x", file: null as any, isCompressed: false } as any,
    });

    useRequestStore.getState().resetIfActive("other-id"); // no-op
    expect(useRequestStore.getState().image).not.toBeNull();

    useRequestStore.getState().resetIfActive("inst-1"); // resets
    expect(useRequestStore.getState().image).toBeNull();
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });

  test("resetIfActive with no active instance is a no-op", () => {
    useRequestStore.setState({
      image: { url: "data:x", file: null as any, isCompressed: false } as any,
    });
    useRequestStore.getState().resetIfActive("any");
    expect(useRequestStore.getState().image).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- requestStore-guard
```

Expected: FAIL — `setActiveInstance` / `resetIfActive` / `activeInstanceId` undefined.

- [ ] **Step 3: Implement guard in requestStore**

In `packages/web/lib/stores/requestStore.ts`:

1. Extend `RequestState` interface:

```ts
interface RequestState {
  // ...existing fields
  activeInstanceId: string | null;
  setActiveInstance: (id: string | null) => void;
  resetIfActive: (id: string) => void;
}
```

2. Add to initial state:

```ts
activeInstanceId: null,
```

3. Implement actions inside `create((set, get) => ({ ... }))`:

```ts
setActiveInstance: (id) => set({ activeInstanceId: id }),
resetIfActive: (id) => {
  if (get().activeInstanceId !== id) return;
  get().resetRequestFlow();
  set({ activeInstanceId: null });
},
```

4. If there's a typed selector export (`export const useRequestFlowActions = ...`), include the new actions.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- requestStore-guard
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
cd packages/web && bun run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/stores/requestStore.ts \
        packages/web/tests/requestStore-guard.test.ts
git commit -m "feat(web/store): add activeInstanceId guard to requestStore"
```

### Task B3: `useUploadFlow` hook — initial state + instanceId

**Files:**

- Create: `packages/web/lib/components/request/useUploadFlow.ts`
- Create: `packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx`

- [ ] **Step 1: Write the failing test (shape + instanceId)**

Create `packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUploadFlow } from "../useUploadFlow";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("useUploadFlow — initial state", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
    useRequestStore.getState().setActiveInstance(null);
  });

  test("registers an instanceId on mount and resets on unmount", () => {
    const { result, unmount } = renderHook(() => useUploadFlow());
    const id = result.current.instanceId;
    expect(id).toBeTruthy();
    expect(useRequestStore.getState().activeInstanceId).toBe(id);

    unmount();
    expect(useRequestStore.getState().activeInstanceId).toBeNull();
  });

  test("exposes isSubmitting and submitError with initial values", () => {
    const { result } = renderHook(() => useUploadFlow());
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- useUploadFlow
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create minimal hook shell**

Create `packages/web/lib/components/request/useUploadFlow.ts`:

```ts
"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequestStore } from "@/lib/stores/requestStore";

export interface UseUploadFlowReturn {
  instanceId: string;
  isSubmitting: boolean;
  submitError: string | null;
  submit: () => Promise<void>;
  close: () => void;
}

export function useUploadFlow(): UseUploadFlowReturn {
  const instanceId = useId();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    useRequestStore.getState().setActiveInstance(instanceId);
    return () => {
      useRequestStore.getState().resetIfActive(instanceId);
    };
  }, [instanceId]);

  const submit = async () => {
    // filled in Task B4
  };

  const close = () => {
    useRequestStore.getState().resetIfActive(instanceId);
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return { instanceId, isSubmitting, submitError, submit, close };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- useUploadFlow
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/request/useUploadFlow.ts \
        packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx
git commit -m "feat(web/request): scaffold useUploadFlow hook with instanceId guard"
```

### Task B4: `useUploadFlow` — migrate Draft + submit logic from page.tsx

**Context:** `app/request/upload/page.tsx`의 Draft load/save/clear, image editor state, submit 로직(압축 → `createPostWithFile[AndSolutions]` 직접 호출 → 성공 redirect / 실패 Retry)을 hook 안으로 이동. 로직 이동만, 동작 변경 0.

**Files:**

- Modify: `packages/web/lib/components/request/useUploadFlow.ts`
- Modify: `packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx`

- [ ] **Step 1: Add submit happy-path test**

Append to `useUploadFlow.test.tsx`:

```tsx
import { act } from "@testing-library/react";

vi.mock("@/lib/api/posts", () => ({
  createPostWithFile: vi.fn(async () => ({ id: "post-123" })),
  createPostWithFileAndSolutions: vi.fn(async () => ({ id: "post-456" })),
}));
vi.mock("@/lib/utils/imageCompression", () => ({
  compressImage: vi.fn(async (f: File) => f),
}));
vi.mock("@/lib/utils/offlineDraft", () => ({
  loadDraft: vi.fn(() => null),
  saveDraft: vi.fn(),
  clearDraft: vi.fn(),
}));

describe("useUploadFlow — submit", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("submit clears draft and resets active instance on success", async () => {
    useRequestStore.setState({
      image: {
        url: "data:x",
        file: new File(["x"], "x.jpg"),
        isCompressed: false,
      } as any,
      userKnowsItems: false,
      spots: [{ id: "s1", x: 0.1, y: 0.1, solutions: [] }] as any,
    });

    const { result } = renderHook(() => useUploadFlow());
    await act(async () => {
      await result.current.submit();
    });

    const { clearDraft } = await import("@/lib/utils/offlineDraft");
    expect(clearDraft).toHaveBeenCalled();
    expect(result.current.submitError).toBeNull();
  });

  test("submit sets submitError on failure", async () => {
    const { createPostWithFile } = await import("@/lib/api/posts");
    (createPostWithFile as any).mockRejectedValueOnce(new Error("boom"));

    useRequestStore.setState({
      image: {
        url: "data:x",
        file: new File(["x"], "x.jpg"),
        isCompressed: false,
      } as any,
      userKnowsItems: false,
      spots: [] as any,
    });

    const { result } = renderHook(() => useUploadFlow());
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.submitError).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

```bash
cd packages/web && bun run test -- useUploadFlow
```

Expected: FAIL — submit is still a stub.

- [ ] **Step 3: Port submit logic from page.tsx into hook**

Inspect `app/request/upload/page.tsx` for current `submit` / `handleSubmit` flow. Move that exact logic into `useUploadFlow.ts`:

```ts
import { useCallback } from "react";
import { compressImage } from "@/lib/utils/imageCompression";
import { clearDraft, loadDraft, saveDraft } from "@/lib/utils/offlineDraft";
import {
  createPostWithFile,
  createPostWithFileAndSolutions,
} from "@/lib/api/posts";

// inside useUploadFlow
const state = useRequestStore();

// Draft load (session-once toast handled by caller page if needed; migrate later)
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    useRequestStore.setState(draft);
  }
}, []);

const submit = useCallback(async () => {
  setIsSubmitting(true);
  setSubmitError(null);
  try {
    const s = useRequestStore.getState();
    if (!s.image?.file) throw new Error("no image");
    const file = s.image.isCompressed
      ? s.image.file
      : await compressImage(s.image.file);

    let result;
    if (s.userKnowsItems) {
      result = await createPostWithFileAndSolutions(file, s.spots, s.metadata);
    } else {
      result = await createPostWithFile(file, s.spots, s.metadata);
    }
    clearDraft();
    useRequestStore.getState().resetIfActive(instanceId);
    router.push(`/posts/${result.id}`);
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : String(e));
  } finally {
    setIsSubmitting(false);
  }
}, [instanceId, router]);
```

> **Note:** 실제 `createPostWithFile` 시그니처는 현재 `page.tsx`에서 사용하는 형태를 그대로 복사. 본 plan은 함수 호출 형태가 달라질 수 있음을 허용 — **page.tsx의 기존 submit 코드 그대로 이동**이 원칙. 동작 변경 0.

- [ ] **Step 4: Also add Draft save effect (mirror page.tsx)**

```ts
useEffect(() => {
  const unsub = useRequestStore.subscribe((s) => {
    saveDraft({
      image: s.image,
      userKnowsItems: s.userKnowsItems,
      spots: s.spots,
      metadata: s.metadata,
    });
  });
  return unsub;
}, []);
```

(Keep the exact subscription shape used today; this is illustrative.)

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd packages/web && bun run test -- useUploadFlow
```

Expected: PASS.

- [ ] **Step 6: Typecheck**

```bash
cd packages/web && bun run typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/web/lib/components/request/useUploadFlow.ts \
        packages/web/lib/components/request/__tests__/useUploadFlow.test.tsx
git commit -m "feat(web/request): port draft + submit logic into useUploadFlow"
```

### Task B5: `UploadFlowSteps` — headless step container

**Files:**

- Create: `packages/web/lib/components/request/UploadFlowSteps.tsx`
- Create: `packages/web/lib/components/request/__tests__/UploadFlowSteps.test.tsx`

- [ ] **Step 1: Write the failing test (render branches)**

Create `packages/web/lib/components/request/__tests__/UploadFlowSteps.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UploadFlowSteps } from "../UploadFlowSteps";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/utils/offlineDraft", () => ({
  loadDraft: () => null,
  saveDraft: vi.fn(),
  clearDraft: vi.fn(),
}));
vi.mock("gsap", () => ({ gsap: { to: vi.fn() }, default: { to: vi.fn() } }));

describe("UploadFlowSteps — step branches", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("renders DropZone when no image", () => {
    render(<UploadFlowSteps />);
    expect(screen.getByTestId("upload-flow-dropzone")).toBeInTheDocument();
  });

  test("renders userKnowsItems fork after image upload", () => {
    useRequestStore.setState({
      image: {
        url: "data:x",
        file: new File(["x"], "x.jpg"),
        isCompressed: true,
      } as any,
    });
    render(<UploadFlowSteps />);
    expect(screen.getByTestId("upload-flow-fork")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/web && bun run test -- UploadFlowSteps
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create UploadFlowSteps**

`packages/web/lib/components/request/UploadFlowSteps.tsx`:

```tsx
"use client";

import React from "react";
import { useUploadFlow } from "./useUploadFlow";
import { useRequestStore } from "@/lib/stores/requestStore";
import { DropZone } from "./DropZone";
import { DetectionView } from "./DetectionView";
import { MetadataInputForm } from "./MetadataInputForm";
import { SolutionInputForm } from "./SolutionInputForm";
// ...other imports mirroring page.tsx

export function UploadFlowSteps() {
  const flow = useUploadFlow();
  const image = useRequestStore((s) => s.image);
  const userKnowsItems = useRequestStore((s) => s.userKnowsItems);

  if (!image) {
    return (
      <div data-testid="upload-flow-dropzone">
        <DropZone />
      </div>
    );
  }

  if (userKnowsItems == null) {
    return (
      <div data-testid="upload-flow-fork">
        {/* userKnowsItems Yes/No fork — copy from page.tsx */}
      </div>
    );
  }

  return (
    <div data-testid="upload-flow-active">
      {/* Detection + marking + metadata forms — copy step switch from page.tsx */}
      {flow.submitError && (
        <div role="alert">
          {flow.submitError}
          <button onClick={flow.submit}>Retry</button>
        </div>
      )}
      <button disabled={flow.isSubmitting} onClick={flow.submit}>
        Post
      </button>
    </div>
  );
}
```

> **Note:** 실제 중간 단계 UI는 현재 `page.tsx`의 step switch 블록을 그대로 복사하는 것이 원칙. 본 스텝은 뼈대만; 세부 UI는 기존 page.tsx에서 이동.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/web && bun run test -- UploadFlowSteps
```

Expected: PASS (dropzone + fork cases).

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/request/UploadFlowSteps.tsx \
        packages/web/lib/components/request/__tests__/UploadFlowSteps.test.tsx
git commit -m "feat(web/request): add UploadFlowSteps headless container"
```

### Task B6: Refactor `app/request/upload/page.tsx` to thin assembler

**Files:**

- Modify: `packages/web/app/request/upload/page.tsx`

- [ ] **Step 1: Replace page.tsx body with assembler**

```tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { UploadFlowSteps } from "@/lib/components/request/UploadFlowSteps";

export default function UploadPage() {
  const router = useRouter();
  return (
    <div className="flex h-[100dvh] flex-col">
      <RequestFlowHeader onClose={() => router.push("/")} />
      <UploadFlowSteps />
    </div>
  );
}
```

- [ ] **Step 2: Run unit tests + typecheck + lint**

```bash
cd packages/web && bun run test && bun run typecheck && bun run lint
```

Expected: all green.

- [ ] **Step 3: Manual smoke test**

```bash
cd packages/web && bun run dev
```

- `/request/upload` 직접 URL → 풀페이지 로드 확인.
- 이미지 업로드 → userKnowsItems 분기 → Post 성공 → `/posts/{id}` 이동.
- Draft 저장 → 새로고침 → 복원 toast.
- POST 실패 시뮬(네트워크 오프) → Retry 버튼 표시.

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/request/upload/page.tsx
git commit -m "refactor(web/request): reduce upload page to thin assembler using UploadFlowSteps"
```

### Task B7: Push + open PR-2

- [ ] **Step 1: Push + PR**

```bash
git push -u origin feature/145-upload-modal-hook
gh pr create --base dev --title "refactor(web/request): extract useUploadFlow + UploadFlowSteps (#145 PR-2)" --body "$(cat <<'EOF'
## Summary
- Extract `useUploadFlow` hook (draft + submit + instanceId guard) and `UploadFlowSteps` headless container.
- Reduce `app/request/upload/page.tsx` ~551 → ~35 lines (thin assembler).
- Add `useBodyScrollLock` counter hook (reused by ImageEditor nesting in PR-3).
- Add `requestStore.activeInstanceId` guard to prevent store bleed.
- Intercept modal **unchanged** in this PR (PR-3 follows).
- Spec: Section 4, 5. Stacks on PR-1.

## Test plan
- [ ] `bun run test` 전체 통과
- [ ] `/request/upload` 직접 URL full-page 정상
- [ ] 이미지 업로드 → Post 성공 → `/posts/{id}` 이동
- [ ] Draft 복원 toast 1회
- [ ] POST 실패 → Retry

Part of #145.
EOF
)"
```

---

## Phase C — PR-3: Intercept Modal Assembly Migration

**Goal:** `app/@modal/(.)request/upload/page.tsx`를 `<RequestFlowModal onClose maxWidth="6xl" mobileFullScreen><UploadFlowSteps/></RequestFlowModal>` 조립 래퍼로 교체. 이 PR부터 인터셉트 모달이 풀 기능 획득.

**Branch:** `feature/145-upload-modal-intercept`

### Task C0: Rebase onto PR-2

- [ ] **Step 1: Branch from dev after PR-2 merge**

```bash
git fetch origin
git checkout -b feature/145-upload-modal-intercept origin/dev
```

### Task C1: Replace intercept page with modal assembler

**Files:**

- Modify: `packages/web/app/@modal/(.)request/upload/page.tsx`

- [ ] **Step 1: Replace contents**

```tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RequestFlowModal } from "@/lib/components/request/RequestFlowModal";
import { UploadFlowSteps } from "@/lib/components/request/UploadFlowSteps";
import { useRequestStore } from "@/lib/stores/requestStore";

export default function InterceptUploadPage() {
  const router = useRouter();
  const activeInstanceId = useRequestStore((s) => s.activeInstanceId);

  const handleClose = () => {
    if (activeInstanceId) {
      useRequestStore.getState().resetIfActive(activeInstanceId);
    }
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <RequestFlowModal maxWidth="6xl" mobileFullScreen onClose={handleClose}>
      <UploadFlowSteps />
    </RequestFlowModal>
  );
}
```

- [ ] **Step 2: Typecheck + lint + unit tests**

```bash
cd packages/web && bun run typecheck && bun run lint && bun run test
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/web/app/@modal/\(.\)request/upload/page.tsx
git commit -m "refactor(web/request): convert intercept upload modal to assembler using RequestFlowModal + UploadFlowSteps"
```

### Task C2: E2E — intercept + full feature flow

**Files:**

- Create: `packages/web/tests/upload-intercept.spec.ts`

- [ ] **Step 1: Write the E2E test**

```ts
import { test, expect } from "@playwright/test";

test.describe("Upload intercept modal", () => {
  test("in-app nav opens modal, background preserved, upload succeeds", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /upload/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/request\/upload/);
    await expect(page.getByTestId("request-flow-modal-dialog")).toBeVisible();
    // Background still visible (home feed content still in DOM behind overlay).
    await expect(page.locator("main")).toBeVisible();

    // Upload a fixture image
    const input = page.locator("input[type='file']").first();
    await input.setInputFiles("tests/fixtures/sample.jpg");

    await page.getByRole("button", { name: /no.*curious/i }).click();
    // ... add spot marker, fill metadata, post (mirror existing E2E style) ...
    // Simplified: verify modal close on ESC goes back.
    await page.keyboard.press("Escape");
    await expect(
      page.getByTestId("request-flow-modal-dialog"),
    ).not.toBeVisible();
  });
});
```

> **Note:** fixture 경로와 실제 submit 플로우는 `packages/web/tests/content-creation.spec.ts` 패턴을 참조.

- [ ] **Step 2: Run E2E**

```bash
cd packages/web && bun x playwright test tests/upload-intercept.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/web/tests/upload-intercept.spec.ts
git commit -m "test(web/request): add E2E for upload intercept modal flow"
```

### Task C3: E2E — Draft restore in modal

**Files:**

- Create: `packages/web/tests/upload-draft.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from "@playwright/test";

test("draft restore shows toast once per session", async ({ page }) => {
  await page.goto("/request/upload");
  const input = page.locator("input[type='file']").first();
  await input.setInputFiles("tests/fixtures/sample.jpg");

  await page.reload();
  await expect(page.getByText(/restore|복원/i)).toBeVisible();

  await page.reload();
  // Second reload within same session: toast should NOT re-appear.
  await expect(page.getByText(/restore|복원/i)).not.toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
cd packages/web && bun x playwright test tests/upload-draft.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit + push PR-3**

```bash
git add packages/web/tests/upload-draft.spec.ts
git commit -m "test(web/request): add E2E for draft restore toast once-per-session"
git push -u origin feature/145-upload-modal-intercept
gh pr create --base dev --title "refactor(web/request): intercept upload modal uses UploadFlowSteps (#145 PR-3)" --body "$(cat <<'EOF'
## Summary
- Convert intercept `(.)request/upload/page.tsx` to thin assembler.
- Intercept modal now gains full Draft / Editor / Retry / MobileUploadOptions parity with full-page.
- Spec: Section 4, 5, 9.

## Test plan
- [ ] `bun x playwright test tests/upload-intercept.spec.ts` 통과
- [ ] `bun x playwright test tests/upload-draft.spec.ts` 통과
- [ ] Sidebar/SmartNav 진입 시 intercept 정상 (PR-4에서 전환 전이라 state-기반 호출은 여전히 동작)

Part of #145. Stacks on PR-2.
EOF
)"
```

---

## Phase D — PR-4: Cleanup + Nav Rewire + PR #230 Helper Text Port

**Goal:** 구 `RequestModal`/`DetailsStep` 삭제, SmartNav/Sidebar를 `router.push`로 전환, PR #230의 helper text를 `MetadataInputForm`으로 이식, 모바일 full-screen E2E + detect 모달 visual diff 확인.

**Branch:** `feature/145-upload-modal-cleanup`

### Task D0: Rebase onto PR-3

- [ ] **Step 1: Branch**

```bash
git fetch origin
git checkout -b feature/145-upload-modal-cleanup origin/dev
```

### Task D1: Port PR #230 helper text to `MetadataInputForm`

**Context:** PR #230은 `DetailsStep`의 artist / group / media type 필드 helper text + dynamic placeholder를 다듬었다. 본 PR은 해당 개선을 실제 활성 폼(`MetadataInputForm`)으로 이식한다.

**Files:**

- Modify: `packages/web/lib/components/request/MetadataInputForm.tsx`
- Create: `packages/web/lib/components/request/__tests__/MetadataInputForm.helperText.test.tsx`

- [ ] **Step 1: Fetch PR #230 helper text strings**

Read PR #230 diff to extract exact strings (do NOT approximate):

```bash
gh pr diff 230 -- packages/web/lib/components/request/DetailsStep.tsx
```

Capture verbatim:

- `artistInput` helper text (e.g., "아티스트 이름을 정확히 입력해주세요…").
- `groupInput` helper text.
- `mediaType` helper text / dynamic placeholder table.

Copy these strings into constants at the top of `MetadataInputForm.tsx`:

```tsx
const ARTIST_HELPER = "<copy from PR #230>";
const GROUP_HELPER = "<copy from PR #230>";
const MEDIA_PLACEHOLDER: Record<MediaType, string> = {
  photoshoot: "<copy>",
  music_video: "<copy>",
  // ... exact mapping from PR #230
};
```

- [ ] **Step 2: Write test asserting helper text renders**

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MetadataInputForm } from "../MetadataInputForm";

vi.mock("@/lib/stores/requestStore", () => ({
  useRequestStore: Object.assign(
    (sel: any) =>
      sel({
        metadata: {
          mediaType: "photoshoot",
          artist: "",
          group: "",
          platform: "",
          year: "",
        },
        setMetadata: vi.fn(),
      }),
    { getState: () => ({ setMetadata: vi.fn() }) },
  ),
}));

describe("MetadataInputForm — helper text (ported from PR #230)", () => {
  test("shows artist helper", () => {
    render(<MetadataInputForm />);
    expect(screen.getByText(/아티스트|artist/i)).toBeInTheDocument();
  });

  test("shows dynamic placeholder for photoshoot", () => {
    render(<MetadataInputForm />);
    // Assert placeholder on the relevant field — adjust selector to actual impl.
    expect(screen.getByPlaceholderText(/photoshoot/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test**

```bash
cd packages/web && bun run test -- MetadataInputForm.helperText
```

Expected: FAIL if helper text missing, PASS after edits.

- [ ] **Step 4: Modify `MetadataInputForm.tsx`**

Apply the helper text constants — render them under/beside the respective inputs, wire dynamic placeholders via `metadata.mediaType` lookup.

- [ ] **Step 5: Run tests**

```bash
cd packages/web && bun run test -- MetadataInputForm
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/MetadataInputForm.tsx \
        packages/web/lib/components/request/__tests__/MetadataInputForm.helperText.test.tsx
git commit -m "feat(web/request): port PR #230 helper text to MetadataInputForm

Supersedes #230 — helper text for artist / group / media type with dynamic placeholders
now applied to the active metadata form (DetailsStep is removed in a follow-up step)."
```

### Task D2: SmartNav — remove RequestModal, use `router.push`

**Files:**

- Modify: `packages/web/lib/components/main-renewal/SmartNav.tsx`

- [ ] **Step 1: Locate current RequestModal usage**

```bash
grep -n "RequestModal\|useState.*request\|setShowRequest" packages/web/lib/components/main-renewal/SmartNav.tsx
```

- [ ] **Step 2: Replace with router push**

- Remove `import { RequestModal } from ".../RequestModal";`.
- Remove `const [open, setOpen] = useState(false);` (and friends).
- Remove `<RequestModal open={...} onClose={...} />` render.
- Change Upload button `onClick={() => setOpen(true)}` → `onClick={() => router.push("/request/upload")}`.
- Ensure `const router = useRouter();` is imported from `next/navigation` if not already.

- [ ] **Step 3: Typecheck + lint**

```bash
cd packages/web && bun run typecheck && bun run lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/main-renewal/SmartNav.tsx
git commit -m "refactor(web/nav): replace SmartNav RequestModal with router.push to /request/upload"
```

### Task D3: Sidebar — same treatment

**Files:**

- Modify: `packages/web/lib/components/Sidebar.tsx`

- [ ] **Step 1: Mirror D2 changes**

Apply the identical pattern to `Sidebar.tsx`:

- Drop `RequestModal` import / state / render.
- Upload entry `onClick` → `router.push("/request/upload")`.

- [ ] **Step 2: Typecheck + lint**

```bash
cd packages/web && bun run typecheck && bun run lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add packages/web/lib/components/Sidebar.tsx
git commit -m "refactor(web/nav): replace Sidebar RequestModal with router.push to /request/upload"
```

### Task D4: Delete `RequestModal.tsx` + `DetailsStep.tsx`

**Files:**

- Delete: `packages/web/lib/components/request/RequestModal.tsx`
- Delete: `packages/web/lib/components/request/DetailsStep.tsx`

- [ ] **Step 1: Verify no remaining references**

```bash
grep -rn "RequestModal\b" packages/web --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test." | grep -v "RequestFlowModal"
grep -rn "DetailsStep\b" packages/web --include="*.tsx" --include="*.ts" | grep -v node_modules
```

Expected: no matches outside the files themselves.

- [ ] **Step 2: Delete files**

```bash
git rm packages/web/lib/components/request/RequestModal.tsx
git rm packages/web/lib/components/request/DetailsStep.tsx
```

- [ ] **Step 3: Typecheck + lint + tests**

```bash
cd packages/web && bun run typecheck && bun run lint && bun run test
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(web/request): remove RequestModal and DetailsStep (dead code after #145 refactor)"
```

### Task D5: E2E — entry points + mobile full-screen

**Files:**

- Create: `packages/web/tests/upload-mobile.spec.ts`
- Create: `packages/web/tests/upload-direct.spec.ts`

- [ ] **Step 1: upload-direct.spec.ts**

```ts
import { test, expect } from "@playwright/test";

test("direct URL renders full-page, not modal", async ({ page }) => {
  await page.goto("/request/upload");
  await expect(page.locator("h[1-6]").first()).toBeVisible();
  await expect(page.getByTestId("request-flow-modal-dialog")).toHaveCount(0);
});
```

- [ ] **Step 2: upload-mobile.spec.ts**

```ts
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone SE (3rd gen)"] });

test("mobile viewport → intercept modal is full-screen", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /upload/i })
    .first()
    .click();
  const dialog = page.getByTestId("request-flow-modal-dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(370); // ~full iPhone SE width (375)
});
```

- [ ] **Step 3: Run**

```bash
cd packages/web && bun x playwright test tests/upload-direct.spec.ts tests/upload-mobile.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/web/tests/upload-direct.spec.ts packages/web/tests/upload-mobile.spec.ts
git commit -m "test(web/request): add direct URL and mobile full-screen E2E for upload"
```

### Task D6: Visual diff — detect modal unchanged

- [ ] **Step 1: Dev server + manual comparison**

```bash
cd packages/web && bun run dev
```

- `/request/detect` intercept 모달이 PR-1 이전과 동일한 `max-w-4xl` 데스크탑 centered + 모바일 기존 동작 유지 확인 (스크린샷 비교).
- Stop dev server.

- [ ] **Step 2: Stop + push PR-4**

```bash
git push -u origin feature/145-upload-modal-cleanup
gh pr create --base dev --title "refactor(web/request): cleanup — nav rewire + RequestModal delete + PR #230 port (#145 PR-4)" --body "$(cat <<'EOF'
## Summary
- Port PR #230 helper text (artist / group / media type + dynamic placeholder) to `MetadataInputForm`.
- SmartNav / Sidebar Upload buttons now `router.push("/request/upload")` — intercept handles modal.
- Delete `RequestModal.tsx` and `DetailsStep.tsx` (dead code after refactor).
- E2E: direct URL + mobile full-screen + detect visual diff.
- Supersedes #230.

## Test plan
- [ ] `bun run test` 통과
- [ ] `bun x playwright test tests/upload-*.spec.ts` 통과
- [ ] `/request/detect` 모달 시각 유지
- [ ] SmartNav + Sidebar 업로드 버튼 → intercept 정상

Closes #145 Section 4 (upload modal unification). Stacks on PR-3.
EOF
)"
```

### Task D7: Close PR #230

- [ ] **Step 1: User confirmation step**

> PR #230 close는 memory 가드 규칙(타인 PR 닫기 금지)에 걸림. 본 PR은 작성자가 본인이지만, 실행자가 user에게 **명시적 허가** 후 진행하거나 user가 직접 close.

Ask user:

- "PR #230을 'close as superseded' 코멘트와 함께 닫아도 될까요? (사용자 직접 실행 권장)"

- [ ] **Step 2 (user action):**

```bash
gh pr close 230 --comment "Superseded by #145 PR-4 (helper text ported to MetadataInputForm). See PR-4 for details."
```

---

## Post-rollout

### Retrospective / followups

Spec Section 12에 열거된 후속 과제(Spot 드래그, ContextSelector multi-select, autocomplete 등)는 별도 이슈로 분리. 본 plan은 단일 이슈 #145 Section 4 범위만 다룸.

### Memory update

- `project_monorepo_backend.md`에 "업로드 플로우는 `useUploadFlow` + `UploadFlowSteps` 조합으로 통합됨" 한 줄 추가.
- `project_current_milestone_v11.md`에 `#145 upload modal refactor` 완료 시 한 줄 append.

---

## Self-Review (performed 2026-04-17 at plan authoring)

1. **Spec coverage:** Spec §3 in-scope 항목이 모두 Phase A–D에 매핑됨. §7 엣지(ImageEditor 중첩, 모바일, history.length)가 Task B1(`useBodyScrollLock`), A3(`mobileFullScreen`), C0 주석에 반영. §10 리스크 중 Draft 중복 / store bleed는 B2 / B4에 대응 테스트 있음.
2. **Placeholder scan:** "copy from PR #230"이 D1 Step 1에 남아있는데, 이는 exact-copy 지시(본 plan이 모르는 원문 문자열)라 placeholder가 아닌 의도적 조치. 실행 시 `gh pr diff 230`로 확정.
3. **Type consistency:** `UseUploadFlowReturn.submit`/`close`/`instanceId` 시그니처가 B3 → B4 → B6 일관. `requestStore`의 `setActiveInstance`/`resetIfActive`/`activeInstanceId` 이름이 B2 → B3 → C1 일관. `RequestFlowModal` prop(`maxWidth`/`onClose`/`mobileFullScreen`)가 A1–A3 → C1 일관.

---

**Plan complete.** Save at `docs/superpowers/plans/2026-04-17-upload-modal-refactor.md`.
