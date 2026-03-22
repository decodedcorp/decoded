# Design Patterns

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

이 문서는 Decoded Design System을 일관되게 적용하기 위한 디자인 패턴 가이드입니다.
레이아웃, 애니메이션, 상태 관리, 컴포지션, 테마 패턴을 다룹니다.

**관련 문서**:
- [Design Tokens](./tokens.md)
- [Components Index](./components/README.md)
- [decoded.pen](./decoded.pen)

---

## 1. 레이아웃 패턴

### 1.1 반응형 그리드

#### 2-4 컬럼 그리드 (Product Grid)

```tsx
// 모바일: 2열, 태블릿: 3열, 데스크탑: 4열
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => (
    <ProductCard key={item.id} {...item} />
  ))}
</div>
```

#### 1-3 컬럼 그리드 (Feed Grid)

```tsx
// 모바일: 1열, 태블릿: 2열, 데스크탑: 3열
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {posts.map(post => (
    <FeedCardBase key={post.id} {...post} />
  ))}
</div>
```

#### Masonry Grid (탐색 그리드)

```tsx
// CSS Grid masonry (실험적)
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
  {images.map(image => (
    <GridCard
      key={image.id}
      imageUrl={image.url}
      aspectRatio="4/5"
      alt={image.alt}
    />
  ))}
</div>
```

### 1.2 섹션 래퍼 패턴

#### 기본 섹션 래퍼

```tsx
<section className="py-10 md:py-16">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
    <Heading variant="h2" className="mb-6">Section Title</Heading>
    {/* Content */}
  </div>
</section>
```

**패턴 설명**:
- `py-10 md:py-16`: 섹션 상하 패딩 (모바일 40px, 데스크탑 64px)
- `max-w-7xl mx-auto`: 최대 너비 제한 + 중앙 정렬
- `px-4 md:px-6 lg:px-8`: 좌우 패딩 (반응형)

#### Hero 섹션 패턴

```tsx
<section className="py-24 md:py-32 bg-gradient-to-b from-primary to-secondary">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
    <Heading variant="hero" className="mb-6 text-primary-foreground">
      Discover Your Style
    </Heading>
    <Text className="max-w-2xl mx-auto text-primary-foreground">
      Find fashion inspiration from your favorite celebrities
    </Text>
  </div>
</section>
```

### 1.3 교대 배경 패턴

```tsx
<>
  {/* Section 1: Background */}
  <section className="py-16 bg-background">
    <div className="container mx-auto px-6">
      <Heading variant="h2">Section 1</Heading>
    </div>
  </section>

  {/* Section 2: Card Background (alternating) */}
  <section className="py-16 bg-card">
    <div className="container mx-auto px-6">
      <Heading variant="h2">Section 2</Heading>
    </div>
  </section>

  {/* Section 3: Background */}
  <section className="py-16 bg-background">
    <div className="container mx-auto px-6">
      <Heading variant="h2">Section 3</Heading>
    </div>
  </section>
</>
```

### 1.4 Header Padding 패턴

```tsx
// Desktop Header (72px)
<DesktopHeader />
<main className="pt-[72px]">
  {/* Content starts below header */}
</main>

// Mobile Header (56px)
<MobileHeader />
<main className="pt-[56px]">
  {/* Content starts below header */}
</main>

// 반응형 (Desktop + Mobile)
<DesktopHeader />
<MobileHeader />
<main className="pt-[56px] md:pt-[72px]">
  {/* Responsive padding */}
</main>
```

---

## 2. 애니메이션 패턴

### 2.1 AnimatePresence (탭/필터 전환)

```tsx
import { AnimatePresence, motion } from "motion/react";

function TabPanel({ activeTab, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**패턴 설명**:
- `mode="wait"`: 이전 요소가 exit 완료 후 새 요소 enter
- `key={activeTab}`: 탭 변경 시 애니메이션 트리거
- Fade + Slide 조합 (opacity + y)

### 2.2 Motion layoutId (탭 underline)

```tsx
import { motion } from "motion/react";

