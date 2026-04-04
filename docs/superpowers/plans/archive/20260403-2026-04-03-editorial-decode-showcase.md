# Editorial Pull Page — DecodeShowcase 섹션 대체 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editorial pull page(`/posts/[id]`)의 magazine 모드에서 static 이미지+SpotDot 섹션(lines 295-327)을 메인페이지에서 제거된 `DecodeShowcase` 컴포넌트로 대체한다. AI detection 애니메이션(GSAP scroll-pinned timeline)과 동일한 기능을 그대로 가져온다.

**Architecture:** `ImageDetailContent`의 magazine static image+spot 섹션을 `DecodeShowcase`로 교체. 기존 `normalizedItems` 데이터를 `DetectedItem[]` 형식으로 변환하는 어댑터 함수를 작성. `DecodeShowcase`는 이미 `packages/web/lib/components/main-renewal/`에 존재하므로 코드 이동 없이 import만 추가.

**Tech Stack:** React 19, GSAP + ScrollTrigger, Next.js Image, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/web/lib/components/detail/ImageDetailContent.tsx` | Modify | static image+spot 섹션을 `DecodeShowcase`로 교체 |
| `packages/web/lib/components/detail/adapters/toDecodeShowcaseData.ts` | Create | `normalizedItems` → `DecodeShowcaseData` 변환 어댑터 |
| `packages/web/lib/components/detail/adapters/toDecodeShowcaseData.test.ts` | Create | 어댑터 유닛 테스트 |

---

### Task 1: 어댑터 함수 — `toDecodeShowcaseData` 테스트 작성

**Files:**
- Create: `packages/web/lib/components/detail/adapters/toDecodeShowcaseData.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import { describe, it, expect } from "vitest";
import { toDecodeShowcaseData } from "./toDecodeShowcaseData";
import type { NormalizedItem } from "../types";

