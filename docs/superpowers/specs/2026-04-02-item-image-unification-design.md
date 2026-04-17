---
title: ItemImage 컴포넌트 통일 설계
owner: human
status: draft
updated: 2026-04-02
tags: [ui]
---

# ItemImage 컴포넌트 통일 설계

> 프로젝트 전역의 아이템 이미지 표시를 하나의 공통 컴포넌트로 통일하여 일관된 UI 제공

## 문제

현재 7개 컴포넌트에서 아이템 이미지를 각각 다르게 렌더링:

- 서로 다른 aspect-ratio (square, 4/3, 3/2, 4/5)
- `object-cover`로 인한 잘림
- next/image와 plain `<img>` 혼재
- 에러/로딩 상태 처리 비일관

## 결정사항

- **접근법:** 새 `ItemImage` 컴포넌트 생성 (PostImage와 역할 분리)
- **표시 방식:** `object-contain` + blur 배경 (이미지 절대 잘리지 않음)
- **이미지 최적화:** next/image 사용 (main), CSS background-image (blur 레이어)

## 컴포넌트 설계

### 파일 위치

`packages/web/lib/components/shared/ItemImage.tsx`

### 인터페이스

```typescript
interface ItemImageProps {
  src: string;
  alt: string;
  size: "thumbnail" | "card" | "detail" | "hero";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}
```

### Size 프리셋

| 프리셋      | 용도                                | aspect-ratio | sizes (next/image)                | blur 배경       |
| ----------- | ----------------------------------- | ------------ | --------------------------------- | --------------- |
| `thumbnail` | SolutionCard, DecodeShowcase 썸네일 | 1:1          | `56px`                            | 없음 (bg-muted) |
| `card`      | ShopGrid, MagazineItems 카드        | 3:4          | `(max-width: 768px) 50vw, 25vw`   | 있음            |
| `detail`    | ItemDetailCard                      | 3:4          | `(max-width: 768px) 100vw, 800px` | 있음            |
| `hero`      | 모달 메인 이미지 (미래 사용)        | 3:4          | `(max-width: 768px) 100vw, 50vw`  | 있음            |

### 렌더링 구조

```
container (relative, overflow-hidden, aspect-ratio per preset)
├── [card/detail/hero만] div.blur-bg
│   └── CSS background-image + blur(24px) + brightness(0.7) + scale(1.15)
├── [thumbnail만] bg-muted 배경색
└── next/image (fill, object-contain, z-10)
    └── fade-in on load (opacity transition)
```

### 렌더링 분기

1. **에러 또는 src 없음** → `bg-muted` 배경의 빈 컨테이너 (aspect-ratio 유지)
2. **thumbnail** → blur 없이 `bg-muted` 톤 배경 + `object-contain` (56px에서 blur는 성능 낭비)
3. **card / detail / hero** → blur 배경 + `object-contain`

### 성능 고려

- next/image로 webp/avif 자동 변환, 반응형 sizes 최적화
- blur 배경은 CSS `background-image` + `filter` (장식 요소, 추가 최적화 불필요)
- `loading="lazy"` 기본, `priority=true` 시 `eager` + `fetchPriority="high"`
- thumbnail의 `sizes="56px"`로 작은 이미지만 로드

### 라이트/다크 모드

- blur 배경: `brightness(0.7)` 양쪽 모드에서 자연스럽게 동작
- placeholder/에러 배경: `bg-muted` 테마 토큰 사용

## 교체 대상

| #   | 컴포넌트                    | 파일                                      | 현재 방식                                                      | → ItemImage size |
| --- | --------------------------- | ----------------------------------------- | -------------------------------------------------------------- | ---------------- |
| 1   | ShopGrid 아이템 카드        | `detail/ShopGrid.tsx:260`                 | `aspect-square` + next/image + `object-cover`                  | `card`           |
| 2   | ItemDetailCard              | `detail/ItemDetailCard.tsx:118`           | `aspect-[4/3]→md:aspect-[3/2]` + next/image + `object-contain` | `detail`         |
| 3   | TopSolutionCard             | `detail/TopSolutionCard.tsx:74`           | `w-14 h-14` + plain `<img>` + `object-cover`                   | `thumbnail`      |
| 4   | OtherSolutionsList          | `detail/OtherSolutionsList.tsx:99`        | `w-10 h-10` + plain `<img>` + `object-cover`                   | `thumbnail`      |
| 5   | MagazineItemsSection 메인   | `magazine/MagazineItemsSection.tsx:130`   | `aspect-square w-72/w-80` + next/image + `object-cover`        | `card`           |
| 6   | MagazineItemsSection 그리드 | `magazine/MagazineItemsSection.tsx:236`   | `aspect-square` + next/image + `object-cover`                  | `card`           |
| 7   | DecodeShowcase 썸네일       | `main-renewal/DecodeShowcase.tsx:321,362` | `w-14 h-14` + next/image + `object-cover`                      | `thumbnail`      |

## 교체하지 않는 것

- **PostImage** — 포스트(사진) 이미지 전용, 그대로 유지
- **ImageCanvas** — 스팟 인터랙션 포함, 별도 목적
- **HeroSection** — 포스트 메인 이미지, 아이템이 아님

## 성공 기준

- 모든 아이템 이미지가 잘리지 않고 전체가 보임
- 비율이 다른 이미지도 blur 배경으로 자연스럽게 표시
- 기존 호버 효과(scale-105 등) 유지
- 에러/로딩 상태 일관
- 타입 에러 없음, 빌드 성공
