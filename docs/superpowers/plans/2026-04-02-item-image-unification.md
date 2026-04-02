# ItemImage 컴포넌트 통일 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 전역의 아이템 이미지를 하나의 `ItemImage` 공통 컴포넌트로 통일하여 일관된 contain + blur 배경 UI 제공

**Architecture:** 새 `ItemImage` 컴포넌트를 `shared/`에 생성하고, 4개의 size 프리셋(thumbnail, card, detail, hero)으로 모든 아이템 이미지 사용처를 교체한다. next/image로 최적화하고 blur 배경은 CSS background-image + filter로 처리한다.

**Tech Stack:** React 19, Next.js 16 (next/image), TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-02-item-image-unification-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `packages/web/lib/components/shared/ItemImage.tsx` | 공통 아이템 이미지 컴포넌트 |
| Modify | `packages/web/lib/components/detail/ShopGrid.tsx` | ShopGrid 아이템 카드 이미지 교체 |
| Modify | `packages/web/lib/components/detail/ItemDetailCard.tsx` | ItemDetailCard 이미지 교체 |
| Modify | `packages/web/lib/components/detail/TopSolutionCard.tsx` | TopSolutionCard 썸네일 교체 |
| Modify | `packages/web/lib/components/detail/OtherSolutionsList.tsx` | OtherSolutionsList 썸네일 교체 |
| Modify | `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx` | 메인 이미지 + 그리드 이미지 교체 |
| Modify | `packages/web/lib/components/main-renewal/DecodeShowcase.tsx` | 모바일/데스크톱 썸네일 교체 |

---

### Task 1: ItemImage 컴포넌트 생성

**Files:**
- Create: `packages/web/lib/components/shared/ItemImage.tsx`

- [ ] **Step 1: ItemImage 컴포넌트 작성**

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  thumbnail: {
    aspectRatio: "1/1",
    sizes: "56px",
    blur: false,
  },
  card: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 50vw, 25vw",
    blur: true,
  },
  detail: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 100vw, 800px",
    blur: true,
  },
  hero: {
    aspectRatio: "3/4",
    sizes: "(max-width: 768px) 100vw, 50vw",
    blur: true,
  },
} as const;

type ItemImageSize = keyof typeof SIZE_CONFIG;

