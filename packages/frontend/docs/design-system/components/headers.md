# Header & Footer Components

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

Header와 Footer 컴포넌트는 애플리케이션 레이아웃의 기본 네비게이션과 정보 영역을 제공합니다.
반응형 디자인을 지원하며, Desktop과 Mobile 환경에 최적화된 별도 컴포넌트를 제공합니다.

**파일 위치**:
- `packages/web/lib/design-system/desktop-header.tsx`
- `packages/web/lib/design-system/mobile-header.tsx`
- `packages/web/lib/design-system/desktop-footer.tsx`

**시각적 참고**: [decoded.pen](../decoded.pen)

---

## Import

```tsx
// Header/Footer import
import { DesktopHeader, MobileHeader, DesktopFooter } from "@/lib/design-system";

// Variants import
import { desktopHeaderVariants, mobileHeaderVariants } from "@/lib/design-system";

// TypeScript types
import type { DesktopHeaderProps, MobileHeaderProps, DesktopFooterProps } from "@/lib/design-system";
```

---

## DesktopHeader

### 개요

데스크탑 환경 (md breakpoint 이상)을 위한 네비게이션 헤더입니다.
로고, 네비게이션 링크, 검색 버튼, 인증 UI를 제공하며, sticky 포지셔닝과 backdrop-blur 효과를 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "transparent"` | `"default"` | 헤더 스타일 변형 |
| `onSearchClick` | `() => void` | - | 검색 버튼 클릭 핸들러 |
| `className` | `string` | - | 추가 CSS 클래스 |
| ...rest | `HTMLAttributes<HTMLElement>` | - | 표준 HTML 속성 |

### Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | 반투명 배경 (bg-background/95), 하단 테두리 | 일반 페이지 |
| `transparent` | 투명 배경, 테두리 없음 | Hero 섹션 위 |

### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Logo (Left)       Navigation (Center)        Search + Auth  │
│  [DECODED]         Home Feed Explore Request  [🔍] [Profile] │
└──────────────────────────────────────────────────────────────┘
```

**Height**: 72px
**Visible**: md breakpoint (768px) 이상
**Position**: `fixed top-0` (z-index: 30)

### Navigation Items

- **Home** (`/`)
- **Feed** (`/feed`)
- **Explore** (`/explore`)
- **Request** (`/request`)

Active 링크는 primary 색상 + font-semibold로 표시됩니다.

### Auth UI States

**Not logged in**:
- "Login" 버튼 표시

**Logged in**:
- Bell 아이콘 (알림)
- Avatar 버튼 (사용자 메뉴)

### Usage Examples

#### 기본 사용

```tsx
import { DesktopHeader } from "@/lib/design-system";

function Layout() {
  return (
    <>
      <DesktopHeader onSearchClick={() => console.log('Search clicked')} />
      <main className="pt-16">  {/* Header height offset */}
        Page content
      </main>
    </>
  );
}
```

#### Transparent Variant (Hero 페이지)

```tsx
import { DesktopHeader } from "@/lib/design-system";

function HeroPage() {
  return (
    <div>
      <DesktopHeader variant="transparent" />
      <section className="h-screen bg-gradient-to-b from-primary to-secondary">
        Hero content
      </section>
    </div>
  );
}
```

#### 검색 통합

```tsx
import { DesktopHeader } from "@/lib/design-system";
import { useSearchStore } from "@/lib/stores";

function AppLayout() {
  const { setOpen } = useSearchStore();

  return (
    <DesktopHeader onSearchClick={() => setOpen(true)} />
  );
}
```

### Layout Integration

DesktopHeader는 fixed 포지셔닝이므로, 메인 콘텐츠에 padding-top을 추가해야 합니다:

```tsx
// app/layout.tsx
<DesktopHeader />
<main className="pt-[72px]">  {/* Header height */}
  {children}
</main>
```

---

## MobileHeader

### 개요

