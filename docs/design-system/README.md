# Decoded Design System

> Version: 2.1.0
> Last Updated: 2026-02-12

---

## Overview

Decoded Design System v2.1은 웹과 모바일 앱 전반에 걸쳐 일관된 사용자 경험을 제공하기 위한 디자인 토큰, 컴포넌트, 패턴을 정의합니다.

**v2.0 주요 변경사항**:
- Typography 컴포넌트 (Heading, Text) 추가
- Card 패밀리 확장 (ProductCard, GridCard, FeedCard, ProfileHeaderCard)
- Desktop/Mobile Header 컴포넌트
- 통합 Design Tokens 문서 (tokens.md)
- 디자인 패턴 가이드 (patterns.md)

**v2.1 추가 변경사항**:
- 35개 컴포넌트 라이브러리 완성
- Hotspot/SpotCard/ArtistCard 등 도메인 특화 컴포넌트 추가
- Navigation 컴포넌트 (NavBar, NavItem, SectionHeader)
- Button 컴포넌트 (ActionButton, OAuthButton, GuestButton)
- Feedback 컴포넌트 (Tag, Badge, Divider, Tabs, StepIndicator, LoadingSpinner, LoginCard, BottomSheet)

**시각적 참고**: [decoded.pen](./decoded.pen)

---

## Document Index

### Foundation (Tokens)

| Document | Description | Status |
|----------|-------------|--------|
| [tokens.md](./tokens.md) | **통합 토큰 레퍼런스** (Typography, Colors, Spacing, Shadows, Z-Index) | ✅ Complete |
| [colors.md](./colors.md) | 컬러 시스템 상세 (v1.0 legacy) | Complete |
| [typography.md](./typography.md) | 타이포그래피 시스템 상세 (v1.0 legacy) | Complete |
| [spacing.md](./spacing.md) | 간격 및 레이아웃 시스템 상세 (v1.0 legacy) | Complete |
| [icons.md](./icons.md) | 아이콘 시스템 | Complete |

**💡 Quick Access**: 모든 토큰 값은 [tokens.md](./tokens.md)에서 한 번에 확인할 수 있습니다.

### Components (v2.0)

| Document | Description | Status |
|----------|-------------|--------|
| [components/README.md](./components/README.md) | 컴포넌트 인덱스 및 Import 가이드 | ✅ Complete |
| [components/typography.md](./components/typography.md) | Heading, Text 컴포넌트 | ✅ Complete |
| [components/inputs.md](./components/inputs.md) | Input, SearchInput 컴포넌트 | ✅ Complete |
| [components/cards.md](./components/cards.md) | Card 패밀리 (Card, ProductCard, GridCard, FeedCard, ProfileHeaderCard) | ✅ Complete |
| [components/headers.md](./components/headers.md) | DesktopHeader, MobileHeader, DesktopFooter | ✅ Complete |

### v2.1 Components

| Component Category | Files | Status |
|-------------------|-------|--------|
| **Navigation** | nav-bar.tsx, nav-item.tsx, section-header.tsx | ✅ Complete |
| **Buttons** | action-button.tsx, oauth-button.tsx, guest-button.tsx | ✅ Complete |
| **Domain Cards** | artist-card.tsx, spot-card.tsx, spot-detail.tsx, shop-carousel-card.tsx, stat-card.tsx, ranking-item.tsx, leader-item.tsx, skeleton-card.tsx | ✅ Complete |
| **Feedback** | tag.tsx, badge.tsx, divider.tsx, tabs.tsx, step-indicator.tsx, loading-spinner.tsx, login-card.tsx, bottom-sheet.tsx, hotspot.tsx | ✅ Complete |

### Patterns

| Document | Description | Status |
|----------|-------------|--------|
| [patterns.md](./patterns.md) | 디자인 패턴 가이드 (레이아웃, 애니메이션, 상태 관리, 컴포지션, 테마) | ✅ Complete |

---

## Quick Start

### 1. Import Design System

```tsx
// 토큰 import
import { colors, spacing, typography } from "@/lib/design-system";

// 컴포넌트 import
import { Heading, Text, Card, ProductCard, Input } from "@/lib/design-system";
```

### 2. Use Tokens

```tsx
// Tailwind CSS 클래스 사용 (권장)
<div className="bg-card text-foreground p-4 rounded-lg shadow-sm">
  Card content
</div>

// 또는 토큰 직접 사용
import { colors, spacing } from "@/lib/design-system";
const styles = {
  backgroundColor: colors.card,
  padding: spacing[4],
};
```

