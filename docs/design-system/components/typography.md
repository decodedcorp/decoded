# Typography Components

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

Typography 컴포넌트는 일관된 텍스트 스타일링을 위한 Heading과 Text 컴포넌트를 제공합니다.
모든 컴포넌트는 CVA (class-variance-authority)를 사용한 variant 시스템과 반응형 디자인을 지원합니다.

**파일 위치**: `packages/web/lib/design-system/typography.tsx`

**시각적 참고**: [decoded.pen](../decoded.pen)

---

## Import

```tsx
// 컴포넌트 import
import { Heading, Text } from "@/lib/design-system";

// Variants import (커스텀 스타일링)
import { headingVariants, textVariants } from "@/lib/design-system";

// TypeScript types
import type { HeadingProps, TextProps } from "@/lib/design-system";
```

---

## Heading

### 개요

제목과 디스플레이 텍스트를 위한 컴포넌트입니다.
Playfair Display (font-serif)를 사용하며, 반응형 사이즈와 자동 semantic HTML 매핑을 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"hero" \| "h1" \| "h2" \| "h3" \| "h4"` | `"h2"` | 제목 스타일 변형 |
| `as` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "p" \| "span"` | auto | HTML 태그 override |
| `className` | `string` | - | 추가 CSS 클래스 |
| `children` | `ReactNode` | - | 제목 텍스트 |
| ...rest | `HTMLAttributes<HTMLHeadingElement>` | - | 표준 HTML 속성 |

### Variants

| Variant | Desktop Size | Mobile Size | fontWeight | lineHeight | Usage |
|---------|-------------|-------------|------------|------------|-------|
| `hero` | 128px (8xl) | 48px (5xl) | 700 (bold) | 1.1 | Hero 섹션 대제목 |
| `h1` | 96px (6xl) | 36px (4xl) | 600 (semibold) | 1.15 | 페이지 제목 |
| `h2` | 80px (5xl) | 30px (3xl) | 600 (semibold) | 1.2 | 섹션 제목 |
| `h3` | 48px (3xl) | 24px (2xl) | 600 (semibold) | 1.25 | 서브섹션 제목 |
| `h4` | 32px (2xl) | 20px (xl) | 600 (semibold) | 1.3 | 카드 제목 |

**자동 Semantic HTML 매핑**:
- `hero` → `<h1>`
- `h1` → `<h1>`
- `h2` → `<h2>`
- `h3` → `<h3>`
- `h4` → `<h4>`

`as` prop으로 override 가능:

```tsx
<Heading variant="h2" as="h1">  {/* h2 스타일, h1 태그 */}
  Semantic H1
</Heading>
```

### Usage Examples

#### 기본 사용

```tsx
import { Heading } from "@/lib/design-system";

function PageHeader() {
  return (
    <>
      {/* Hero 제목 */}
      <Heading variant="hero">
        Discover Your Style
      </Heading>

      {/* 페이지 제목 */}
      <Heading variant="h1">
        All Products
      </Heading>

      {/* 섹션 제목 */}
      <Heading variant="h2">
        Trending Now
      </Heading>

      {/* 서브섹션 제목 */}
      <Heading variant="h3">
        New Arrivals
      </Heading>

      {/* 카드 제목 */}
      <Heading variant="h4">
        Product Name
      </Heading>
    </>
  );
}
```

#### Semantic HTML Override

```tsx
// SEO를 위해 h1 태그를 사용하되 h2 스타일 적용
<Heading variant="h2" as="h1">
  Main Page Title
</Heading>

// span 태그로 렌더링 (헤딩 스타일만 빌려오기)
<Heading variant="h3" as="span">
  Styled Span
</Heading>
```

#### ClassName 추가

```tsx
// 추가 스타일링
<Heading variant="h2" className="text-primary mb-4">
  Colored Title
</Heading>

// 커스텀 반응형
<Heading variant="h3" className="lg:text-6xl">
  Extra Large on Desktop
</Heading>
```

#### 다른 컴포넌트와 조합

```tsx
import { Heading, Text, Card, CardHeader, CardContent } from "@/lib/design-system";

function ArticleCard() {
  return (
    <Card>
      <CardHeader>
        <Heading variant="h4">Article Title</Heading>
        <Text variant="small" textColor="muted">By Author Name</Text>
      </CardHeader>
      <CardContent>
        <Text>Article excerpt...</Text>
      </CardContent>
    </Card>
  );
}
```