describe("toDecodeShowcaseData", () => {
  const baseItem: NormalizedItem = {
    id: 1,
    image_id: "img-1",
    product_name: "Wool Coat",
    sam_prompt: null,
    description: null,
    center: null,
    cropped_image_path: null,
    metadata: { brand: "COS", sub_category: "Outerwear" },
    created_at: "2026-01-01",
    spot_id: "spot-1",
    normalizedCenter: { x: 0.25, y: 0.35 },
    normalizedBox: { top: 0.3, left: 0.2, width: 0.1, height: 0.1 },
  };

  it("converts normalizedItems with coordinates to DetectedItem[]", () => {
    const items = [
      baseItem,
      {
        ...baseItem,
        id: 2,
        product_name: "Denim Jacket",
        normalizedCenter: { x: 0.7, y: 0.6 },
        metadata: { brand: "Acne Studios" },
      },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "NEWJEANS",
    });

    expect(result.sourceImageUrl).toBe("https://example.com/image.jpg");
    expect(result.artistName).toBe("NEWJEANS");
    expect(result.detectedItems).toHaveLength(2);
    expect(result.detectedItems[0]).toEqual({
      id: "1",
      label: "Wool Coat",
      brand: "COS",
      imageUrl: undefined,
      bbox: { x: 25, y: 35, width: 0, height: 0 },
    });
    expect(result.detectedItems[1]).toEqual({
      id: "2",
      label: "Denim Jacket",
      brand: "Acne Studios",
      imageUrl: undefined,
      bbox: { x: 70, y: 60, width: 0, height: 0 },
    });
  });

  it("skips items without normalizedCenter", () => {
    const items = [
      baseItem,
      { ...baseItem, id: 3, normalizedCenter: null },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "IVE",
    });

    expect(result.detectedItems).toHaveLength(1);
  });

  it("limits to 4 items max", () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      ...baseItem,
      id: i + 1,
      normalizedCenter: { x: 0.1 * (i + 1), y: 0.1 * (i + 1) },
    })) as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems).toHaveLength(4);
  });

  it("includes cropped_image_path as imageUrl via proxy", () => {
    const items = [
      {
        ...baseItem,
        cropped_image_path: "https://storage.example.com/cropped/1.jpg",
      },
    ] as NormalizedItem[];

    const result = toDecodeShowcaseData({
      items,
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems[0].imageUrl).toBe(
      "/api/v1/image-proxy?url=https%3A%2F%2Fstorage.example.com%2Fcropped%2F1.jpg"
    );
  });

  it("returns fallback when no valid items", () => {
    const result = toDecodeShowcaseData({
      items: [],
      imageUrl: "https://example.com/image.jpg",
      artistName: "TEST",
    });

    expect(result.detectedItems).toHaveLength(0);
    expect(result.sourceImageUrl).toBe("https://example.com/image.jpg");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `cd packages/web && bunx vitest run lib/components/detail/adapters/toDecodeShowcaseData.test.ts`
Expected: FAIL — `toDecodeShowcaseData` 모듈 없음

---

### Task 2: 어댑터 함수 — `toDecodeShowcaseData` 구현

**Files:**
- Create: `packages/web/lib/components/detail/adapters/toDecodeShowcaseData.ts`

- [ ] **Step 1: 어댑터 함수 작성**

```typescript
import type { NormalizedItem } from "../types";
import type { DecodeShowcaseData } from "@/lib/components/main-renewal/types";

interface ToDecodeShowcaseDataParams {
  items: NormalizedItem[];
  imageUrl: string;
  artistName: string;
}

/**
 * Converts detail page normalizedItems to DecodeShowcaseData format.
 * normalizedCenter uses 0-1 range; DecodeShowcase bbox uses 0-100 percentage.
 */
export function toDecodeShowcaseData({
  items,
  imageUrl,
  artistName,
}: ToDecodeShowcaseDataParams): DecodeShowcaseData {
  const detectedItems = items
    .filter((item) => item.normalizedCenter !== null)
    .slice(0, 4)
    .map((item) => {
      const meta = item.metadata as Record<string, unknown> | undefined;
      const croppedUrl = item.cropped_image_path;
      return {
        id: String(item.id),
        label: item.product_name ?? item.sam_prompt ?? `Item ${item.id}`,
        brand: (meta?.brand as string) ?? undefined,
        imageUrl: croppedUrl
          ? `/api/v1/image-proxy?url=${encodeURIComponent(croppedUrl)}`
          : undefined,
        bbox: {
          x: Math.round(item.normalizedCenter!.x * 100),
          y: Math.round(item.normalizedCenter!.y * 100),
          width: 0,
          height: 0,
        },
      };
    });

  return {
    sourceImageUrl: imageUrl,
    artistName,
    detectedItems,
    tagline: "See how it's Decoded",
  };
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

Run: `cd packages/web && bunx vitest run lib/components/detail/adapters/toDecodeShowcaseData.test.ts`
Expected: ALL PASS

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/detail/adapters/
git commit -m "feat(detail): add toDecodeShowcaseData adapter for editorial DecodeShowcase"
```

---

### Task 3: `ImageDetailContent` — static image+spot 섹션을 `DecodeShowcase`로 교체

**Files:**
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx:1-10` (imports)
- Modify: `packages/web/lib/components/detail/ImageDetailContent.tsx:293-328` (섹션 교체)

- [ ] **Step 1: import 추가**

`ImageDetailContent.tsx` 상단에 2개 import 추가:

```typescript
// 기존 imports 아래에 추가
import DecodeShowcase from "@/lib/components/main-renewal/DecodeShowcase";
import { toDecodeShowcaseData } from "./adapters/toDecodeShowcaseData";
```

- [ ] **Step 2: `decodeShowcaseData` useMemo 추가**

`magazineCssVars` 선언 바로 위(약 line 235)에 추가:

```typescript
  // Build DecodeShowcase data from normalized items (magazine mode)
  const decodeShowcaseData = useMemo(() => {
    if (!hasMagazine || !imageUrl) return null;
    const itemsWithCenter = normalizedItems.filter((i) => i.normalizedCenter);
    if (itemsWithCenter.length === 0) return null;
    return toDecodeShowcaseData({
      items: normalizedItems,
      imageUrl,
      artistName: image.artist_name ?? image.group_name ?? "DECODED",
    });
  }, [hasMagazine, imageUrl, normalizedItems, image.artist_name, image.group_name]);
```

- [ ] **Step 3: static image+spot 섹션을 DecodeShowcase로 교체**

lines 293-328의 기존 코드:

```typescript
        {/* Section 2: Interactive Showcase (non-magazine) or static post image with spot dots (magazine) */}
        {/* In modal mode, the floating left panel already shows this image — skip duplicate */}
        {Boolean(hasMagazine && imageUrl && !isModal) && (
          <section className="mx-auto max-w-sm px-4 py-8 md:px-8 md:py-12">
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={imageUrl!}
                alt="Post image"
                width={384}
                height={0}
                className="h-auto w-full"
                sizes="(max-width: 768px) 80vw, 384px"
                priority
              />
              {/* Spot overlay dots */}
              {normalizedItems.map((item) => {
                if (!item.normalizedCenter) return null;
                const meta = item.metadata as unknown as
                  | Record<string, unknown>
                  | undefined;
                return (
                  <SpotDot
                    key={item.id}
                    mode="percent"
                    x={item.normalizedCenter.x}
                    y={item.normalizedCenter.y}
                    label={item.product_name ?? ""}
                    brand={meta?.brand as string | undefined}
                    category={meta?.sub_category as string | undefined}
                    accentColor={accentColor}
                  />
                );
              })}
            </div>
          </section>
        )}
```

교체할 코드:

```typescript
        {/* Section 2: DecodeShowcase (magazine) or Interactive Showcase (non-magazine) */}
        {/* In modal mode, skip — the floating left panel already shows this image */}
        {decodeShowcaseData && !isModal && !isExplorePreview && (
          <DecodeShowcase data={decodeShowcaseData} />
        )}
```

- [ ] **Step 4: 미사용 import 정리**

`SpotDot`이 이 섹션에서만 사용되었다면 import 제거. 단, `SpotDot`이 다른 곳에서도 사용되는지 확인 필요 — `InteractiveShowcase`에서 별도 import하므로 `ImageDetailContent.tsx`에서는 제거 가능할 수 있음.

`next/image`의 `Image` import도 이 섹션에서만 사용되었다면 제거.

Grep으로 확인:
```bash
grep -n "SpotDot\|<Image " packages/web/lib/components/detail/ImageDetailContent.tsx
```

`SpotDot`과 `Image`가 이 섹션 외에 사용되지 않으면 import 제거:
```typescript
// 제거 가능한 imports:
// import Image from "next/image";
// import { SpotDot } from "./SpotDot";
```

- [ ] **Step 5: 타입 체크**

Run: `cd packages/web && bunx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors (또는 기존 에러만)

- [ ] **Step 6: 커밋**

```bash
git add packages/web/lib/components/detail/ImageDetailContent.tsx
git commit -m "feat(detail): replace static image+spot section with DecodeShowcase in editorial page"
```

---

### Task 4: 수동 QA 검증

**Files:** None (브라우저 확인)

- [ ] **Step 1: 개발 서버 확인**

Run: `just local-fe` (이미 실행 중이면 스킵)

- [ ] **Step 2: Editorial pull page 확인**

URL: `http://localhost:3000/posts/92288cc9-5fce-4584-8fc9-2594b7d6a77f`

확인 사항:
1. "See how it's Decoded" 헤더 텍스트가 보이는가
2. 이미지 위에 GSAP 스크롤 핀 애니메이션이 작동하는가
3. dot → line → card 순서로 순차 등장하는가
4. 프로그레스 바("Detecting X/N")가 업데이트되는가
5. 모바일 뷰포트(< 768px)에서 thumbnail 카드가 정상 표시되는가
6. 데스크톱에서 full card가 이미지 양쪽에 표시되는가

- [ ] **Step 3: explore-preview 모드 확인**

Explore 페이지에서 해당 포스트를 모달로 열었을 때 DecodeShowcase가 **표시되지 않아야** 함 (`isExplorePreview` 조건으로 숨김)

- [ ] **Step 4: modal 모드 확인**

디테일 모달에서도 DecodeShowcase가 **표시되지 않아야** 함 (`isModal` 조건으로 숨김)

- [ ] **Step 5: 아이템 없는 magazine 포스트 확인**

아이템 좌표가 없는 magazine 포스트에서 `decodeShowcaseData`가 `null`이 되어 섹션이 렌더링되지 않는 것을 확인

---

### Task 5 (Optional): DecodeShowcase ScrollTrigger 충돌 방지

**Files:**
- Modify: `packages/web/lib/components/main-renewal/DecodeShowcase.tsx` (필요 시)

- [ ] **Step 1: ScrollTrigger scroller 확인**

`DecodeShowcase`의 `ScrollTrigger`가 `trigger: sectionRef.current`와 `pin: true`를 사용한다. 이는 **풀 페이지** 모드에서는 문제없지만, 만약 모달 내부 스크롤 컨테이너에서 사용된다면 `scroller` 옵션이 필요할 수 있다.

현재 Task 3에서 `!isModal`과 `!isExplorePreview` 조건으로 모달/프리뷰에서는 렌더링하지 않으므로, 풀 페이지에서만 동작 → 충돌 없음.

Task 4의 QA에서 스크롤 핀 애니메이션이 정상 작동하지 않는 경우에만 이 태스크를 수행:

```typescript
// DecodeShowcase.tsx의 ScrollTrigger 설정에 추가 필요 시:
scrollTrigger: {
  trigger: sectionRef.current,
  pin: true,
  scrub: 1,
  start: "top top",
  end: `+=${pinDistance}`,
  // 디테일 페이지에서는 이미 다른 ScrollTrigger가 있을 수 있으므로
  // invalidateOnRefresh 추가
  invalidateOnRefresh: true,
},
```

- [ ] **Step 2: 확인 후 커밋 (변경사항이 있는 경우에만)**

```bash
git add packages/web/lib/components/main-renewal/DecodeShowcase.tsx
git commit -m "fix(detail): add invalidateOnRefresh to DecodeShowcase ScrollTrigger for editorial page"
```
