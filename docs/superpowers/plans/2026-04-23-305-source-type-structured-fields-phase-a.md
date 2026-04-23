# Source Type별 구조화 필드 Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload Details 단계에서 drama/movie/music_video/variety/event 각 타입별 구조화 필드(Title/Platform/Year/Episode/Location)를 입력받아 기존 `MediaMetadataItem[]` wire format으로 직렬화해 제출한다. BE 미변경.

**Architecture:** FE-only. `MEDIA_METADATA_KEYS` whitelist와 `toMediaMetadataItems`/`mergeManualOverAi` 유틸로 "manual wins" 병합 정책을 구현. `MetadataInputForm`이 source type별 conditional fields를 렌더, `requestStore.structuredMetadata` slice가 입력값을 보관, submit 시 `useUploadFlow`/payload 조립 지점에서 AI 추출 결과와 병합해 `CreatePostRequest.media_metadata`로 전달.

**Tech Stack:** Next.js 16 + React 19, Zustand, TypeScript strict, Vitest 4 (jsdom env via docblock), @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-23-305-source-type-structured-fields-phase-a-design.md`

---

## Files Touched

| Path                                                                       | Action | Responsibility                                                                   |
| -------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `packages/web/lib/api/mutation-types.ts`                                   | Modify | `MEDIA_METADATA_KEYS` 상수, `MediaMetadataKey`·`StructuredFieldsState` 타입 추가 |
| `packages/web/lib/utils/mediaMetadata.ts`                                  | Create | `toMediaMetadataItems`, `fromMediaMetadataItems`, `mergeManualOverAi` 유틸       |
| `packages/web/lib/stores/requestStore.ts`                                  | Modify | `structuredMetadata` slice + setter + reset 통합 + selector + action helper      |
| `packages/web/lib/components/request/MetadataInputForm.tsx`                | Modify | Source type별 conditional fields, description 조건부 숨김, Artist 라벨 MV 분기   |
| `packages/web/lib/components/request/UploadFlowSteps.tsx`                  | Modify | `metadataValues.structured` 연결 + setter 배선                                   |
| `packages/web/lib/hooks/useCreatePost.ts`                                  | Modify | Submit payload 조립 시 `mergeManualOverAi(structured, aiExtracted)` 호출         |
| `packages/web/tests/mediaMetadata.test.ts`                                 | Create | 유틸 round-trip + 병합 유닛                                                      |
| `packages/web/tests/requestStore-structured-metadata.test.ts`              | Create | Store slice set/reset + source type 전환 정책                                    |
| `packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx` | Modify | Source type별 conditional render, Artist 라벨, transition 테스트 추가            |

---

## Task 0: Branch verification

**Files:** none (git only)

- [ ] **Step 1: Verify worktree branch**

Run: `git branch --show-current`
Expected: `worktree-305-source-type-phase-a`

- [ ] **Step 2: Verify spec exists**

Run: `ls docs/superpowers/specs/2026-04-23-305-source-type-structured-fields-phase-a-design.md`
Expected: file listed.

---

## Task 1: Key whitelist + types

**Files:**

- Modify: `packages/web/lib/api/mutation-types.ts`

- [ ] **Step 1: Find existing `MediaSource` block**

Run: `grep -n "MediaSource\|MediaMetadataItem" packages/web/lib/api/mutation-types.ts | head -20`
Expected: lines around 61-80 containing `MediaSourceType`, `MediaSource`, `MediaMetadataItem`.

- [ ] **Step 2: Append whitelist constants and helper type after `MediaMetadataItem`**

Find the existing declaration of `MediaMetadataItem` (likely an interface with `key: string; value: string`). Immediately after it, insert:

```ts
/**
 * Wire-level whitelist: keys allowed in `media_metadata[]`.
 *
 * FE 구조화 입력은 submit 시 이 key들로만 직렬화된다. Phase C에서
 * Meilisearch/structured column으로 이관될 때 이 whitelist 기준으로
 * SELECT → INSERT 하면 된다. AI extract 결과 중 whitelist 외 key는 drop.
 *
 * #305 Phase A.
 */
export const MEDIA_METADATA_KEYS = [
  "title",
  "platform",
  "year",
  "episode",
  "location",
] as const;

export type MediaMetadataKey = (typeof MEDIA_METADATA_KEYS)[number];