### CVA Variants

직접 variant 클래스를 사용하려면:

```tsx
import { headingVariants } from "@/lib/design-system";

const titleClasses = headingVariants({ variant: "h2" });
// Returns: "font-serif tracking-tight text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.2]"
```

---

## Text

### 개요

본문 텍스트와 UI 라벨을 위한 컴포넌트입니다.
Inter (font-sans)를 사용하며, 다양한 텍스트 색상과 크기를 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"body" \| "small" \| "caption" \| "label" \| "overline"` | `"body"` | 텍스트 스타일 변형 |
| `textColor` | `"default" \| "muted" \| "primary" \| "destructive"` | `"default"` | 텍스트 색상 |
| `as` | `"p" \| "span" \| "div" \| "label"` | `"p"` | HTML 태그 |
| `className` | `string` | - | 추가 CSS 클래스 |
| `children` | `ReactNode` | - | 텍스트 내용 |
| ...rest | `HTMLAttributes<HTMLElement>` | - | 표준 HTML 속성 |

### Variants

| Variant | Desktop Size | Mobile Size | lineHeight | Usage |
|---------|-------------|-------------|------------|-------|
| `body` | 16px (base) | 14px (sm) | 1.625 (relaxed) | 본문 텍스트 (기본) |
| `small` | 14px (sm) | 14px (sm) | 1.5 (normal) | 보조 텍스트, 설명 |
| `caption` | 12px (xs) | 12px (xs) | 1.375 (snug) | 캡션, 메타 정보 |
| `label` | 14px (sm) | 14px (sm) | 1.5 (normal) + `font-medium` | 폼 라벨 |
| `overline` | 12px (xs) | 12px (xs) | 1.5 + `uppercase` + `tracking-widest` | 섹션 라벨 |

### Text Colors

| Color | CSS Class | Usage |
|-------|-----------|-------|
| `default` | `text-foreground` | 기본 텍스트 (검정/흰색) |
| `muted` | `text-muted-foreground` | 보조 텍스트, 비활성 텍스트 |
| `primary` | `text-primary` | 링크, 강조 텍스트 |
| `destructive` | `text-destructive` | 에러 메시지, 경고 |

### Usage Examples

#### 기본 사용

```tsx
import { Text } from "@/lib/design-system";

function ContentArea() {
  return (
    <>
      {/* 본문 텍스트 */}
      <Text>
        This is the main body text with responsive sizing.
      </Text>

      {/* 보조 텍스트 */}
      <Text variant="small" textColor="muted">
        Additional information or description
      </Text>

      {/* 캡션 */}
      <Text variant="caption" textColor="muted">
        Posted 2 hours ago
      </Text>

      {/* 폼 라벨 */}
      <Text variant="label" as="label">
        Email Address
      </Text>

      {/* 섹션 라벨 */}
      <Text variant="overline">
        Featured Products
      </Text>
    </>
  );
}
```

#### Text Color Variants

```tsx
// 기본 텍스트
<Text textColor="default">
  Normal text
</Text>

// 보조 텍스트
<Text textColor="muted">
  Muted text for less emphasis
</Text>

// Primary 색상 (링크)
<Text textColor="primary">
  <a href="/link">Click here</a>
</Text>

// 에러 메시지
<Text variant="small" textColor="destructive">
  This field is required
</Text>
```

#### HTML 태그 변경

```tsx
// Paragraph (기본)
<Text>Paragraph text</Text>

// Span (inline)
<Text as="span">Inline text</Text>

// Label (폼)
<Text variant="label" as="label" htmlFor="email">
  Email
</Text>

// Div (block)
<Text as="div">Block text</Text>
```

#### 다양한 조합

```tsx
import { Heading, Text, Card, CardHeader, CardContent } from "@/lib/design-system";

function ProfileCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <Heading variant="h3">{user.name}</Heading>
        <Text variant="small" textColor="muted">
          @{user.username}
        </Text>
      </CardHeader>
      <CardContent>
        <Text>{user.bio}</Text>
        <Text variant="caption" textColor="muted">
          Joined {user.joinedDate}
        </Text>
      </CardContent>
    </Card>
  );
}
```

#### 긴 텍스트 처리

```tsx
// Line clamp (Tailwind utility)
<Text className="line-clamp-2">
  Very long text that will be truncated after 2 lines...