interface ItemImageProps {
  src: string;
  alt: string;
  size: ItemImageSize;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function ItemImage({
  src,
  alt,
  size,
  className,
  imgClassName,
  priority = false,
  onLoad,
  onError,
}: ItemImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const config = SIZE_CONFIG[size];

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError || !src) {
    return (
      <div
        className={cn("w-full overflow-hidden bg-muted", className)}
        style={{ aspectRatio: config.aspectRatio }}
      />
    );
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-muted", className)}
      style={{ aspectRatio: config.aspectRatio }}
    >
      {/* Blur background for card/detail/hero */}
      {config.blur && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) brightness(0.7)",
            transform: "scale(1.15)",
          }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "z-10 object-contain transition-opacity duration-200 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        sizes={config.sizes}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크 확인**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: ItemImage.tsx 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/shared/ItemImage.tsx
git commit -m "feat: add ItemImage shared component with contain + blur background"
```

---

### Task 2: ShopGrid 아이템 카드 교체

**Files:**
- Modify: `packages/web/lib/components/detail/ShopGrid.tsx:258-281`

- [ ] **Step 1: ShopGrid 이미지 영역 교체**

`ShopGrid.tsx`에서 아이템 이미지 렌더링 부분(lines 258-281)을 찾아 교체한다.

**Before** (lines 258-281):
```tsx
{/* Item Image */}
<div
  className={`relative w-full aspect-square overflow-hidden rounded-lg bg-muted ${
    isModal ? "mb-2 md:mb-3" : "mb-3 md:mb-4"
  }`}
>
  {item.imageUrl ? (
    <>
      <Image
        src={item.imageUrl}
        alt={item.product_name || "Item"}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </>
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-muted/30">
      <span className="text-muted-foreground text-sm font-serif italic">
        No Image
      </span>
    </div>
  )}
</div>
```

**After:**
```tsx
{/* Item Image */}
<ItemImage
  src={item.imageUrl || ""}
  alt={item.product_name || "Item"}
  size="card"
  className={`rounded-lg ${
    isModal ? "mb-2 md:mb-3" : "mb-3 md:mb-4"
  }`}
  imgClassName="transition-transform duration-700 group-hover:scale-105"
/>
```

또한 파일 상단에 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

기존 `Image` import에서 ShopGrid 내에서 다른 곳에서도 `Image`를 사용하는지 확인하고, 사용하지 않으면 import를 제거한다.

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "ShopGrid\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/detail/ShopGrid.tsx
git commit -m "refactor: replace ShopGrid item image with ItemImage component"
```

---

### Task 3: ItemDetailCard 교체

**Files:**
- Modify: `packages/web/lib/components/detail/ItemDetailCard.tsx:117-132`

- [ ] **Step 1: ItemDetailCard 이미지 영역 교체**

**Before** (lines 117-132):
```tsx
{/* Item Image - Layered Collage Style */}
<div className="group/image relative w-full aspect-[4/3] md:aspect-[3/2] rounded-xl overflow-visible">
  <div className="absolute inset-4 z-0 bg-primary/5 blur-3xl rounded-full" />
  <div className="absolute inset-0 z-10 bg-muted/5 rounded-xl border border-border/10 backdrop-blur-[2px] overflow-hidden" />
  {item.imageUrl && (
    <div className="absolute inset-0 z-20 transition-transform duration-700 ease-out group-hover/image:scale-105 group-hover/image:-translate-y-2">
      <Image
        src={item.imageUrl}
        alt={item.product_name || `Item ${formattedIndex}`}
        fill
        className="object-contain p-3 md:p-5 drop-shadow-2xl filter brightness-[1.02]"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 800px"
      />
    </div>
  )}
</div>
```

**After:**
```tsx
{/* Item Image */}
<div className="group/image">
  <ItemImage
    src={item.imageUrl || ""}
    alt={item.product_name || `Item ${formattedIndex}`}
    size="detail"
    className="rounded-xl transition-transform duration-700 ease-out group-hover/image:scale-105 group-hover/image:-translate-y-2"
    imgClassName="drop-shadow-2xl"
  />
</div>
```

파일 상단 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

기존 `Image` import가 더 이상 사용되지 않으면 제거.

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "ItemDetailCard\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/detail/ItemDetailCard.tsx
git commit -m "refactor: replace ItemDetailCard image with ItemImage component"
```

---

### Task 4: TopSolutionCard 썸네일 교체

**Files:**
- Modify: `packages/web/lib/components/detail/TopSolutionCard.tsx:68-90`

- [ ] **Step 1: TopSolutionCard 썸네일 교체**

이 컴포넌트에는 링크 감싸는 `<a>`와 아닌 `<div>` 두 분기가 있다. 두 곳 모두 내부 이미지를 교체한다.

**Before** (lines 68-90, 두 분기):
```tsx
{topSolution.thumbnail_url &&
  (linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted/30 border border-border/20"
    >
      <img
        src={topSolution.thumbnail_url}
        alt=""
        className="w-full h-full object-cover"
      />
    </a>
  ) : (
    <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-muted/30 border border-border/20">
      <img
        src={topSolution.thumbnail_url}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  ))}
```

**After:**
```tsx
{topSolution.thumbnail_url &&
  (linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 w-14 h-14 rounded border border-border/20"
    >
      <ItemImage
        src={topSolution.thumbnail_url}
        alt=""
        size="thumbnail"
        className="rounded"
      />
    </a>
  ) : (
    <div className="shrink-0 w-14 h-14 rounded border border-border/20">
      <ItemImage
        src={topSolution.thumbnail_url}
        alt=""
        size="thumbnail"
        className="rounded"
      />
    </div>
  ))}
```

파일 상단 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "TopSolutionCard\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/detail/TopSolutionCard.tsx
git commit -m "refactor: replace TopSolutionCard thumbnail with ItemImage component"
```

---

