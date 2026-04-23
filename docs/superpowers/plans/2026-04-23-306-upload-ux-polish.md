# Upload UX Polish (#306) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload 모달에 (A) Back 네비게이션 + Discard confirm, (B) Spot 권장 카운터/가이드, (C) Submit disabled 이유 힌트 + safe-area + spot badge를 추가한다.

**Architecture:** 접근 A(인라인 + 최소 신규 2파일). `requestStore`에 `backToFork`/`backToUpload` 액션, `hasInProgressWork`/`disabledReason` 셀렉터 추가. `UploadFlowSteps.tsx`는 인라인 수정. `DiscardProgressDialog.tsx`(native `<dialog>`)와 `constants.ts` 신규. 3개 PR로 분할 머지.

**Tech Stack:** Next.js 16, React 19, Zustand, Tailwind, Vitest 4 (jsdom env via docblock), Playwright.

**Spec:** `docs/superpowers/specs/2026-04-23-306-upload-ux-polish-design.md`

**Spec deviation note:** Spec의 `DisabledReason` enum에 `need_media_title`이 포함되어 있으나, `UploadFlowSteps.tsx:62-69`의 실제 `canProceed` 규칙은 `userKnowsItems===false`일 때 `mediaSource.title`을 요구하지 않음. 본 plan은 실제 동작에 맞춰 `need_media_title`을 **제외**한다 (4가지: `need_image`, `need_fork_choice`, `need_spot`, `need_solution`).

---

## Files Touched

| Path                                                            | Action    | Responsibility                                                                                                              |
| --------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/lib/stores/requestStore.ts`                       | Modify    | `backToFork`, `backToUpload` 액션 + `hasInProgressWork`, `disabledReason` 셀렉터 + `DisabledReason` 타입 + selector helpers |
| `packages/web/lib/components/request/constants.ts`              | Create    | `RECOMMENDED_SPOT_COUNT = 3`                                                                                                |
| `packages/web/lib/components/request/DiscardProgressDialog.tsx` | Create    | Native `<dialog>` 기반 confirm UI + Esc propagation 차단                                                                    |
| `packages/web/lib/components/request/UploadFlowSteps.tsx`       | Modify    | Back 버튼 + Discard 연동, Spot 카운터 인라인, Footer disabled 힌트/badge + safe-area                                        |
| `packages/web/lib/components/request/useUploadFlow.ts`          | Read-only | `clearDraft` import 이미 존재; Back 경로에서 호출은 `UploadFlowSteps` 쪽에서                                                |
| `packages/web/tests/requestStore-back-navigation.test.ts`       | Create    | `backToFork`/`backToUpload`/`hasInProgressWork`/`disabledReason` 유닛                                                       |
| `packages/web/tests/DiscardProgressDialog.test.tsx`             | Create    | Dialog open/close/Esc propagation 차단                                                                                      |
| `/tmp/playwright-qa-upload-flow.js`                             | Modify    | Back/Discard 시나리오 3개 추가                                                                                              |

---

## Task 0: Branch Setup

**Files:** none (git only)

- [ ] **Step 1: Create feature branch from `dev`**

Run:

```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git checkout dev
git pull origin dev
git checkout -b feat/306-upload-ux-polish
```

Expected: new branch `feat/306-upload-ux-polish` tracking `dev`.

---

# PR 1 — Part A: Back 버튼 + Discard Dialog

## Task 1: Store — `backToFork`/`backToUpload` 액션 (failing tests)

**Files:**

- Create: `packages/web/tests/requestStore-back-navigation.test.ts`

- [ ] **Step 1: Write failing tests for new store actions/selectors**

Write `packages/web/tests/requestStore-back-navigation.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { useRequestStore } from "@/lib/stores/requestStore";

vi.mock("@/lib/utils/imageCompression", () => ({
  createPreviewUrl: vi.fn(() => "blob:mock"),
  revokePreviewUrl: vi.fn(),
}));