/**
 * 구조화 필드 FE viewmodel. MediaSource 타입은 변경하지 않고 이 별도
 * 레코드를 requestStore.structuredMetadata에 보관한다. wire로 나갈 때
 * `toMediaMetadataItems`가 MediaMetadataItem[]로 변환.
 */
export type StructuredFieldsState = Partial<Record<MediaMetadataKey, string>>;
```

- [ ] **Step 3: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors related to `mutation-types.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/api/mutation-types.ts
git commit -m "feat(upload): add MEDIA_METADATA_KEYS whitelist and StructuredFieldsState type (#305)"
```

---

## Task 2: Utility — failing tests

**Files:**

- Create: `packages/web/tests/mediaMetadata.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import {
  toMediaMetadataItems,
  fromMediaMetadataItems,
  mergeManualOverAi,
} from "@/lib/utils/mediaMetadata";
import type { MediaMetadataItem } from "@/lib/api/mutation-types";

describe("toMediaMetadataItems", () => {
  test("serializes structured fields to array preserving whitelist order", () => {
    const items = toMediaMetadataItems({
      platform: "Netflix",
      year: "2023",
      title: "The Glory",
    });
    expect(items).toEqual([
      { key: "title", value: "The Glory" },
      { key: "platform", value: "Netflix" },
      { key: "year", value: "2023" },
    ]);
  });

  test("omits empty strings and undefined", () => {
    const items = toMediaMetadataItems({
      platform: "",
      year: undefined,
      episode: "5",
    });
    expect(items).toEqual([{ key: "episode", value: "5" }]);
  });

  test("drops keys not on the whitelist (runtime defense)", () => {
    // @ts-expect-error — whitelist 외 key는 compile time에도 막혀야 하지만 런타임 방어 검증
    const items = toMediaMetadataItems({ platform: "N", random: "x" });
    expect(items.map((i) => i.key)).toEqual(["platform"]);
  });
});

describe("fromMediaMetadataItems", () => {
  test("reconstructs structured fields from wire array", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2023" },
      { key: "platform", value: "Netflix" },
    ]);
    expect(state).toEqual({ year: "2023", platform: "Netflix" });
  });

  test("ignores unknown keys", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2023" },
      { key: "unknown_key", value: "x" },
    ]);
    expect(state).toEqual({ year: "2023" });
  });

  test("last value wins for duplicate keys", () => {
    const state = fromMediaMetadataItems([
      { key: "year", value: "2022" },
      { key: "year", value: "2023" },
    ]);
    expect(state).toEqual({ year: "2023" });
  });
});