### Task 5: OtherSolutionsList 썸네일 교체

**Files:**
- Modify: `packages/web/lib/components/detail/OtherSolutionsList.tsx:93-115`

- [ ] **Step 1: OtherSolutionsList 썸네일 교체**

TopSolutionCard와 동일한 패턴. 두 분기(링크/비링크) 모두 교체.

**Before** (lines 93-115):
```tsx
{sol.thumbnail_url &&
  (linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 w-10 h-10 rounded overflow-hidden bg-muted/30 border border-border/20"
    >
      <img
        src={sol.thumbnail_url}
        alt=""
        className="w-full h-full object-cover"
      />
    </a>
  ) : (
    <div className="shrink-0 w-10 h-10 rounded overflow-hidden bg-muted/30 border border-border/20">
      <img
        src={sol.thumbnail_url}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  ))}
```

**After:**
```tsx
{sol.thumbnail_url &&
  (linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 w-10 h-10 rounded border border-border/20"
    >
      <ItemImage
        src={sol.thumbnail_url}
        alt=""
        size="thumbnail"
        className="rounded"
      />
    </a>
  ) : (
    <div className="shrink-0 w-10 h-10 rounded border border-border/20">
      <ItemImage
        src={sol.thumbnail_url}
        alt=""
        size="thumbnail"
        className="rounded"
      />
    </div>
  ))}
```

파일 상단 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