describe("requestStore — back navigation", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  describe("backToFork", () => {
    test("clears detectedSpots and metadata, preserves images and userKnowsItems", () => {
      // Arrange: Step 3 state (image + fork choice + spots + metadata)
      useRequestStore.setState({
        images: [
          {
            id: "img1",
            file: new File([], "a.jpg"),
            previewUrl: "blob:mock",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: true,
        detectedSpots: [
          {
            id: "s1",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "TOP",
            description: "",
          },
        ],
        selectedSpotId: "s1",
        mediaSource: { type: "drama", title: "My Drama" },
        groupName: "G",
        artistName: "A",
        context: "airport",
      });

      // Act
      useRequestStore.getState().backToFork();

      // Assert
      const s = useRequestStore.getState();
      expect(s.detectedSpots).toEqual([]);
      expect(s.selectedSpotId).toBeNull();
      expect(s.mediaSource).toEqual({ type: "user_upload", title: "" });
      expect(s.groupName).toBe("");
      expect(s.artistName).toBe("");
      expect(s.context).toBeNull();
      // Preserved:
      expect(s.images.length).toBe(1);
      expect(s.userKnowsItems).toBe(true);
    });
  });

  describe("backToUpload", () => {
    test("clears images and userKnowsItems, revokes preview URLs", async () => {
      const { revokePreviewUrl } = await import("@/lib/utils/imageCompression");
      (revokePreviewUrl as ReturnType<typeof vi.fn>).mockClear();

      useRequestStore.setState({
        images: [
          {
            id: "img1",
            file: new File([], "a.jpg"),
            previewUrl: "blob:foo",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
      });

      useRequestStore.getState().backToUpload();

      const s = useRequestStore.getState();
      expect(s.images).toEqual([]);
      expect(s.userKnowsItems).toBeNull();
      expect(revokePreviewUrl).toHaveBeenCalledWith("blob:foo");
    });
  });

  describe("hasInProgressWork selector", () => {
    test("false when only userKnowsItems is set", () => {
      useRequestStore.setState({ userKnowsItems: true });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(false);
    });

    test("true when detectedSpots has at least one item", () => {
      useRequestStore.setState({
        detectedSpots: [
          {
            id: "s1",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("true when context is set", () => {
      useRequestStore.setState({ context: "airport" });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("false when mediaSource.title is whitespace only", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "   " },
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(false);
    });

    test("true when mediaSource.title is non-empty", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "Hi" },
      });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });

    test("true when artistName is non-empty", () => {
      useRequestStore.setState({ artistName: "A" });
      expect(useRequestStore.getState().hasInProgressWork()).toBe(true);
    });
  });

  describe("disabledReason selector", () => {
    test("need_image when no uploaded image", () => {
      expect(useRequestStore.getState().disabledReason()).toBe("need_image");
    });

    test("need_fork_choice when image uploaded but userKnowsItems=null", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBe(
        "need_fork_choice",
      );
    });

    test("need_spot when fork chosen but no spots", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
      });
      expect(useRequestStore.getState().disabledReason()).toBe("need_spot");
    });

    test("need_solution when userKnowsItems=true but spots lack solution", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: true,
        detectedSpots: [
          {
            id: "s",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBe("need_solution");
    });

    test("null when userKnowsItems=false and spots > 0", () => {
      useRequestStore.setState({
        images: [
          {
            id: "i",
            file: new File([], "a.jpg"),
            previewUrl: "blob:m",
            status: "uploaded",
            progress: 100,
          },
        ],
        userKnowsItems: false,
        detectedSpots: [
          {
            id: "s",
            index: 1,
            center: { x: 0.5, y: 0.5 },
            title: "",
            description: "",
          },
        ],
      });
      expect(useRequestStore.getState().disabledReason()).toBeNull();
    });

    test("submitting when isSubmitting=true", () => {
      useRequestStore.setState({ isSubmitting: true });
      expect(useRequestStore.getState().disabledReason()).toBe("submitting");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/web && bun run test:unit -- tests/requestStore-back-navigation.test.ts`

Expected: ALL tests fail with "backToFork is not a function" / "hasInProgressWork is not a function" / "disabledReason is not a function".

## Task 2: Store — Implementation

**Files:**

- Modify: `packages/web/lib/stores/requestStore.ts`

- [ ] **Step 1: Add `DisabledReason` type export**

At the top of `requestStore.ts`, after `RequestStep` type (line 23), add:

```ts
export type DisabledReason =
  | "need_image"
  | "need_fork_choice"
  | "need_spot"
  | "need_solution"
  | "submitting"
  | null;
```

- [ ] **Step 2: Add 2 new actions + 2 selectors to `RequestState` interface**

In `RequestState` interface (line 76-165), locate the `// Actions - Reset` section (line 156-158) and add **above** `resetRequestFlow`:

```ts
  // Actions - Back navigation
  backToFork: () => void;
  backToUpload: () => void;

  // Selectors
  hasInProgressWork: () => boolean;
  disabledReason: () => DisabledReason;
```

- [ ] **Step 3: Implement actions inside `create<RequestState>((set, get) => ({ ... }))`**

In `requestStore.ts`, right before the `resetRequestFlow` implementation (line 521), insert:

```ts
  backToFork: () => {
    set({
      detectedSpots: [],
      selectedSpotId: null,
      mediaSource: { type: "user_upload", title: "" },
      groupName: "",
      artistName: "",
      context: null,
    });
  },

  backToUpload: () => {
    const { images } = get();
    images.forEach((img) => revokePreviewUrl(img.previewUrl));
    set({
      images: [],
      userKnowsItems: null,
    });
  },

  hasInProgressWork: () => {
    const { detectedSpots, mediaSource, context, artistName } = get();
    return (
      detectedSpots.length > 0 ||
      !!mediaSource?.title?.trim() ||
      context !== null ||
      !!artistName?.trim()
    );
  },

  disabledReason: () => {
    const {
      images,
      userKnowsItems,
      detectedSpots,
      isSubmitting,
    } = get();
    if (isSubmitting) return "submitting";
    const hasUploaded = images.some((img) => img.status === "uploaded");
    if (!hasUploaded) return "need_image";
    if (userKnowsItems === null) return "need_fork_choice";
    if (detectedSpots.length === 0) return "need_spot";
    if (
      userKnowsItems === true &&
      !detectedSpots.every(
        (s) => s.solution?.originalUrl && s.solution?.title
      )
    ) {
      return "need_solution";
    }
    return null;
  },
```

- [ ] **Step 4: Export the selector helpers at bottom of file**

After line 605 (`selectSubmitError`), add:

```ts
// Back navigation selectors
export const selectHasInProgressWork = (state: RequestState): boolean =>
  state.hasInProgressWork();

export const selectDisabledReason = (state: RequestState): DisabledReason =>
  state.disabledReason();
```

- [ ] **Step 5: Expose actions in `getRequestActions()` helper**

In `getRequestActions()` function (line 611-640), add these lines before the closing `};`:

```ts
    backToFork: state.backToFork,
    backToUpload: state.backToUpload,
```

- [ ] **Step 6: Run tests to verify all pass**

Run: `cd packages/web && bun run test:unit -- tests/requestStore-back-navigation.test.ts`

Expected: ALL tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo
git add packages/web/lib/stores/requestStore.ts packages/web/tests/requestStore-back-navigation.test.ts
git commit -m "$(cat <<'EOF'
feat(upload): add backToFork/backToUpload actions and hasInProgressWork/disabledReason selectors

#306 Part A 준비. DisabledReason enum과 두 개의 셀렉터로 Back 버튼/Submit 힌트가
소비할 진실 공급원을 store에 단일화. backToFork는 이미지/fork 선택 보존,
backToUpload는 이미지와 fork 선택까지 초기화.
EOF
)"
```

## Task 3: `DiscardProgressDialog` — Failing Test

**Files:**

- Create: `packages/web/tests/DiscardProgressDialog.test.tsx`

- [ ] **Step 1: Write test file**

`packages/web/tests/DiscardProgressDialog.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DiscardProgressDialog } from "@/lib/components/request/DiscardProgressDialog";

// jsdom은 HTMLDialogElement.showModal을 구현하지 않음 — 폴리필
function polyfillDialog() {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
  }
}

describe("DiscardProgressDialog", () => {
  test("renders when open=true", () => {
    polyfillDialog();
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(screen.getByText("Discard progress?")).toBeInTheDocument();
  });

  test("calls onCancel when Cancel button clicked", () => {
    polyfillDialog();
    const onCancel = vi.fn();
    render(
      <DiscardProgressDialog open onCancel={onCancel} onConfirm={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("calls onConfirm when Discard button clicked", () => {
    polyfillDialog();
    const onConfirm = vi.fn();
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByText("Discard and go back"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("Escape keydown inside dialog stops propagation", () => {
    polyfillDialog();
    const outerHandler = vi.fn();
    window.addEventListener("keydown", outerHandler);
    render(
      <DiscardProgressDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    const dialog = document.querySelector("dialog");
    fireEvent.keyDown(dialog!, { key: "Escape" });
    expect(outerHandler).not.toHaveBeenCalled();
    window.removeEventListener("keydown", outerHandler);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && bun run test:unit -- tests/DiscardProgressDialog.test.tsx`

Expected: FAIL with module not found for `DiscardProgressDialog`.

## Task 4: `DiscardProgressDialog` — Implementation

**Files:**

- Create: `packages/web/lib/components/request/DiscardProgressDialog.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardProgressDialog({ open, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onKeyDown={(e) => {
        // RequestFlowModal.tsx:132-140이 window keydown을 구독하므로
        // Esc가 window까지 전파되면 외부 모달까지 닫힘. stopPropagation 필수.
        if (e.key === "Escape") e.stopPropagation();
      }}
      className="w-[min(22rem,92vw)] rounded-xl bg-background p-6 shadow-xl backdrop:bg-black/50"
    >
      <h2 className="text-lg font-semibold">Discard progress?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You&rsquo;ll lose spots and details you&rsquo;ve added so far.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Discard and go back
        </button>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Run tests to verify all pass**

Run: `cd packages/web && bun run test:unit -- tests/DiscardProgressDialog.test.tsx`

Expected: ALL 4 tests PASS.

- [ ] **Step 3: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/components/request/DiscardProgressDialog.tsx packages/web/tests/DiscardProgressDialog.test.tsx
git commit -m "feat(upload): add DiscardProgressDialog with native <dialog> and Esc propagation guard

#306 Part A 준비. Back 클릭 시 진행 중 작업이 있으면 띄우는 confirm 다이얼로그.
native <dialog>의 onKeyDown.stopPropagation으로 RequestFlowModal window keydown
리스너까지 Esc가 전파되지 않도록 차단."
```

## Task 5: `UploadFlowSteps` — Back 버튼 배선 + Draft 정리

**Files:**

- Modify: `packages/web/lib/components/request/UploadFlowSteps.tsx`

- [ ] **Step 1: Add imports**

At the top of `UploadFlowSteps.tsx`, update the existing imports:

1. Line 19 `useRequestStore` import block — ensure it also imports the new selectors:

   ```ts
   // Add to the existing imports from @/lib/stores/requestStore:
   selectHasInProgressWork,
   ```

   (Full list becomes: `useRequestStore, getRequestActions, selectHasImages, selectDetectedSpots, selectSelectedSpotId, selectUserKnowsItems, selectMediaSource, selectArtistName, selectGroupName, selectContext, selectHasInProgressWork, type DetectedSpot, type SpotSolutionData`)

2. Line 32 lucide icons — add `ArrowLeft`:

   ```ts
   import {
     Trash2,
     Plus,
     Loader2,
     RefreshCw,
     Crop,
     ArrowLeft,
   } from "lucide-react";
   ```

3. Below `ImageEditor` import (line 31), add:
   ```ts
   import { DiscardProgressDialog } from "@/lib/components/request/DiscardProgressDialog";
   import { clearDraft } from "@/lib/utils/offlineDraft";
   ```

- [ ] **Step 2: Add local state + derived step + back handler**

Inside `UploadFlowSteps()` body, after the existing `const currentStep: number = ...` block (around line 74-80), add:

```tsx
const hasInProgressWork = useRequestStore(selectHasInProgressWork);
const [showDiscardDialog, setShowDiscardDialog] = useState(false);

// Back 버튼 노출/활성화
const anyImageUploading = images.some((img) => img.status === "uploading");
const showBackButton = currentStep === 2 || currentStep === 3;
const backDisabled = anyImageUploading;

const performBack = useCallback(() => {
  if (currentStep === 3) {
    getRequestActions().backToFork();
  } else if (currentStep === 2) {
    getRequestActions().backToUpload();
  }
  // 어떤 경로든 draft는 의미 없어짐
  clearDraft();
}, [currentStep]);

const handleBackClick = useCallback(() => {
  if (currentStep === 3 && hasInProgressWork) {
    setShowDiscardDialog(true);
    return;
  }
  performBack();
}, [currentStep, hasInProgressWork, performBack]);
```

Note: `useState` is already imported from "react" on line 3; keep. `useCallback` already imported (line 3). No further import needed.

- [ ] **Step 3: Render Back button at top-left of modal container**

Locate the outermost return element inside `UploadFlowSteps`. It begins at `return ( <div className="flex flex-col h-full" ... >`. Just after the opening `<div>`, add:

```tsx
{
  showBackButton && (
    <button
      type="button"
      onClick={handleBackClick}
      disabled={backDisabled}
      aria-label="Go back"
      className="absolute top-4 left-4 z-20 rounded-full p-2 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
```

Then also inject the dialog **right before** the closing `</div>` of the outermost return (same level as the `ImageEditor` modal block at line 430-437):

```tsx
<DiscardProgressDialog
  open={showDiscardDialog}
  onCancel={() => setShowDiscardDialog(false)}
  onConfirm={() => {
    setShowDiscardDialog(false);
    performBack();
  }}
/>
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 5: Dev smoke-test**

Run (in separate terminal if not already running): `cd packages/web && bun run dev`

Manually verify in browser:

1. Open `/request/upload` intercept modal, upload image → Back button appears on Step 2
2. Click Back on Step 2 → returns to Step 1 (image cleared)
3. Upload → pick fork → add 2 spots → Back on Step 3 → dialog appears
4. Dialog Cancel → state preserved
5. Dialog Confirm → back to Step 2 (spots cleared, metadata cleared, image kept)
6. Reload page → no "Restore draft?" toast (draft cleared)

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/UploadFlowSteps.tsx
git commit -m "feat(upload): wire Back button into UploadFlowSteps with Discard confirm and draft clear

#306 Part A 본체. top-4 left-4 Back 버튼 + 진행 중 작업 여부에 따라
DiscardProgressDialog 노출, 확정 시 draft 정리."
```

## Task 6: Playwright E2E — Back 경로 시나리오

**Files:**

- Modify: `/tmp/playwright-qa-upload-flow.js`

- [ ] **Step 1: Append Back/Discard scenarios**

Open `/tmp/playwright-qa-upload-flow.js`. Inside the existing test suite, add three new scenarios at the end of the flow:

```js
// ─── Scenario: Back from Step 2 returns to Step 1 with image cleared ───
await page.goto(`${BASE}/request/upload`);
await uploadSampleImage(page); // helper from existing script
await page.waitForSelector('[data-testid="fork-screen"]');
await page.click('button[aria-label="Go back"]');
await page.waitForSelector('[data-testid="drop-zone"]'); // Step 1 UI
console.log("✓ Step 2 → Step 1 back");

// ─── Scenario: Step 3 Back with work → dialog → Cancel → state preserved ───
await page.goto(`${BASE}/request/upload`);
await uploadSampleImage(page);
await page.click('button:has-text("No, I\'m curious")'); // fork: unknown
await page.click('[data-testid="detection-canvas"]', {
  position: { x: 100, y: 100 },
});
await page.waitForFunction(
  () => document.querySelectorAll("[data-spot-id]").length >= 1,
);
await page.click('button[aria-label="Go back"]');
await page.waitForSelector("text=Discard progress?");
await page.click('button:has-text("Cancel")');
const stillHasSpot = await page.$("[data-spot-id]");
if (!stillHasSpot)
  throw new Error("Expected spot to remain after dialog Cancel");
console.log("✓ Discard Cancel preserves state");

// ─── Scenario: Step 3 Back → dialog → Confirm → spots cleared, draft cleared ───
await page.click('button[aria-label="Go back"]');
await page.waitForSelector("text=Discard progress?");
await page.click('button:has-text("Discard and go back")');
await page.waitForSelector('[data-testid="fork-screen"]');
const spotCount = await page.$$eval("[data-spot-id]", (els) => els.length);
if (spotCount !== 0)
  throw new Error(`Expected 0 spots after Discard, got ${spotCount}`);
// Reload to confirm no draft restore toast
await page.reload();
await page.waitForTimeout(1000);
const toastVisible = await page.isVisible("text=unsaved request draft");
if (toastVisible)
  throw new Error("Expected no draft restore toast after Discard");
console.log("✓ Discard Confirm resets + clears draft");
```

**Note:** If `data-testid` attributes don't exist yet in the codebase, skip the assertions that depend on them and use role/text selectors instead. Adjust selectors to match your specific setup (check `/tmp/playwright-qa-upload-flow.js` existing helpers for `uploadSampleImage` and BASE URL).

- [ ] **Step 2: Run script**

Run: `node /tmp/playwright-qa-upload-flow.js`

Expected: ALL existing scenarios still pass + 3 new scenarios pass.

- [ ] **Step 3: Commit (script only; it lives in /tmp, but save a copy into repo if wanted)**

If you want the script under version control at `packages/web/scripts/qa/upload-flow.js`, copy it and commit. Otherwise skip.

## Task 7: PR 1 Open

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin feat/306-upload-ux-polish
gh pr create --base dev --title "feat(upload): #306 Part A — Back 버튼 + Discard dialog" --body "$(cat <<'EOF'
## Summary
- Back 버튼 상단 좌측 추가 (fork/details 단계)
- 진행 중 작업 있으면 DiscardProgressDialog로 confirm, 없으면 즉시 전이
- backToFork/backToUpload 스토어 액션 + hasInProgressWork/disabledReason 셀렉터
- Esc propagation 차단 (외부 RequestFlowModal 보호)
- Discard 확정 시 offlineDraft.clearDraft() 동반

#306 Part A.

## Test plan
- [ ] `bun run test:unit` — requestStore-back-navigation + DiscardProgressDialog
- [ ] `bunx tsc --noEmit` 통과
- [ ] `node /tmp/playwright-qa-upload-flow.js` — Back 3개 시나리오 포함
- [ ] Manual: Step 2/3 Back + Cancel/Confirm + reload 후 draft 없음 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# PR 2 — Part B: Spot 카운터/가이드

## Task 8: `constants.ts` — 상수 파일 신설

**Files:**

- Create: `packages/web/lib/components/request/constants.ts`

- [ ] **Step 1: Create file**

```ts
/**
 * Shared constants for the request/upload flow.
 */
export const RECOMMENDED_SPOT_COUNT = 3;
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/lib/components/request/constants.ts
git commit -m "chore(upload): add constants file with RECOMMENDED_SPOT_COUNT"
```

## Task 9: Spot 카운터/가이드 인라인 교체

**Files:**

- Modify: `packages/web/lib/components/request/UploadFlowSteps.tsx`

- [ ] **Step 1: Import the constant**

At the top of `UploadFlowSteps.tsx`, add:

```ts
import { RECOMMENDED_SPOT_COUNT } from "@/lib/components/request/constants";
```

- [ ] **Step 2: Locate the sidebar Spots heading block**

Find the block that renders the current `"Spots (N)"` text (inside the right-side panel when `currentStep === 3`). It is typically near line 290-310 — search for `"Spots"` text to locate.

- [ ] **Step 3: Replace counter block with the new rule-based renderer**

Replace the existing heading/subtext rows with:

```tsx
{
  detectedSpots.length >= 1 ? (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-medium text-foreground">
        <span className="tabular-nums">Spots {detectedSpots.length}</span>
        <span className="text-muted-foreground">
          {" "}
          / {RECOMMENDED_SPOT_COUNT}
        </span>
      </div>
      {detectedSpots.length < RECOMMENDED_SPOT_COUNT && (
        <p className="text-xs text-muted-foreground">
          Tap image to add more, or drag to reposition
        </p>
      )}
      {detectedSpots.length === RECOMMENDED_SPOT_COUNT && (
        <p className="text-xs text-muted-foreground">
          Nice. Add more if needed.
        </p>
      )}
      {/* count > RECOMMENDED_SPOT_COUNT: no subtext (intentional, per spec) */}
    </div>
  ) : null;
}
```

If the existing block also shows "Tap a spot to add a link" or similar, remove it — the new renderer covers the 1+ case, and the `DetectionView` pulse hint already covers the 0 case.

- [ ] **Step 4: Typecheck + Dev smoke-test**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

Manual check: add 1, 2, 3, 4 spots and verify copy transitions (<3, =3, >3 no subtext).

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/request/UploadFlowSteps.tsx
git commit -m "feat(upload): show recommended spot counter and guidance

#306 Part B. Sidebar Spot 카운터를 Spots N / 3 형태로 표시 + 추가 권장/만족/초과
각 상태에 맞춘 subtext. 초과 시 제품 노이즈 방지를 위해 subtext 숨김."
```

## Task 10: PR 2 Open

- [ ] **Step 1: Open PR**

```bash
git push
gh pr create --base dev --title "feat(upload): #306 Part B — Spot counter and guidance" --body "$(cat <<'EOF'
## Summary
- RECOMMENDED_SPOT_COUNT 상수 도입 (3)
- Sidebar Spot 카운터를 `Spots N / 3` + 상태별 subtext로 교체
- 초과 시 subtext 없음 (OOTD 5개 같은 정상 케이스 오판 방지)

#306 Part B.

## Test plan
- [ ] Manual: 0/1/2/3/5 spots 각각 렌더 확인
- [ ] `bunx tsc --noEmit`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# PR 3 — Part C: Submit 버튼 영역

## Task 11: Footer copy-mapper + 인라인 수정

**Files:**

- Modify: `packages/web/lib/components/request/UploadFlowSteps.tsx`

- [ ] **Step 1: Import DisabledReason type + selector**

Top of `UploadFlowSteps.tsx`:

```ts
// Add to existing @/lib/stores/requestStore import:
selectDisabledReason,
type DisabledReason,
```

- [ ] **Step 2: Inside component, subscribe selector + add copy mapper**

Below the existing `hasInProgressWork` subscription (added in Task 5):

```tsx
const disabledReason = useRequestStore(selectDisabledReason);

const disabledReasonCopy = (r: DisabledReason): string | null => {
  switch (r) {
    case "need_image":
      return "Upload an image";
    case "need_fork_choice":
      return "Choose how you'll add info";
    case "need_spot":
      return "Tap the image to add at least 1 spot";
    case "need_solution":
      return "Add a link and title for each spot";
    case "submitting":
    case null:
      return null;
  }
};
```

- [ ] **Step 3: Replace footer bar (line 391-425)**

Find the block beginning with `<div className="flex items-center justify-end gap-3 pt-4 border-t border-border flex-shrink-0">` and ending with the `</button>` after `"Posting..." : "Post"`. Replace with:

```tsx
<div
  className="flex flex-col gap-2 pt-4 border-t border-border flex-shrink-0"
  style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
>
  {disabledReasonCopy(disabledReason) && (
    <p id="post-disabled-reason" className="text-xs text-muted-foreground">
      {disabledReasonCopy(disabledReason)}
    </p>
  )}
  <div className="flex items-center justify-end gap-3">
    {flow.submitError && (
      <div className="flex items-center gap-2 mr-auto">
        <p className="text-sm text-destructive">{flow.submitError}</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={flow.isSubmitting}
          className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )}
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!canProceed}
      aria-describedby={
        disabledReason && disabledReason !== "submitting"
          ? "post-disabled-reason"
          : undefined
      }
      className={`
                    px-6 py-2.5 rounded-lg font-medium transition-all
                    flex items-center gap-2
                    ${
                      canProceed
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-foreground/20 text-foreground/40 cursor-not-allowed"
                    }
                  `}
    >
      {flow.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
      {flow.isSubmitting ? "Posting..." : "Post"}
      {detectedSpots.length > 0 && !flow.isSubmitting && (
        <span className="ml-1 opacity-80">
          · {detectedSpots.length}{" "}
          {detectedSpots.length === 1 ? "spot" : "spots"}
        </span>
      )}
    </button>
  </div>
</div>
```

Key changes vs. original:

- Outer flex becomes column so the hint sits above the button row
- `paddingBottom` via inline style for `max(0.75rem, env(safe-area-inset-bottom))`
- `aria-describedby` links hint to Post button
- Post button label includes `· N spot[s]` badge when `detectedSpots > 0` and not submitting

- [ ] **Step 4: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Dev smoke-test**

1. Step 1 (no image): 힌트 "Upload an image" 표시, Post 버튼 disabled
2. Step 2 fork selected, no spots: "Tap the image to add at least 1 spot"
3. Step 3 userKnowsItems=true with 2 spots missing solution: "Add a link and title for each spot"
4. Step 3 userKnowsItems=false with 2 spots: 힌트 없음, Post 활성 + `Post · 2 spots`
5. iOS safe-area: 프리뷰 배포 또는 Chrome devtools에서 `env(safe-area-inset-bottom)` 시뮬레이션

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/UploadFlowSteps.tsx
git commit -m "feat(upload): show disabled reason hint, spot badge on Post, safe-area padding

#306 Part C. disabledReason enum 셀렉터 → 컴포넌트에서 copy 매핑 → 버튼 위
inline 힌트. aria-describedby로 스크린 리더 연결. Post 라벨에 spot 배지.
하단 safe-area inset 패딩 적용."
```

## Task 12: PR 3 Open

- [ ] **Step 1: Open PR**

```bash
git push
gh pr create --base dev --title "feat(upload): #306 Part C — Submit disabled hint + spot badge + safe-area" --body "$(cat <<'EOF'
## Summary
- DisabledReason enum 기반 inline 힌트 표시 (4가지 이유)
- Post 버튼에 `· N spots` badge
- iOS safe-area padding 적용 (flex-shrink-0 유지, sticky 사용 안 함)

#306 Part C.

## Test plan
- [ ] `bunx tsc --noEmit`
- [ ] Manual: 각 disabled 이유별 힌트 문구 확인
- [ ] iOS 실기기 (프리뷰 배포)에서 safe-area inset 적용 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Post-Merge Follow-Ups (not in scope)

- 모바일/직접 URL 경로(`app/request/detect/page.tsx`, `MobileDetectionLayout`)에 동일 Back/힌트 패턴 이식 — 별도 이슈
- i18n 래퍼 도입 시 `disabledReasonCopy`를 통합 locale 파일로 이동
- 업로드 진행 중 `AbortController` 지원 + Back 허용 (현재는 disabled로 충분)
- 스팟/discard 이벤트 텔레메트리 (별도 이슈)

## Self-Review Checklist

- Spec 커버리지: Part A(Task 1-7), Part B(Task 8-10), Part C(Task 11-12) 각 섹션 다룸 ✓
- Placeholder 없음 ✓
- 타입 일관성: `DisabledReason` 정의와 사용, `backToFork`/`backToUpload` 시그니처 및 호출 경로 일치 ✓
- Spec 대비 편차: `need_media_title` 제외. 본 plan 상단에 명시 ✓