### 3. Use Components

```tsx
import { Heading, Text, Card, CardHeader, CardContent } from "@/lib/design-system";

function MyComponent() {
  return (
    <Card variant="elevated" size="lg">
      <CardHeader>
        <Heading variant="h3">Card Title</Heading>
        <Text variant="small" textColor="muted">Subtitle</Text>
      </CardHeader>
      <CardContent>
        <Text>Card content goes here</Text>
      </CardContent>
    </Card>
  );
}
```

---

## Core Concepts

### Design Tokens

**단일 진실 공급원**: 모든 디자인 값은 `packages/web/lib/design-system/tokens.ts`에서 관리됩니다.

- **Typography**: Font families, sizes, weights, responsive scales
- **Colors**: Semantic colors (CSS variables) with light/dark mode support
- **Spacing**: 4px-based scale (0-32)
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Shadows**: 2xs ~ 2xl
- **Border Radius**: sm ~ 2xl, full
- **Z-Index**: base ~ tooltip (0-100)

자세한 내용: [tokens.md](./tokens.md)

### Component Variants (CVA)

모든 컴포넌트는 `class-variance-authority` (CVA)를 사용한 variant 시스템을 지원합니다:

```tsx
// Heading variants
<Heading variant="hero">Hero Text</Heading>
<Heading variant="h1">Page Title</Heading>
<Heading variant="h2">Section Title</Heading>

// Card variants
<Card variant="default" size="md" />
<Card variant="elevated" size="lg" interactive />
<Card variant="outline" size="sm" />
```

### Composition Pattern

Card 컴포넌트는 slot composition 패턴을 사용합니다:

```tsx
<Card>
  <CardHeader>Header content</CardHeader>
  <CardContent>Main content</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

---

## Quick Reference

### Typography

| Variant | Size (Desktop) | Usage |
|---------|---------------|-------|
| hero | 64px+ | Hero 섹션 대제목 |
| h1 | 48px+ | 페이지 제목 |
| h2 | 36px+ | 섹션 제목 |
| h3 | 28px+ | 서브섹션 제목 |
| h4 | 24px+ | 카드 제목 |
| body | 16px | 본문 텍스트 |
| small | 14px | 보조 텍스트 |
| caption | 12px | 캡션, 메타 |

### Colors (Semantic)

| Token | Usage |
|-------|-------|
| primary | 주요 액션 (CTA 버튼, 링크) |
| secondary | 보조 액션, 비활성 상태 |
| destructive | 삭제, 위험 액션 |
| muted | 비활성 배경, 보조 텍스트 |
| accent | 강조 요소 (hover, focus) |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 2 | 8px | 컴포넌트 내부 최소 |
| 4 | 16px | 컴포넌트 내부 기본 |
| 6 | 24px | 컴포넌트 간 간격 |
| 8 | 32px | 섹션 간 간격 |
| 10-16 | 40-64px | 페이지 여백 (반응형) |

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| sm | 640px | 작은 태블릿 이상 |
| md | 768px | 태블릿 이상 (Desktop Header 표시) |
| lg | 1024px | 데스크탑 이상 |
| xl | 1280px+ | 큰 데스크탑 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| CSS | Tailwind CSS 3.4 |
| Color System | OKLCH |
| Theme | next-themes (Light/Dark) |
| Animations | GSAP, Motion |
| Icons | Lucide Icons |

---

## Usage Guidelines

### 1. 색상 사용

- **Primary**: 주요 액션 (저장, 구매, 제출)
- **Secondary**: 보조 액션, 비활성 상태
- **Destructive**: 삭제, 위험한 액션
- **Muted**: 보조 텍스트, 비활성 상태

### 2. 타이포그래피

- **제목**: Playfair Display (font-serif)
- **본문**: Inter (font-sans)
- **코드**: Monospace

### 3. 간격

- 4px 기준 스케일 사용
- 컴포넌트 내부: space-2 ~ space-4
- 섹션 간: space-6 ~ space-8

### 4. 반응형

- Mobile First 접근
- Breakpoint별 레이아웃 조정
- 터치 타겟 최소 44px (모바일)

---

## Related Documentation

- Feature Specs: [specs/feature-spec/](../../specs/feature-spec/)
- Wireframes: [specs/feature-spec/wireframes/](../../specs/feature-spec/wireframes/)
- Database Schema: [docs/database/](../database/)