function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-4 border-b border-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative px-4 py-2"
        >
          {tab.label}

          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

**패턴 설명**:
- `layoutId="activeTab"`: 동일한 layoutId를 가진 요소 간 자동 애니메이션
- Spring 애니메이션 (자연스러운 움직임)

### 2.3 GSAP Flip (카드 레이아웃 전환)

```tsx
import { Flip } from "gsap/Flip";
import { useEffect } from "react";

function GridLayout({ layout }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const state = Flip.getState(".card");

      // Layout change happens here (React re-render)

      Flip.from(state, {
        duration: 0.5,
        ease: "power2.inOut",
        absolute: true,
      });
    }
  }, [layout]);

  return (
    <div ref={containerRef} className={layout === 'grid' ? 'grid grid-cols-4' : 'flex flex-col'}>
      {items.map(item => (
        <div key={item.id} className="card">
          <Card {...item} />
        </div>
      ))}
    </div>
  );
}
```

**패턴 설명**:
- GSAP Flip: 레이아웃 변경 시 부드러운 위치/크기 전환
- `absolute: true`: 절대 위치 기반 애니메이션

### 2.4 Lenis Smooth Scroll

```tsx
// app/layout.tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
```

**패턴 설명**:
- Lenis: 부드러운 스크롤 효과 (inertia scrolling)
- Root layout에서 한 번만 초기화

### 2.5 Direction-aware Transitions

```tsx
// Request flow: forward (right-to-left), backward (left-to-right)
import { AnimatePresence, motion } from "motion/react";

function RequestFlow({ step, direction }) {
  const variants = {
    enter: (direction) => ({
      x: direction === 'forward' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction === 'forward' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <StepContent step={step} />
      </motion.div>
    </AnimatePresence>
  );
}
```

**패턴 설명**:
- 방향에 따라 다른 enter/exit 애니메이션
- `custom` prop으로 direction 전달

---

## 3. 상태 관리 패턴

### 3.1 Loading State

#### Spinner 패턴

```tsx
import { Loader2 } from "lucide-react";

function LoadingButton({ isLoading, children, ...props }) {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

#### Skeleton 패턴

```tsx
import { ProductCardSkeleton } from "@/lib/design-system";

function ProductGrid({ products, isLoading }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {isLoading
        ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map(product => <ProductCard key={product.id} {...product} />)
      }
    </div>
  );
}
```

### 3.2 Error State

#### Input Error 패턴

```tsx
import { Input, Text } from "@/lib/design-system";

function FormField({ error, ...inputProps }) {
  return (
    <div>
      <Input error={error} {...inputProps} />
      {/* Input 컴포넌트가 자동으로 error variant 적용 */}
    </div>
  );
}
```

#### Page Error 패턴

```tsx
import { Heading, Text, Card } from "@/lib/design-system";
import { AlertCircle } from "lucide-react";