모바일 환경 (md breakpoint 미만)을 위한 컴팩트 헤더입니다.
로고, 검색 버튼, 필터 버튼을 제공하며, sticky 포지셔닝과 backdrop-blur 효과를 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "transparent"` | `"default"` | 헤더 스타일 변형 |
| `onSearchClick` | `() => void` | - | 검색 버튼 클릭 핸들러 |
| `onFilterClick` | `() => void` | - | 필터 버튼 클릭 핸들러 |
| `showFilter` | `boolean` | `true` | 필터 버튼 표시 여부 |
| `className` | `string` | - | 추가 CSS 클래스 |
| ...rest | `HTMLAttributes<HTMLElement>` | - | 표준 HTML 속성 |

### Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | 반투명 배경 (bg-background/80) | 일반 페이지 |
| `transparent` | 투명 배경 | 특수 페이지 (full-screen) |

### Layout Structure

```
┌──────────────────────────────────────────┐
│  Logo (Left)               Search Filter │
│  [DECODED]                 [🔍]  [≡]     │
└──────────────────────────────────────────┘
```

**Height**: 56px
**Visible**: md breakpoint (768px) 미만
**Position**: `fixed top-0` (z-index: 30)

### Usage Examples

#### 기본 사용

```tsx
import { MobileHeader } from "@/lib/design-system";

function Layout() {
  return (
    <>
      <MobileHeader
        onSearchClick={() => console.log('Search')}
        onFilterClick={() => console.log('Filter')}
      />
      <main className="pt-14">  {/* Header height offset */}
        Page content
      </main>
    </>
  );
}
```

#### 필터 숨김 (검색 전용)

```tsx
import { MobileHeader } from "@/lib/design-system";

function SearchPage() {
  return (
    <MobileHeader
      onSearchClick={() => openSearch()}
      showFilter={false}  // 필터 버튼 숨김
    />
  );
}
```

#### Bottom Sheet 통합

```tsx
import { MobileHeader } from "@/lib/design-system";
import { BottomSheet } from "@/lib/components/ui/bottom-sheet";

function FilterablePage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <MobileHeader onFilterClick={() => setFilterOpen(true)} />

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)}>
        <FilterContent />
      </BottomSheet>
    </>
  );
}
```

### Layout Integration

```tsx
// app/layout.tsx
<MobileHeader />
<main className="pt-[56px]">  {/* Header height */}
  {children}
</main>
```

---

## DesktopFooter

### 개요

데스크탑과 모바일 모두에서 사용하는 종합 푸터 컴포넌트입니다.
브랜드 정보, 네비게이션 링크, 소셜 미디어, 뉴스레터 가입 폼을 제공합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | 추가 CSS 클래스 |
| `onNewsletterSubscribe` | `(email: string) => void` | - | 뉴스레터 구독 핸들러 |
| ...rest | `HTMLAttributes<HTMLElement>` | - | 표준 HTML 속성 |

### Layout Structure

**Desktop (md+)**: 4-column grid
```
┌────────────────────────────────────────────────────────────────┐
│  Brand           Company        Support        Connect          │
│  [Logo]          About          Help Center    [Social Icons]  │
│  Slogan          Careers        Contact        Newsletter Form │
│                  Press          FAQ                             │
│                  Blog           Report                          │
└────────────────────────────────────────────────────────────────┘
│  Copyright  |  Legal Links  |  Language Selector               │
└────────────────────────────────────────────────────────────────┘
```

**Mobile (<md)**: Stacked with accordions
```
┌──────────────────────┐
│  Brand               │
│  [Logo] Slogan       │
├──────────────────────┤
│  Company ▼           │  (accordion)
│  Support ▼           │  (accordion)
│  [Social Icons]      │
│  Newsletter Form     │
├──────────────────────┤
│  Copyright           │
│  Legal Links         │
│  Language Selector   │
└──────────────────────┘
```

### Sections

#### Brand Section
- **Logo**: "decoded" (font-mono, primary 색상)
- **Slogan**: "Discover fashion from your favorite celebrities"

#### Company Links
- About
- Careers
- Press
- Blog

#### Support Links
- Help Center
- Contact
- FAQ
- Report Issue

#### Connect Section
- **Social Icons**: Instagram, Twitter, Facebook
- **Newsletter Form**: Email input + Submit button

#### Bottom Bar
- **Copyright**: "© 2026 DECODED. All rights reserved."
- **Legal Links**: Privacy Policy, Terms of Service, Cookie Policy
- **Language Selector**: English, 한국어, 日本語

### Usage Examples

#### 기본 사용

```tsx
import { DesktopFooter } from "@/lib/design-system";

function Layout() {
  return (
    <>
      <main>Page content</main>
      <DesktopFooter />
    </>
  );
}
```

#### 뉴스레터 구독 핸들러

```tsx
import { DesktopFooter } from "@/lib/design-system";