describe("mergeManualOverAi", () => {
  const ai: MediaMetadataItem[] = [
    { key: "title", value: "AI Title" },
    { key: "platform", value: "AI Netflix" },
  ];

  test("manual value overrides AI value for the same key", () => {
    const manual: MediaMetadataItem[] = [{ key: "title", value: "Manual" }];
    const merged = mergeManualOverAi(manual, ai);
    expect(merged).toContainEqual({ key: "title", value: "Manual" });
    expect(merged).toContainEqual({ key: "platform", value: "AI Netflix" });
  });

  test("keys unique to AI or manual are preserved", () => {
    const manual: MediaMetadataItem[] = [{ key: "year", value: "2024" }];
    const merged = mergeManualOverAi(manual, ai);
    expect(merged).toContainEqual({ key: "year", value: "2024" });
    expect(merged).toContainEqual({ key: "title", value: "AI Title" });
    expect(merged).toContainEqual({ key: "platform", value: "AI Netflix" });
  });

  test("result contains each key exactly once", () => {
    const manual: MediaMetadataItem[] = [
      { key: "title", value: "M" },
      { key: "year", value: "2024" },
    ];
    const merged = mergeManualOverAi(manual, ai);
    const keys = merged.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/web && bun run test:unit -- tests/mediaMetadata.test.ts`
Expected: FAIL with "Cannot find module '@/lib/utils/mediaMetadata'".

---

## Task 3: Utility — implementation

**Files:**

- Create: `packages/web/lib/utils/mediaMetadata.ts`

- [ ] **Step 1: Create utility**

```ts
import {
  MEDIA_METADATA_KEYS,
  type MediaMetadataKey,
  type MediaMetadataItem,
  type StructuredFieldsState,
} from "@/lib/api/mutation-types";

const KEY_SET = new Set<string>(MEDIA_METADATA_KEYS);

function isWhitelistKey(key: string): key is MediaMetadataKey {
  return KEY_SET.has(key);
}

/**
 * 구조화 필드 viewmodel → wire array.
 * whitelist 순서 유지, 빈 값(undefined/""")은 omit, whitelist 외 key drop.
 */
export function toMediaMetadataItems(
  state: StructuredFieldsState,
): MediaMetadataItem[] {
  const out: MediaMetadataItem[] = [];
  for (const key of MEDIA_METADATA_KEYS) {
    const value = state[key];
    if (value === undefined || value === "") continue;
    out.push({ key, value });
  }
  return out;
}

/**
 * Wire array → 구조화 필드 viewmodel.
 * whitelist 외 key 무시, 중복 key는 마지막 값 선택.
 */
export function fromMediaMetadataItems(
  items: MediaMetadataItem[],
): StructuredFieldsState {
  const out: StructuredFieldsState = {};
  for (const item of items) {
    if (!isWhitelistKey(item.key)) continue;
    out[item.key] = item.value;
  }
  return out;
}

/**
 * Manual 입력이 AI 추출 결과를 덮어쓴다 (manual wins).
 * 결과는 중복 없는 배열.
 */
export function mergeManualOverAi(
  manual: MediaMetadataItem[],
  ai: MediaMetadataItem[],
): MediaMetadataItem[] {
  const map = new Map<string, string>();
  for (const item of ai) map.set(item.key, item.value);
  for (const item of manual) map.set(item.key, item.value);
  return Array.from(map, ([key, value]) => ({ key, value }));
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd packages/web && bun run test:unit -- tests/mediaMetadata.test.ts`
Expected: ALL tests PASS.

- [ ] **Step 3: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/utils/mediaMetadata.ts packages/web/tests/mediaMetadata.test.ts
git commit -m "feat(upload): add mediaMetadata serialization utils with manual-over-AI merge (#305)"
```

---

## Task 4: requestStore — failing tests

**Files:**

- Create: `packages/web/tests/requestStore-structured-metadata.test.ts`

- [ ] **Step 1: Write failing tests**

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

describe("requestStore — structuredMetadata (#305)", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("initial state is empty object", () => {
    expect(useRequestStore.getState().structuredMetadata).toEqual({});
  });

  test("setStructuredMetadata sets a single key", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "The Glory" });
    expect(useRequestStore.getState().structuredMetadata).toEqual({
      title: "The Glory",
    });
  });

  test("setStructuredMetadata merges with existing values (patch semantics)", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "The Glory" });
    useRequestStore.getState().setStructuredMetadata({ platform: "Netflix" });
    expect(useRequestStore.getState().structuredMetadata).toEqual({
      title: "The Glory",
      platform: "Netflix",
    });
  });

  test("setStructuredMetadata with undefined value clears the key", () => {
    useRequestStore.getState().setStructuredMetadata({ year: "2023" });
    useRequestStore.getState().setStructuredMetadata({ year: undefined });
    expect(useRequestStore.getState().structuredMetadata.year).toBeUndefined();
  });

  test("resetRequestFlow clears structuredMetadata", () => {
    useRequestStore.getState().setStructuredMetadata({ title: "x" });
    useRequestStore.getState().resetRequestFlow();
    expect(useRequestStore.getState().structuredMetadata).toEqual({});
  });

  describe("source type 전환 정책", () => {
    test("drama ↔ movie transition preserves all fields (same shape)", () => {
      useRequestStore.setState({
        mediaSource: { type: "drama", title: "" },
        structuredMetadata: {
          title: "The Glory",
          platform: "Netflix",
          year: "2023",
        },
      });
      useRequestStore.getState().changeMediaType("movie");
      const s = useRequestStore.getState();
      expect(s.mediaSource?.type).toBe("movie");
      expect(s.structuredMetadata).toEqual({
        title: "The Glory",
        platform: "Netflix",
        year: "2023",
      });
    });

    test("movie → variety drops unsupported keys (platform, year) and keeps title", () => {
      useRequestStore.setState({
        mediaSource: { type: "movie", title: "" },
        structuredMetadata: {
          title: "Parasite",
          platform: "Theater",
          year: "2019",
        },
      });
      useRequestStore.getState().changeMediaType("variety");
      const s = useRequestStore.getState();
      expect(s.mediaSource?.type).toBe("variety");
      expect(s.structuredMetadata).toEqual({ title: "Parasite" });
    });

    test("music_video → event keeps title + year, drops episode if any", () => {
      useRequestStore.setState({
        mediaSource: { type: "music_video", title: "" },
        structuredMetadata: {
          title: "How You Like That",
          year: "2020",
        },
      });
      useRequestStore.getState().changeMediaType("event");
      const s = useRequestStore.getState();
      expect(s.structuredMetadata).toEqual({
        title: "How You Like That",
        year: "2020",
      });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/web && bun run test:unit -- tests/requestStore-structured-metadata.test.ts`
Expected: FAIL with `structuredMetadata is not a function` / `setStructuredMetadata is not a function` / `changeMediaType is not a function`.

---

## Task 5: requestStore — implementation

**Files:**

- Modify: `packages/web/lib/stores/requestStore.ts`

- [ ] **Step 1: Add import for types**

Near the top of the file, update the existing import from `@/lib/api`:

```ts
import {
  analyzeImage,
  apiToStoreCoord,
  type DetectedItem,
  type MediaSource,
  type MediaMetadataItem,
  type ContextType,
  type MediaSourceType,
} from "@/lib/api";
```

Then add a new import from mutation-types (sibling import is fine since `@/lib/api` re-exports from it, but explicit is clearer):

```ts
import type { StructuredFieldsState } from "@/lib/api/mutation-types";
```

- [ ] **Step 2: Add allowed-keys map for transitions**

Near the top of the file, after `convertApiToSpot` (around line 188), insert:

```ts
/**
 * source type별 허용 structured field whitelist.
 * #305 Phase A: 타입 전환 시 이 셋에 포함되지 않는 key는 drop한다.
 */
const STRUCTURED_KEYS_PER_TYPE: Record<
  MediaSourceType,
  ReadonlyArray<keyof StructuredFieldsState>
> = {
  user_upload: [],
  youtube: [],
  drama: ["title", "platform", "year"],
  movie: ["title", "platform", "year"],
  music_video: ["title", "year"],
  variety: ["title", "episode"],
  event: ["title", "year", "location"],
  other: [],
};
```

- [ ] **Step 3: Extend `initialState` and `RequestState` interface**

Add to `initialState` (before the closing `};`):

```ts
  structuredMetadata: {} as StructuredFieldsState,
```

Add to the `RequestState` interface (Step 3 section, alongside `setMediaSource` etc.):

```ts
  // Structured metadata (#305 Phase A)
  structuredMetadata: StructuredFieldsState;
  setStructuredMetadata: (patch: Partial<StructuredFieldsState>) => void;
  changeMediaType: (type: MediaSourceType) => void;
```

- [ ] **Step 4: Implement actions**

Inside `create<RequestState>((set, get) => ({ ... }))`, before `resetRequestFlow` (for proximity with other setters) insert:

```ts
  setStructuredMetadata: (patch) => {
    set((state) => {
      const next: StructuredFieldsState = { ...state.structuredMetadata };
      for (const [k, v] of Object.entries(patch) as Array<
        [keyof StructuredFieldsState, string | undefined]
      >) {
        if (v === undefined) {
          delete next[k];
        } else {
          next[k] = v;
        }
      }
      return { structuredMetadata: next };
    });
  },

  changeMediaType: (type) => {
    set((state) => {
      const allowed = new Set<keyof StructuredFieldsState>(
        STRUCTURED_KEYS_PER_TYPE[type],
      );
      const filtered: StructuredFieldsState = {};
      for (const [k, v] of Object.entries(state.structuredMetadata) as Array<
        [keyof StructuredFieldsState, string | undefined]
      >) {
        if (allowed.has(k) && v !== undefined) filtered[k] = v;
      }
      return {
        mediaSource: {
          ...(state.mediaSource ?? { type, title: "" }),
          type,
        },
        structuredMetadata: filtered,
      };
    });
  },
```

- [ ] **Step 5: Add selector + action helper exports**

After the existing `selectMediaSource` export, add:

```ts
export const selectStructuredMetadata = (state: RequestState) =>
  state.structuredMetadata;
```

In `getRequestActions()`, add before the closing `};`:

```ts
    setStructuredMetadata: state.setStructuredMetadata,
    changeMediaType: state.changeMediaType,
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd packages/web && bun run test:unit -- tests/requestStore-structured-metadata.test.ts`
Expected: ALL tests PASS.

- [ ] **Step 7: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
git add packages/web/lib/stores/requestStore.ts packages/web/tests/requestStore-structured-metadata.test.ts
git commit -m "feat(upload): add structuredMetadata slice with type-transition filter (#305)"
```

---

## Task 6: MetadataInputForm — failing tests

**Files:**

- Modify: `packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx` (or create if absent)

- [ ] **Step 1: Check existing test file**

Run: `ls packages/web/lib/components/request/__tests__/MetadataInputForm*.test.tsx`

If present, append new tests to the most relevant existing file (likely `MetadataInputForm.helperText.test.tsx`). If absent, create `packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx`.

Below assumes creation; adjust if appending.

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MetadataInputForm } from "../MetadataInputForm";
import type { MetadataFormValues } from "../MetadataInputForm";

const baseValues = (
  overrides: Partial<MetadataFormValues> = {},
): MetadataFormValues => ({
  mediaType: "user_upload",
  mediaDescription: "",
  groupName: "",
  artistName: "",
  context: null,
  structured: {},
  ...overrides,
});

describe("MetadataInputForm — source type conditional fields (#305)", () => {
  beforeEach(() => cleanup());

  test("user_upload: description textarea visible, no structured inputs", () => {
    render(<MetadataInputForm values={baseValues()} onChange={vi.fn()} />);
    expect(
      screen.getByLabelText(/Where is this photo from/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title$/i)).not.toBeInTheDocument();
  });

  test("drama: Title/Platform/Year visible, description hidden", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "drama" })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Where is this photo from/i),
    ).not.toBeInTheDocument();
  });

  test("movie: same structured fields as drama", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "movie" })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
  });

  test("music_video: Title + Year, no Platform/Episode; Artist label MV placeholder", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "music_video" })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Platform/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Episode/i)).not.toBeInTheDocument();
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    expect(artistInput.placeholder).toMatch(/e\.g\./i);
  });

  test("variety: Title + Episode, no Platform/Year", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "variety" })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Episode/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Platform/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Year/i)).not.toBeInTheDocument();
  });

  test("event: Title + Year + Location", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "event" })}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  test("other: description textarea visible, no structured inputs", () => {
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "other" })}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText(/Where is this photo from/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title$/i)).not.toBeInTheDocument();
  });

  test("onChange includes structured patch when a structured field is edited", () => {
    const onChange = vi.fn();
    render(
      <MetadataInputForm
        values={baseValues({ mediaType: "drama" })}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^Title$/i), {
      target: { value: "The Glory" },
    });
    // Latest call should include structured.title
    const last = onChange.mock.calls[
      onChange.mock.calls.length - 1
    ]![0] as MetadataFormValues;
    expect(last.structured.title).toBe("The Glory");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/web && bun run test:unit -- packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx`
Expected: FAIL. Reasons include missing `structured` field in `MetadataFormValues`, missing Title/Platform/Year inputs, etc.

---

## Task 7: MetadataInputForm — implementation

**Files:**

- Modify: `packages/web/lib/components/request/MetadataInputForm.tsx`

- [ ] **Step 1: Read current form shape**

Run: `grep -n "MetadataFormValues\|mediaDescription\|mediaType\|artistName" packages/web/lib/components/request/MetadataInputForm.tsx | head -30`

Expected output lists the form field definitions. Use the exact interface declarations already present.

- [ ] **Step 2: Extend `MetadataFormValues` interface**

Find the `interface MetadataFormValues` block and add:

```ts
/**
 * 구조화 필드 viewmodel. source type별 조건부 렌더링에 사용. (#305)
 * wire 직렬화는 submit 지점에서 `toMediaMetadataItems`로 변환.
 */
structured: StructuredFieldsState;
```

Add the type import at the top of the file:

```ts
import type { StructuredFieldsState } from "@/lib/api/mutation-types";
```

- [ ] **Step 3: Implement per-type conditional rendering**

The current component renders description + group + artist + context for all types. Replace the description section with a type-switch. Pseudo-structure (adapt to existing JSX):

```tsx
const structuredTypes = new Set<MetadataFormValues["mediaType"]>([
  "drama",
  "movie",
  "music_video",
  "variety",
  "event",
]);

const showDescription = !structuredTypes.has(values.mediaType);

const handleStructuredChange =
  (key: keyof StructuredFieldsState) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      structured: { ...values.structured, [key]: e.target.value },
    });
  };
