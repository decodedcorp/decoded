# Design Tokens

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

Decoded Design System의 토큰은 디자인 일관성을 위한 단일 진실 공급원(Single Source of Truth)입니다.
모든 토큰은 `packages/web/lib/design-system/tokens.ts`에서 관리되며, Tailwind CSS와 CSS 변수를 통해 전체 애플리케이션에 적용됩니다.

**시각적 참고**: [decoded.pen](./decoded.pen)

---

## Typography System

### Font Families

| 토큰 | 폰트 | 용도 | Fallback |
|------|------|------|----------|
| `serif` | Playfair Display | 제목, 브랜드, Hero 텍스트 | Georgia, serif |
| `sans` | Inter | 본문, UI, 버튼 | system-ui, sans-serif |
| `mono` | JetBrains Mono | 코드, 기술 텍스트 | Consolas, monospace |

### Font Sizes

모든 사이즈는 `typography.sizes` 객체에 정의되어 있습니다:

| 토큰 | fontSize | lineHeight | fontWeight | letterSpacing | 용도 |
|------|----------|------------|------------|---------------|------|
| `hero` | 64px | 1.1 | 700 | -0.025em | Hero 섹션 대제목 |
| `h1` | 48px | 1.15 | 600 | -0.025em | 페이지 제목 |
| `h2` | 36px | 1.2 | 600 | -0.02em | 섹션 제목 |
| `h3` | 28px | 1.25 | 600 | -0.02em | 서브섹션 제목 |
| `h4` | 24px | 1.3 | 600 | -0.02em | 카드 제목 |
| `body` | 16px | 1.5 | 400 | 0 | 본문 텍스트 (기본) |
| `small` | 14px | 1.5 | 400 | 0 | 보조 텍스트 |
| `caption` | 12px | 1.4 | 400 | 0 | 캡션, 메타 정보 |

### Responsive Typography

반응형 타이포그래피 스케일(`responsiveTypography` 객체):

| 요소 | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| `pageTitle` | text-2xl (24px) | text-3xl (30px) | text-4xl (36px) |
| `sectionTitle` | text-xl (20px) | text-2xl (24px) | text-2xl (24px) |
| `cardTitle` | text-base (16px) | text-lg (18px) | text-lg (18px) |
| `body` | text-sm (14px) | text-base (16px) | text-base (16px) |
| `caption` | text-xs (12px) | text-xs (12px) | text-sm (14px) |

**사용 예시**:

```tsx
import { responsiveTypography } from "@/lib/design-system";

// Heading 컴포넌트에서 반응형 적용
<h1 className="font-serif tracking-tight text-2xl md:text-3xl lg:text-4xl">
  페이지 제목
</h1>

// 또는 Tailwind 클래스로 직접
<h2 className={responsiveTypography.sectionTitle.mobile}>모바일 섹션</h2>
```

---

## Color System

### CSS Variable 기반 Semantic Colors

모든 색상은 CSS 변수를 참조하며, 라이트/다크 모드가 자동 전환됩니다.
실제 색상 값은 `packages/web/app/globals.css`에서 관리됩니다.

#### Base Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `background` | `--background` | 페이지 기본 배경 |
| `foreground` | `--foreground` | 기본 텍스트 색상 |

#### Component Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `card` | `--card` | 카드 배경 |
| `cardForeground` | `--card-foreground` | 카드 텍스트 |
| `popover` | `--popover` | 팝오버 배경 |
| `popoverForeground` | `--popover-foreground` | 팝오버 텍스트 |

#### Semantic Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `primary` | `--primary` | 주요 액션 (CTA 버튼, 링크) |
| `primaryForeground` | `--primary-foreground` | Primary 위의 텍스트 |
| `secondary` | `--secondary` | 보조 액션, 비활성 상태 |
| `secondaryForeground` | `--secondary-foreground` | Secondary 위의 텍스트 |
| `muted` | `--muted` | 비활성 배경 |
| `mutedForeground` | `--muted-foreground` | 보조 텍스트, 비활성 텍스트 |
| `accent` | `--accent` | 강조 요소 (hover, focus) |
| `accentForeground` | `--accent-foreground` | Accent 위의 텍스트 |
| `destructive` | `--destructive` | 삭제, 위험 액션 |
| `destructiveForeground` | `--destructive-foreground` | Destructive 위의 텍스트 |