- [ ] **Step 2: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "OtherSolutionsList\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add packages/web/lib/components/detail/OtherSolutionsList.tsx
git commit -m "refactor: replace OtherSolutionsList thumbnails with ItemImage component"
```

---

### Task 6: MagazineItemsSection 메인 이미지 + 그리드 교체

**Files:**
- Modify: `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx:186-194, 292-299`

- [ ] **Step 1: MagazineItemsSection 메인 이미지 교체**

**Before** (line 186):
```tsx
{/* Item Image */}
<div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-72 lg:w-80">
  {item.image_url ? (
    <Image
      src={item.image_url}
      alt={item.title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 320px"
    />
  ) : (
    ...placeholder...
  )}
</div>
```

**After:**
```tsx
{/* Item Image */}
<div className="w-full shrink-0 md:w-72 lg:w-80">
  {item.image_url ? (
    <ItemImage
      src={item.image_url}
      alt={item.title}
      size="card"
      className="rounded-xl"
    />
  ) : (
    <div
      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-muted p-6 text-center"
      style={{
        background: accentColor
          ? `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`
          : undefined,
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
        {(i + 1).toString().padStart(2, "0")}
      </span>
      {item.brand && (
        <span className="font-serif text-2xl font-light tracking-wide text-foreground/70 md:text-3xl">
          {item.brand}
        </span>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 2: MagazineItemsSection Similar Items 그리드 교체**

**Before** (line 292):
```tsx
<div className="relative aspect-square w-full overflow-hidden bg-muted">
  {ri.image_url ? (
    <Image
      src={ri.image_url}
      alt={ri.title}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes="(max-width: 640px) 50vw, 160px"
    />
  ) : (
    ...placeholder...
  )}
</div>
```

**After:**
```tsx
<ItemImage
  src={ri.image_url || ""}
  alt={ri.title}
  size="card"
  imgClassName="transition-transform duration-500 group-hover:scale-105"
/>
```

파일 상단 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

기존 `Image` import가 더 이상 사용되지 않으면 제거.

- [ ] **Step 3: Similar Items 마진 조정**

메인 이미지가 aspect-square에서 3:4로 변경되므로, Similar Items 영역의 `ml-` offset을 확인하고 필요시 조정:
```tsx
{/* line 279: md:ml 값이 md:w-72/lg:w-80 + gap에 맞는지 확인 */}
<div className="mt-6 ml-0 md:ml-[calc(18rem+2.5rem)] lg:ml-[calc(20rem+2.5rem)]">
```
이 값은 `md:w-72`(18rem) + `md:gap-10`(2.5rem) 기준이므로 변경 불필요.

- [ ] **Step 4: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "MagazineItemsSection\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
git commit -m "refactor: replace MagazineItemsSection images with ItemImage component"
```

---

### Task 7: DecodeShowcase 썸네일 교체

**Files:**
- Modify: `packages/web/lib/components/main-renewal/DecodeShowcase.tsx:320-334, 361-375`

- [ ] **Step 1: 모바일 카드 썸네일 교체**

**Before** (lines 320-334):
```tsx
{item.imageUrl ? (
  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-900 border border-[var(--mag-accent)]/40 shadow-[0_0_8px_rgba(var(--mag-accent-rgb,200,170,100),0.3)]">
    <Image
      src={item.imageUrl}
      alt={item.label}
      fill
      className="object-cover"
      sizes="56px"
    />
  </div>
) : (
  <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-[var(--mag-accent)]/40 flex items-center justify-center">
    <span className="text-[8px] text-neutral-500">IMG</span>
  </div>
)}
```

**After:**
```tsx
{item.imageUrl ? (
  <div className="w-14 h-14 rounded-lg border border-[var(--mag-accent)]/40 shadow-[0_0_8px_rgba(var(--mag-accent-rgb,200,170,100),0.3)]">
    <ItemImage
      src={item.imageUrl}
      alt={item.label}
      size="thumbnail"
      className="rounded-lg"
    />
  </div>
) : (
  <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-[var(--mag-accent)]/40 flex items-center justify-center">
    <span className="text-[8px] text-neutral-500">IMG</span>
  </div>
)}
```

- [ ] **Step 2: 데스크톱 카드 썸네일 교체**

**Before** (lines 361-375):
```tsx
{item.imageUrl ? (
  <div className="relative flex-none w-14 h-14 rounded-lg overflow-hidden bg-neutral-800">
    <Image
      src={item.imageUrl}
      alt={item.label}
      fill
      className="object-cover"
      sizes="56px"
    />
  </div>
) : (
  <div className="flex-none w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center">
    <span className="text-[10px] text-neutral-500">IMG</span>
  </div>
)}
```

**After:**
```tsx
{item.imageUrl ? (
  <div className="flex-none w-14 h-14 rounded-lg">
    <ItemImage
      src={item.imageUrl}
      alt={item.label}
      size="thumbnail"
      className="rounded-lg"
    />
  </div>
) : (
  <div className="flex-none w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center">
    <span className="text-[10px] text-neutral-500">IMG</span>
  </div>
)}
```

파일 상단 import 추가:
```tsx
import { ItemImage } from "@/lib/components/shared/ItemImage";
```

기존 `Image` import가 더 이상 사용되지 않으면 제거. DecodeShowcase에서 `Image`를 다른 곳(PostImage가 아닌 곳)에서도 사용하는지 확인.

- [ ] **Step 3: 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -i "DecodeShowcase\|error" | head -10`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add packages/web/lib/components/main-renewal/DecodeShowcase.tsx
git commit -m "refactor: replace DecodeShowcase thumbnails with ItemImage component"
```

---

### Task 8: 전체 빌드 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `cd packages/web && npx tsc --noEmit --pretty 2>&1 | tail -5`
Expected: 에러 0개

- [ ] **Step 2: 린트 체크**

Run: `cd packages/web && npx eslint lib/components/shared/ItemImage.tsx lib/components/detail/ShopGrid.tsx lib/components/detail/ItemDetailCard.tsx lib/components/detail/TopSolutionCard.tsx lib/components/detail/OtherSolutionsList.tsx lib/components/detail/magazine/MagazineItemsSection.tsx lib/components/main-renewal/DecodeShowcase.tsx --no-warn-ignored 2>&1 | tail -10`
Expected: 에러 없음

- [ ] **Step 3: 빌드 체크**

Run: `cd packages/web && bun run build 2>&1 | tail -10`
Expected: 빌드 성공

- [ ] **Step 4: 미사용 import 정리 커밋 (필요시)**

각 파일에서 next/image의 `Image` import가 더 이상 사용되지 않으면 제거되었는지 최종 확인.

```bash
git add -u
git commit -m "chore: clean up unused imports after ItemImage migration"
```