</Text>

// Single line ellipsis
<Text className="truncate">
  Single line text that will be truncated...
</Text>
```

### CVA Variants

직접 variant 클래스를 사용하려면:

```tsx
import { textVariants } from "@/lib/design-system";

const bodyClasses = textVariants({ variant: "body", textColor: "muted" });
// Returns: "font-sans text-sm md:text-base leading-relaxed text-muted-foreground"
```

---

## Typography Patterns

### Page Header 패턴

```tsx
import { Heading, Text } from "@/lib/design-system";

function PageHeader() {
  return (
    <header className="space-y-2">
      <Text variant="overline">Category</Text>
      <Heading variant="h1">Page Title</Heading>
      <Text variant="small" textColor="muted">
        Page description or subtitle
      </Text>
    </header>
  );
}
```

### Article Header 패턴

```tsx
function ArticleHeader({ title, author, date }) {
  return (
    <header className="space-y-4">
      <Heading variant="h1">{title}</Heading>
      <div className="flex items-center gap-2">
        <Text variant="small">By {author}</Text>
        <Text variant="caption" textColor="muted">•</Text>
        <Text variant="caption" textColor="muted">{date}</Text>
      </div>
    </header>
  );
}
```

### Form Label 패턴

```tsx
import { Text, Input } from "@/lib/design-system";

function FormField({ label, error }) {
  return (
    <div>
      <Text variant="label" as="label" htmlFor="field">
        {label}
      </Text>
      <Input id="field" error={error} />
      {error && (
        <Text variant="small" textColor="destructive">
          {error}
        </Text>
      )}
    </div>
  );
}
```

### Card Title 패턴

```tsx
import { Heading, Text, Card, CardHeader } from "@/lib/design-system";

function TitleCard() {
  return (
    <Card>
      <CardHeader>
        <Heading variant="h4">Card Title</Heading>
        <Text variant="small" textColor="muted">Subtitle</Text>
      </CardHeader>
    </Card>
  );
}
```

---

## Accessibility

### Semantic HTML

항상 올바른 HTML 태그를 사용하세요:

```tsx
// ✅ 좋은 예 - 페이지당 하나의 h1
<Heading variant="h1">Main Page Title</Heading>

// ✅ 좋은 예 - 헤딩 계층 유지
<Heading variant="h2">Section</Heading>
<Heading variant="h3">Subsection</Heading>

// ❌ 나쁜 예 - 계층 건너뛰기
<Heading variant="h2">Section</Heading>
<Heading variant="h4">Subsection</Heading>  {/* h3 건너뜀 */}
```

### 텍스트 대비 (Contrast)

- `textColor="default"`: 최소 4.5:1 대비
- `textColor="muted"`: 최소 3:1 대비 (보조 정보)
- `textColor="primary"`: 인터랙션 가능한 요소 (링크)
- `textColor="destructive"`: 명확한 에러 표시

### 최소 크기

- 본문 텍스트: 최소 14px (모바일), 16px (데스크탑)
- 작은 텍스트: 최소 12px (캡션)
- 터치 타겟: 최소 44px 높이 (버튼, 링크)

---

## Design Tokens 참조

Typography 컴포넌트는 다음 토큰을 사용합니다:

- `typography.fonts.serif`: Playfair Display (Heading)
- `typography.fonts.sans`: Inter (Text)
- `typography.sizes`: 폰트 크기 정의
- `responsiveTypography`: 반응형 크기 매핑
- `colors.foreground`, `colors.mutedForeground`, `colors.primary`, `colors.destructive`

자세한 내용: [tokens.md](../tokens.md)

---

## Related Documentation

- [Design Tokens](../tokens.md) - Typography 토큰 상세
- [Design Patterns](../patterns.md) - Typography 사용 패턴
- [decoded.pen](../decoded.pen) - 시각적 레퍼런스

---

> **Note**: Heading과 Text 컴포넌트는 디자인 일관성을 위해 가능한 한 항상 사용하세요.
> 직접 HTML 태그를 사용하는 대신 이 컴포넌트를 사용하면 디자인 시스템 업데이트가 자동으로 반영됩니다.