#### UI Element Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `border` | `--border` | 기본 테두리 |
| `input` | `--input` | 입력 필드 테두리 |
| `ring` | `--ring` | Focus ring 색상 |

#### Sidebar Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `sidebar` | `--sidebar` | 사이드바 배경 |
| `sidebarForeground` | `--sidebar-foreground` | 사이드바 텍스트 |
| `sidebarPrimary` | `--sidebar-primary` | 사이드바 활성 항목 |
| `sidebarPrimaryForeground` | `--sidebar-primary-foreground` | 사이드바 활성 텍스트 |
| `sidebarAccent` | `--sidebar-accent` | 사이드바 강조 |
| `sidebarAccentForeground` | `--sidebar-accent-foreground` | 사이드바 강조 텍스트 |
| `sidebarBorder` | `--sidebar-border` | 사이드바 테두리 |
| `sidebarRing` | `--sidebar-ring` | 사이드바 focus ring |

#### Chart Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `chart1` ~ `chart5` | `--chart-1` ~ `--chart-5` | 차트/그래프 색상 팔레트 |

#### Main Page Specific Colors

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `mainBg` | `--main-bg` | 메인 페이지 배경 |
| `mainCtaBg` | `--main-cta-bg` | 메인 페이지 CTA 배경 |
| `mainAccent` | `--main-accent` | 메인 페이지 강조 색상 |
| `mainTextWhite` | `--main-text-white` | 메인 페이지 흰색 텍스트 |
| `mainTextGray` | `--main-text-gray` | 메인 페이지 회색 텍스트 |

**사용 예시**:

```tsx
import { colors } from "@/lib/design-system";

// 스타일 객체에서 사용
const styles = {
  backgroundColor: colors.card,
  color: colors.foreground,
  borderColor: colors.border,
};

// Tailwind 클래스 사용 (권장)
<div className="bg-card text-foreground border border-border">
  Card content
</div>

// Semantic colors
<button className="bg-primary text-primary-foreground">Primary Button</button>
<button className="bg-destructive text-destructive-foreground">Delete</button>
<span className="text-muted-foreground">보조 텍스트</span>
```

**라이트/다크 모드 자동 전환**:

CSS 변수는 `next-themes`와 함께 작동하여 자동으로 테마 전환됩니다.
컴포넌트는 색상 하드코딩 없이 토큰만 사용하면 됩니다.

```tsx
// globals.css에서 정의
:root {
  --primary: oklch(0.21 0.006 285.75);  /* Light mode */
}

.dark {
  --primary: oklch(0.98 0 0);           /* Dark mode */
}
```

---

## Spacing System

### Scale

4px 기준 단위를 사용하는 스페이싱 스케일:

| 토큰 | 값 | Tailwind | 용도 |
|------|----|----|------|
| `0` | 0px | `p-0`, `m-0` | 여백 제거 |
| `0.5` | 2px | `p-0.5`, `m-0.5` | 아주 작은 여백 |
| `1` | 4px | `p-1`, `m-1` | 최소 여백 |
| `1.5` | 6px | `p-1.5`, `m-1.5` | 작은 여백 |
| `2` | 8px | `p-2`, `m-2` | 작은 여백 |
| `2.5` | 10px | `p-2.5`, `m-2.5` | 중간-작은 여백 |
| `3` | 12px | `p-3`, `m-3` | 중간 여백 |
| `4` | 16px | `p-4`, `m-4` | 기본 여백 |
| `5` | 20px | `p-5`, `m-5` | 중간-큰 여백 |
| `6` | 24px | `p-6`, `m-6` | 큰 여백 |
| `8` | 32px | `p-8`, `m-8` | 매우 큰 여백 |
| `10` | 40px | `p-10`, `m-10` | 섹션 여백 |
| `12` | 48px | `p-12`, `m-12` | 큰 섹션 여백 |
| `16` | 64px | `p-16`, `m-16` | 페이지 여백 |
| `20` | 80px | `p-20`, `m-20` | 큰 페이지 여백 |
| `24` | 96px | `p-24`, `m-24` | Hero 여백 |
| `32` | 128px | `p-32`, `m-32` | 최대 여백 |

### 권장 사용 패턴