function Layout() {
  const handleNewsletterSubscribe = async (email: string) => {
    try {
      await api.subscribeNewsletter(email);
      toast.success('Subscribed successfully!');
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  return (
    <DesktopFooter onNewsletterSubscribe={handleNewsletterSubscribe} />
  );
}
```

#### 특정 페이지에서 숨김

```tsx
// app/feed/layout.tsx
import { DesktopFooter } from "@/lib/design-system";
import { usePathname } from "next/navigation";

function FeedLayout({ children }) {
  const pathname = usePathname();
  const showFooter = !pathname.startsWith('/feed');

  return (
    <>
      {children}
      {showFooter && <DesktopFooter />}
    </>
  );
}
```

---

## Header/Footer Integration Pattern

### 전체 레이아웃 예시

```tsx
import { DesktopHeader, MobileHeader, DesktopFooter } from "@/lib/design-system";

function RootLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Headers */}
      <DesktopHeader onSearchClick={() => openSearch()} />
      <MobileHeader
        onSearchClick={() => openSearch()}
        onFilterClick={() => openFilters()}
      />

      {/* Main Content */}
      <main className="flex-1 pt-[56px] md:pt-[72px]">
        {children}
      </main>

      {/* Footer */}
      <DesktopFooter onNewsletterSubscribe={handleSubscribe} />
    </div>
  );
}
```

### 조건부 Footer (페이지별)

```tsx
import { DesktopFooter } from "@/lib/design-system";
import { usePathname } from "next/navigation";

// Footer를 숨겨야 하는 페이지
const NO_FOOTER_PAGES = ['/feed', '/explore'];

function ConditionalFooter() {
  const pathname = usePathname();
  const showFooter = !NO_FOOTER_PAGES.includes(pathname);

  return showFooter ? <DesktopFooter /> : null;
}
```

---

## Responsive Header Pattern

### Desktop/Mobile Header 자동 전환

```tsx
import { DesktopHeader, MobileHeader } from "@/lib/design-system";

// 두 헤더를 함께 렌더링 (브레이크포인트에 따라 자동 표시/숨김)
function AppLayout() {
  return (
    <>
      {/* Desktop: md 이상에서 표시 */}
      <DesktopHeader onSearchClick={openSearch} />

      {/* Mobile: md 미만에서 표시 */}
      <MobileHeader
        onSearchClick={openSearch}
        onFilterClick={openFilters}
      />

      {/* 적절한 padding 적용 */}
      <main className="pt-[56px] md:pt-[72px]">
        {children}
      </main>
    </>
  );
}
```

---

## Accessibility

### Header

- **Semantic HTML**: `<header>` 태그 사용
- **Navigation**: `<nav>` 태그와 `aria-label="Main navigation"`
- **Link Labels**: 모든 아이콘 버튼에 `aria-label` 제공
- **Active State**: 현재 페이지 링크에 `aria-current="page"` 자동 적용 (가능)

### Footer

- **Semantic HTML**: `<footer>` 태그와 `role="contentinfo"`
- **Link Labels**: 소셜 아이콘에 `aria-label` 제공
- **Accordion**: `aria-expanded` 상태 표시 (모바일)
- **Form**: Newsletter 폼에 `required` 및 적절한 label 제공

---

## Design Tokens 참조

Header/Footer 컴포넌트는 다음 토큰을 사용합니다:

- `colors.background`: 헤더/푸터 배경
- `colors.foreground`: 텍스트 색상
- `colors.primary`: 로고, 활성 링크
- `colors.mutedForeground`: 비활성 링크, 아이콘
- `colors.border`: Footer bottom bar 테두리
- `zIndex.header` (30): Header z-index
- `borderRadius.md`: 버튼 모서리

자세한 내용: [tokens.md](../tokens.md)

---

## Related Documentation

- [Design Tokens](../tokens.md) - Color, Z-Index 토큰
- [Typography Components](./typography.md) - Text 컴포넌트 (Footer에서 사용)
- [Input Components](./inputs.md) - Input 컴포넌트 (Newsletter에서 사용)
- [Design Patterns](../patterns.md) - 레이아웃 패턴
- [decoded.pen](../decoded.pen) - 시각적 레퍼런스

---

> **Note**: DesktopHeader와 MobileHeader는 브레이크포인트에 따라 자동으로 표시/숨김됩니다.
> 두 컴포넌트를 함께 렌더링하면 반응형 헤더가 구현됩니다.
>
> DesktopFooter는 "Desktop"이라는 이름이지만 모바일에서도 사용 가능하며, 반응형 레이아웃을 자동으로 적용합니다.