```

Then in JSX, replace the existing description textarea block with:

```tsx
{
  showDescription && (
    <label className="block">
      <span className="text-sm">Where is this photo from?</span>
      <textarea
        value={values.mediaDescription}
        onChange={(e) =>
          onChange({ ...values, mediaDescription: e.target.value })
        }
        placeholder={descriptionPlaceholder(values.mediaType)}
        className="…existing classes…"
      />
    </label>
  );
}

{
  !showDescription && (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm">Title</span>
        <input
          type="text"
          value={values.structured.title ?? ""}
          onChange={handleStructuredChange("title")}
          placeholder={titlePlaceholder(values.mediaType)}
          className="…existing input classes…"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(values.mediaType === "drama" || values.mediaType === "movie") && (
          <>
            <label className="block">
              <span className="text-sm">Platform</span>
              <input
                type="text"
                value={values.structured.platform ?? ""}
                onChange={handleStructuredChange("platform")}
                placeholder="e.g., Netflix, Disney+"
              />
            </label>
            <label className="block">
              <span className="text-sm">Year</span>
              <input
                type="number"
                inputMode="numeric"
                value={values.structured.year ?? ""}
                onChange={handleStructuredChange("year")}
                placeholder="e.g., 2023"
              />
            </label>
          </>
        )}

        {values.mediaType === "music_video" && (
          <label className="block">
            <span className="text-sm">Year</span>
            <input
              type="number"
              inputMode="numeric"
              value={values.structured.year ?? ""}
              onChange={handleStructuredChange("year")}
              placeholder="e.g., 2020"
            />
          </label>
        )}

        {values.mediaType === "variety" && (
          <label className="block">
            <span className="text-sm">Episode</span>
            <input
              type="text"
              value={values.structured.episode ?? ""}
              onChange={handleStructuredChange("episode")}
              placeholder="e.g., EP 42"
            />
          </label>
        )}

        {values.mediaType === "event" && (
          <>
            <label className="block">
              <span className="text-sm">Year</span>
              <input
                type="number"
                inputMode="numeric"
                value={values.structured.year ?? ""}
                onChange={handleStructuredChange("year")}
                placeholder="e.g., 2024"
              />
            </label>
            <label className="block">
              <span className="text-sm">Location</span>
              <input
                type="text"
                value={values.structured.location ?? ""}
                onChange={handleStructuredChange("location")}
                placeholder="e.g., Paris Fashion Week"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
```

Also:

- For `music_video`, update the existing Artist input's `placeholder` to MV-specific (e.g., `placeholder="e.g., BLACKPINK"`) via a conditional on `values.mediaType`.
- Preserve existing group name, artist name, and ContextSelector blocks unchanged in all branches.
- Ensure `<label>` text matches the test regex — the tests use `/^Title$/i` (exact) so the span text must be exactly `Title`, not `Media Title`.

Helpers (define near top of component file):

```ts
function titlePlaceholder(type: MetadataFormValues["mediaType"]): string {
  switch (type) {
    case "drama":
      return "e.g., The Glory";
    case "movie":
      return "e.g., Parasite (2019)";
    case "music_video":
      return "e.g., How You Like That";
    case "variety":
      return "e.g., Running Man";
    case "event":
      return "e.g., Met Gala";
    default:
      return "";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/web && bun run test:unit -- packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx`
Expected: ALL tests PASS.

- [ ] **Step 5: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors in MetadataInputForm or its consumers. If `UploadFlowSteps.tsx` reports missing `structured` on `metadataValues`, that is resolved in Task 8.

- [ ] **Step 6: Commit**

```bash
git add packages/web/lib/components/request/MetadataInputForm.tsx \
        packages/web/lib/components/request/__tests__/MetadataInputForm.test.tsx
git commit -m "feat(upload): conditional structured fields in MetadataInputForm per source type (#305)"
```

---

## Task 8: UploadFlowSteps — wire structured slice

**Files:**

- Modify: `packages/web/lib/components/request/UploadFlowSteps.tsx`

- [ ] **Step 1: Add imports**

Update the existing `@/lib/stores/requestStore` import to include new selector and setter:

```ts
import {
  useRequestStore,
  getRequestActions,
  selectHasImages,
  selectDetectedSpots,
  selectSelectedSpotId,
  selectUserKnowsItems,
  selectMediaSource,
  selectArtistName,
  selectGroupName,
  selectContext,
  selectHasInProgressWork,
  selectDisabledReason,
  selectStructuredMetadata,
  type DetectedSpot,
  type SpotSolutionData,
  type DisabledReason,
} from "@/lib/stores/requestStore";
```

- [ ] **Step 2: Subscribe to structuredMetadata and pass to form**

Inside the component, add a subscription near the other `useRequestStore(...)` calls:

```ts
const structuredMetadata = useRequestStore(selectStructuredMetadata);
```

Update `metadataValues` to include `structured`:

```tsx
const metadataValues: MetadataFormValues = {
  mediaType: mediaSource?.type ?? "user_upload",
  mediaDescription: mediaSource?.title ?? "",
  groupName: groupName ?? "",
  artistName: artistName ?? "",
  context: context ?? null,
  structured: structuredMetadata,
};
```

- [ ] **Step 3: Update `handleMetadataChange` to route structured patch + media type transitions**

Replace the existing `handleMetadataChange`:

```tsx
const handleMetadataChange = useCallback(
  (values: MetadataFormValues) => {
    const actions = getRequestActions();
    // Media type 변경은 changeMediaType으로 라우팅 — 타입-불일치 structured key drop
    if (values.mediaType !== (mediaSource?.type ?? "user_upload")) {
      actions.changeMediaType(values.mediaType);
    }
    actions.setMediaSource({
      type: values.mediaType,
      title: values.mediaDescription,
    });
    actions.setGroupName(values.groupName);
    actions.setArtistName(values.artistName);
    actions.setContext(values.context);
    actions.setStructuredMetadata(values.structured);
  },
  [mediaSource?.type],
);
```

- [ ] **Step 4: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/request/UploadFlowSteps.tsx
git commit -m "feat(upload): wire structuredMetadata store slice into MetadataInputForm (#305)"
```

---

## Task 9: Submit payload — merge manual-over-AI

**Files:**

- Modify: `packages/web/lib/hooks/useCreatePost.ts`

- [ ] **Step 1: Locate payload construction**

Run: `grep -n "media_metadata\|extractedMetadata\|createPost" packages/web/lib/hooks/useCreatePost.ts | head -20`

Expected: lines where `CreatePostRequest.media_metadata` is assembled. Identify the ones around 100-160.

- [ ] **Step 2: Add imports and merge at payload construction**

At the top of the file, add:

```ts
import {
  toMediaMetadataItems,
  mergeManualOverAi,
} from "@/lib/utils/mediaMetadata";
```

Import the selector at runtime (inside the hook body, via `useRequestStore.getState()` if not already subscribed):

```ts
const structuredMetadata = useRequestStore.getState().structuredMetadata;
const aiExtractedItems = useRequestStore.getState().extractedMetadata;

const manualItems = toMediaMetadataItems(structuredMetadata);
const media_metadata = mergeManualOverAi(manualItems, aiExtractedItems);
```

Then use `media_metadata` where the existing code previously used `extractedMetadata`.

Concrete edit: find the existing line that assigns `media_metadata:` in the payload object. Replace its right-hand side with the merged value:

```ts
// Before:
// media_metadata: extractedMetadata,

// After:
media_metadata: media_metadata,
```

- [ ] **Step 3: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Run full suite to confirm no regression**

Run: `cd packages/web && bun run test:unit`
Expected: ALL previous tests still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/hooks/useCreatePost.ts
git commit -m "feat(upload): merge manual structured metadata over AI-extracted at submit (#305)"
```

---

## Task 10: Regression sweep

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `cd packages/web && bunx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 2: Full unit suite**

Run: `cd packages/web && bun run test:unit`
Expected: all tests pass, including pre-existing `MetadataInputForm.helperText.test.tsx`, `UploadFlowSteps.test.tsx`, and the new files.

- [ ] **Step 3: Lint**

Run: `cd packages/web && bun run lint`
Expected: no new errors or warnings on touched files.

- [ ] **Step 4: Manual sanity (optional but recommended)**

Start dev: `cd packages/web && bun run dev`
Visit `/request/upload` → upload image → fork choice "No, I'm curious" → add a spot → Step 3 → switch source type `drama` → inputs render Title/Platform/Year → switch back to `user_upload` → description textarea returns, structured inputs gone.

---

## Task 11: PR

- [ ] **Step 1: Push**

```bash
cd /Users/kiyeol/development/decoded/decoded-monorepo/.claude/worktrees/305-source-type-phase-a
git push -u origin worktree-305-source-type-phase-a
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --base dev \
  --title "feat(upload): #305 Phase A — source type별 구조화 필드 (FE-only)" \
  --body "$(cat <<'EOF'
## Summary

Upload Details 단계에서 drama/movie/music_video/variety/event 각 타입별 구조화 필드(Title/Platform/Year/Episode/Location)를 입력 받을 수 있도록 MetadataInputForm을 확장합니다. BE 스키마/DTO 미변경.

### 설계 원칙
- **FE-only**: `MediaSource` 타입, BE DTO, DB 스키마 전부 미변경
- **Wire 호환**: 기존 `MediaMetadataItem[]`(key/value) 포맷 그대로. 기존 AI `extract-metadata` 파이프라인과 동일 채널
- **Manual wins**: 사용자 수동 입력이 AI 추출 결과를 덮어씀
- **Key whitelist**: `MEDIA_METADATA_KEYS = ["title","platform","year","episode","location"]`로 Phase C 마이그레이션 경로 확보

### 변경 요약
- `lib/utils/mediaMetadata.ts` 신설 — `toMediaMetadataItems`, `fromMediaMetadataItems`, `mergeManualOverAi`
- `requestStore.structuredMetadata` slice + `setStructuredMetadata`/`changeMediaType` 액션. `changeMediaType`이 type-불일치 key drop 담당
- `MetadataInputForm` 조건부 렌더: drama/movie/music_video/variety/event는 description 숨기고 구조화 필드, user_upload/youtube/other는 현행 description 유지. music_video에서 Artist placeholder를 MV 문구로 변경 (`post.artist_name` 그대로 재사용)
- `useCreatePost` submit 시 manual + AI 병합 후 `media_metadata`에 주입

### Spec 편차 / 참고
- Spec의 "canProceed 유지" 원칙 그대로. 구조화 필드는 권장이지만 submit 차단 없음
- `artist` 필드는 `MediaSource`에 추가하지 않고 기존 `post.artist_name`을 재활용
- BE DTO 확장 + Meilisearch 인덱싱은 Phase C로 이연

## Test plan
- [x] `bun run test:unit` — mediaMetadata 유틸, structuredMetadata slice, MetadataInputForm conditional render + transition, 기존 회귀 포함
- [x] `bunx tsc --noEmit` — 새 오류 없음
- [x] `bun run lint` — clean
- [ ] Manual: `/request/upload` → drama/movie/music_video/variety/event 각 타입 전환 시 필드 노출/숨김 + 입력값 보존(동일 shape 간) 또는 초기화(shape 다른 타입) 확인. Submit 시 네트워크 payload의 `media_metadata` 확인

## Refs
- Spec: `docs/superpowers/specs/2026-04-23-305-source-type-structured-fields-phase-a-design.md`
- Plan: `docs/superpowers/plans/2026-04-23-305-source-type-structured-fields-phase-a.md`

Closes #305 (Phase A)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Checklist

- Spec coverage: key whitelist (Task 1), utils (2-3), store slice + transition policy (4-5), conditional UI (6-7), payload integration (8-9), regression + PR (10-11) ✓
- No placeholders: all code samples inline, no "TBD"/"TODO" ✓
- Type consistency: `StructuredFieldsState`, `MediaMetadataKey`, `MEDIA_METADATA_KEYS`, `setStructuredMetadata`, `changeMediaType` 명칭 일관 ✓
- Edge cases: 빈 값 omit / whitelist 외 drop / duplicate 마지막 값 / transition shape mismatch 모두 테스트 ✓
- Spec 원칙: canProceed 미변경, BE 무변경, wire 호환 — 플랜 전체에서 유지 ✓