| 컨텍스트 | 권장 스케일 | 예시 |
|----------|-------------|------|
| 컴포넌트 내부 패딩 | `2` ~ `4` (8-16px) | 버튼, 카드 내부 |
| 컴포넌트 간 간격 | `4` ~ `6` (16-24px) | 카드 그리드 gap |
| 섹션 간 간격 | `6` ~ `8` (24-32px) | 페이지 섹션 구분 |
| 페이지 패딩 | `4` ~ `16` (16-64px) | 페이지 좌우 여백 (반응형) |
| Hero 섹션 | `10` ~ `24` (40-96px) | Hero 상하 여백 |

**사용 예시**:

```tsx
// 컴포넌트 내부
<Card className="p-4">  {/* 16px 내부 패딩 */}
  <CardHeader className="pb-4">  {/* 16px 하단 간격 */}
    <h3>Title</h3>
  </CardHeader>
  <CardContent className="space-y-2">  {/* 8px 자식 간격 */}
    <p>Content</p>
  </CardContent>
</Card>

// 그리드 레이아웃
<div className="grid grid-cols-4 gap-4">  {/* 16px gap */}
  <Card />
  <Card />
</div>

// 섹션 간격
<section className="py-10 md:py-16">  {/* 모바일 40px, 데스크탑 64px */}
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

---

## Breakpoints

### Responsive Breakpoints

표준 Tailwind 브레이크포인트:

| 이름 | 값 | Tailwind Prefix | 용도 |
|------|----|----|------|
| `sm` | 640px | `sm:` | 작은 태블릿 이상 |
| `md` | 768px | `md:` | 태블릿 이상 (Desktop Header 표시) |
| `lg` | 1024px | `lg:` | 데스크탑 이상 |
| `xl` | 1280px | `xl:` | 큰 데스크탑 |
| `2xl` | 1536px | `2xl:` | 초대형 화면 |

**Mobile First 접근**:

```tsx
// 기본(모바일) → 태블릿 → 데스크탑 순서로 적용
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* 모바일: 1열, 태블릿: 2열, 데스크탑: 4열 */}
</div>

<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* 모바일: 24px, 태블릿: 30px, 데스크탑: 36px */}
</h1>
```

---

## Shadows

### Shadow Scale

CSS 변수 기반 그림자 스케일 (`globals.css`에서 정의):

| 토큰 | CSS Variable | 용도 |
|------|--------------|------|
| `2xs` | `--shadow-2xs` | 아주 작은 그림자 (미묘한 구분) |
| `xs` | `--shadow-xs` | 작은 그림자 (카드 기본) |
| `sm` | `--shadow-sm` | 작은-중간 그림자 |
| `md` | `--shadow-md` | 중간 그림자 (Elevated 카드) |
| `lg` | `--shadow-lg` | 큰 그림자 (Hover 상태) |
| `xl` | `--shadow-xl` | 매우 큰 그림자 (모달) |
| `2xl` | `--shadow-2xl` | 최대 그림자 (드롭다운) |

**사용 예시**:

```tsx
import { shadows } from "@/lib/design-system";

// 스타일 객체
const styles = {
  boxShadow: shadows.md,
};

// Tailwind 클래스 사용 (권장)
<Card className="shadow-sm hover:shadow-lg">
  {/* 기본 작은 그림자, hover 시 큰 그림자 */}
</Card>

<div className="shadow-2xl">  {/* 모달, 드롭다운 */}
  Modal content
</div>
```

---

## Border Radius

### Radius Scale

CSS 변수 `--radius`를 기준으로 계산되는 둥근 모서리:

| 토큰 | 계산식 | 용도 |
|------|-------|------|
| `none` | 0 | 둥근 모서리 제거 |
| `sm` | `calc(var(--radius) - 4px)` | 작은 모서리 (버튼 내부 요소) |
| `md` | `var(--radius)` | 기본 모서리 (카드, 버튼) |
| `lg` | `calc(var(--radius) + 4px)` | 큰 모서리 |
| `xl` | `calc(var(--radius) + 8px)` | 매우 큰 모서리 |
| `2xl` | `calc(var(--radius) + 12px)` | 최대 모서리 |
| `full` | 9999px | 완전한 원형 (아바타, 뱃지) |
| `main` | `var(--main-border-radius)` | 메인 페이지 전용 |

**사용 예시**:

```tsx
import { borderRadius } from "@/lib/design-system";