function ErrorState({ title, message, action }) {
  return (
    <Card className="max-w-md mx-auto mt-16 text-center p-8">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <Heading variant="h3" className="mb-2">{title}</Heading>
      <Text textColor="muted">{message}</Text>

      {action && (
        <button className="btn-primary mt-6" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </Card>
  );
}
```

### 3.3 Empty State

```tsx
import { Heading, Text } from "@/lib/design-system";
import { Package } from "lucide-react";

function EmptyState({ icon: Icon = Package, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>

      <Heading variant="h3" className="mb-2">{title}</Heading>
      <Text textColor="muted" className="max-w-md">{message}</Text>

      {action && (
        <button className="btn-primary mt-6" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### 3.4 Skeleton Pattern

```tsx
import { CardSkeleton } from "@/lib/design-system";

// 이미지 로딩 중
<CardSkeleton aspectRatio="4/5" showHeader={false} showFooter={false} />

// 전체 카드 로딩 중
<CardSkeleton showHeader showContent showFooter />

// 그리드 로딩
<div className="grid grid-cols-4 gap-4">
  {[...Array(8)].map((_, i) => (
    <ProductCardSkeleton key={i} aspectRatio="4/5" />
  ))}
</div>
```

---

## 4. 컴포지션 패턴

### 4.1 Card Slot Composition

```tsx
import { Card, CardHeader, CardContent, CardFooter, Heading, Text } from "@/lib/design-system";

function ArticleCard({ article }) {
  return (
    <Card variant="elevated" size="lg">
      <CardHeader>
        <Heading variant="h4">{article.title}</Heading>
        <Text variant="small" textColor="muted">
          {article.author} · {article.date}
        </Text>
      </CardHeader>

      <CardContent>
        <Text>{article.excerpt}</Text>
      </CardContent>

      <CardFooter>
        <button className="btn-primary">Read More</button>
        <button className="btn-ghost">Share</button>
      </CardFooter>
    </Card>
  );
}
```

**패턴 설명**:
- 각 슬롯은 독립적으로 사용 가능 (optional)
- CardHeader, CardContent, CardFooter가 자동으로 spacing 적용

### 4.2 asChild Prop (Radix Pattern)

```tsx
import { Card } from "@/lib/design-system";
import { Slot } from "@radix-ui/react-slot";

// Card 컴포넌트에 asChild 패턴 적용 예시
<Card asChild>
  <Link href="/items/123">
    <CardContent>Clickable card as Link</CardContent>
  </Link>
</Card>
```

**패턴 설명**:
- `asChild`: 자식 요소에 props 병합 (Radix UI 패턴)
- Card 스타일 유지하면서 Link로 렌더링

### 4.3 Interactive Cards

#### Link Wrapper

```tsx
import { Card, CardContent } from "@/lib/design-system";
import Link from "next/link";

<Link href="/items/123">
  <Card interactive>
    <CardContent>Card content</CardContent>
  </Card>
</Link>
```

#### onClick Handler

```tsx
<Card interactive onClick={() => handleClick()}>
  <CardContent>Card content</CardContent>
</Card>
```

**패턴 설명**:
- `interactive` prop: `cursor-pointer` + `hover:shadow-lg` 자동 적용
- Link 또는 onClick 중 하나만 사용

### 4.4 Wrapper Strategy

```tsx
// ProductCard 내부 구현 패턴
const content = <Card>...</Card>;

if (link && !onClick) {
  return <Link href={link}>{content}</Link>;
}

if (onClick) {
  return <div onClick={onClick}>{content}</div>;
}

return content;
```

**패턴 설명**:
- link prop 있으면 Link로 래핑
- onClick prop 있으면 div로 래핑
- 둘 다 없으면 bare Card 반환

---

## 5. 테마 패턴

### 5.1 CSS Variables for Light/Dark Mode

```css
/* globals.css */
:root {
  --primary: oklch(0.21 0.006 285.75);  /* Light mode */
  --primary-foreground: oklch(0.98 0 0);
}

.dark {
  --primary: oklch(0.98 0 0);           /* Dark mode */
  --primary-foreground: oklch(0.21 0.006 285.75);
}
```

**사용**:

```tsx
// Tailwind 클래스 사용 (권장)
<div className="bg-primary text-primary-foreground">
  Primary color (자동 테마 전환)
</div>

// 토큰 사용
import { colors } from "@/lib/design-system";
<div style={{ backgroundColor: colors.primary }}>
  Primary color
</div>
```

### 5.2 next-themes ThemeProvider

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**테마 전환 버튼**:

```tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-accent"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

### 5.3 색상 사용 가이드

| 색상 | 용도 | 예시 |
|------|------|------|
| `primary` | 주요 액션 (CTA 버튼, 링크) | "Buy Now", "Sign Up" 버튼 |
| `secondary` | 보조 액션, 비활성 상태 | "Cancel", "Skip" 버튼 |
| `destructive` | 삭제, 위험한 액션 | "Delete", "Remove" 버튼 |
| `muted` | 보조 텍스트, 비활성 상태 | 캡션, timestamp |
| `accent` | 강조 요소 (hover, focus) | 버튼 hover 배경 |

**올바른 사용**:

```tsx
// ✅ 좋은 예
<button className="bg-primary text-primary-foreground">Sign Up</button>
<button className="bg-secondary text-secondary-foreground">Cancel</button>
<button className="bg-destructive text-destructive-foreground">Delete</button>

// ❌ 나쁜 예
<button className="bg-primary text-primary-foreground">Delete</button>  // 삭제는 destructive 사용
<span className="text-primary">Muted text</span>  // 보조 텍스트는 muted 사용
```

---

## 6. 코드 예시 (종합)

### 예시 1: Product List Page

```tsx
import {
  DesktopHeader,
  MobileHeader,
  ProductCard,
  ProductCardSkeleton,
  Heading,
  Text,
  DesktopFooter,
} from "@/lib/design-system";

function ProductListPage() {
  const { data: products, isLoading } = useProducts();

  return (
    <>
      {/* Headers */}
      <DesktopHeader onSearchClick={() => openSearch()} />
      <MobileHeader onSearchClick={() => openSearch()} />

      {/* Main Content */}
      <main className="pt-[56px] md:pt-[72px]">
        {/* Section Wrapper */}
        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <div className="mb-8">
              <Heading variant="h2">All Products</Heading>
              <Text variant="small" textColor="muted">
                Discover the latest fashion trends
              </Text>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? [...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)
                : products.map(product => (
                    <ProductCard key={product.id} {...product} />
                  ))
              }
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <DesktopFooter />
    </>
  );
}
```

### 예시 2: Feed Page with Tabs

```tsx
import { AnimatePresence, motion } from "motion/react";
import { FeedCardBase, Heading } from "@/lib/design-system";

function FeedPage() {
  const [activeTab, setActiveTab] = useState('trending');
  const { data: posts } = usePosts(activeTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-8">
        {['trending', 'following', 'recent'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-4 py-2"
          >
            {tab}

            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <FeedCardBase key={post.id} {...post} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

---

## 올바른 사용 vs 잘못된 사용

### Layout

```tsx
// ✅ 올바른 예 - 일관된 섹션 래퍼
<section className="py-10 md:py-16">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
    <Heading variant="h2">Section</Heading>
  </div>
</section>

// ❌ 잘못된 예 - 임의의 패딩/너비
<section style={{ padding: '45px 23px' }}>
  <div style={{ maxWidth: '1234px', margin: 'auto' }}>
    <h2>Section</h2>
  </div>
</section>
```

### Interactive Cards

```tsx
// ✅ 올바른 예 - interactive prop 사용
<Card interactive onClick={handleClick}>
  <CardContent>Clickable</CardContent>
</Card>

// ❌ 잘못된 예 - 수동 클래스 추가
<Card className="cursor-pointer hover:shadow-lg" onClick={handleClick}>
  <CardContent>Clickable</CardContent>
</Card>
```

### Colors

```tsx
// ✅ 올바른 예 - Semantic colors
<button className="bg-primary text-primary-foreground">Primary</button>
<button className="bg-destructive text-destructive-foreground">Delete</button>

// ❌ 잘못된 예 - 하드코딩된 색상
<button style={{ background: '#3b82f6', color: 'white' }}>Primary</button>
<button className="bg-red-500 text-white">Delete</button>
```

---

## Related Documentation

- [Design Tokens](./tokens.md) - 토큰 레퍼런스
- [Components Index](./components/README.md) - 전체 컴포넌트 목록
- [Typography Components](./components/typography.md) - Heading, Text
- [Card Components](./components/cards.md) - Card 패밀리
- [decoded.pen](./decoded.pen) - 시각적 레퍼런스

---

> **Note**: 이 패턴 가이드는 디자인 일관성을 위한 권장사항입니다.
> 특수한 경우에는 패턴을 벗어날 수 있지만, 가능한 한 이 패턴을 따르는 것이 좋습니다.