// Tailwind 클래스 사용 (권장)
<Card className="rounded-lg">  {/* md + 4px */}
  Card content
</Card>

<button className="rounded-md">  {/* 기본 radius */}
  Button
</button>

<img className="rounded-full" />  {/* 원형 아바타 */}

<input className="rounded-sm" />  {/* 작은 모서리 */}
```

---

## Z-Index Scale

### Layer 우선순위

일관된 레이어 순서를 위한 z-index 스케일:

| 토큰 | 값 | 용도 |
|------|----|----|
| `base` | 0 | 기본 레이어 |
| `floating` | 10 | Floating 요소 (카드 hover) |
| `dropdown` | 20 | 드롭다운 메뉴 |
| `header` | 30 | Sticky header/footer |
| `sidebar` | 40 | Sidebar (모바일) |
| `modalBackdrop` | 50 | 모달 배경 (dim) |
| `modal` | 60 | 모달 콘텐츠 |
| `toast` | 70 | 토스트 알림 |
| `tooltip` | 100 | 툴팁 (최상위) |

**사용 예시**:

```tsx
import { zIndex } from "@/lib/design-system";

// 스타일 객체
const headerStyles = {
  zIndex: zIndex.header,
};

// Tailwind 커스텀 클래스
<header className="fixed top-0 z-[30]">  {/* header */}
  Header
</header>

<div className="fixed inset-0 z-[50]">  {/* modalBackdrop */}
  Modal backdrop
</div>

<div className="fixed inset-0 z-[60]">  {/* modal */}
  Modal content
</div>
```

---

## Token 사용 가이드

### 1. Import 방법

```tsx
// 전체 import
import { typography, colors, spacing, breakpoints, shadows, borderRadius, zIndex } from "@/lib/design-system";

// 특정 토큰만 import
import { colors, spacing } from "@/lib/design-system";
```

### 2. TypeScript 타입 활용

```tsx
import type { ColorToken, SpacingToken, ShadowToken } from "@/lib/design-system";

// 타입 안전한 props
interface ComponentProps {
  textColor?: ColorToken;
  padding?: SpacingToken;
  shadow?: ShadowToken;
}
```

### 3. Tailwind CSS 우선 사용

토큰 값을 직접 사용하기보다는 Tailwind CSS 클래스를 우선 사용하세요:

```tsx
// ❌ 나쁜 예 - 토큰 직접 사용
<div style={{ color: colors.primary, padding: spacing[4] }}>

// ✅ 좋은 예 - Tailwind 클래스
<div className="text-primary p-4">
```

### 4. CSS 변수 활용

Tailwind에서 지원하지 않는 경우 CSS 변수 사용:

```tsx
// CSS 변수 직접 참조
<div style={{ backgroundColor: "var(--card)" }}>

// 또는 토큰에서 가져오기
import { colors } from "@/lib/design-system";
<div style={{ backgroundColor: colors.card }}>
```

---

## 관련 문서

- [Typography Components](./components/typography.md) - Heading, Text 컴포넌트
- [Component Index](./components/README.md) - 전체 컴포넌트 목록
- [Design Patterns](./patterns.md) - 디자인 패턴 가이드
- [decoded.pen](./decoded.pen) - 시각적 디자인 레퍼런스

---

## TypeScript 타입 정의

```typescript
// tokens.ts에서 export되는 타입들
export type TypographySize = keyof typeof typography.sizes;
export type ResponsiveTypography = keyof typeof responsiveTypography;
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type BreakpointToken = keyof typeof breakpoints;
export type ShadowToken = keyof typeof shadows;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ZIndexToken = keyof typeof zIndex;
```

**사용 예시**:

```tsx
import type { ColorToken, SpacingToken } from "@/lib/design-system";

interface BoxProps {
  color: ColorToken;
  padding: SpacingToken;
}

function Box({ color, padding }: BoxProps) {
  return <div className={`text-${color} p-${padding}`} />;
}
```

---

> **Note**: 토큰 값을 변경하면 전체 디자인 시스템에 영향을 미칩니다.
> `packages/web/lib/design-system/tokens.ts` 파일 수정 전에 디자인 팀과 상의하세요.
