# Card Components

> Version: 2.0.0
> Last Updated: 2026-02-05

---

## Overview

Card 컴포넌트 패밀리는 다양한 레이아웃과 콘텐츠를 위한 카드 기반 UI를 제공합니다.
기본 Card 컴포넌트와 slot composition 패턴, 그리고 특화된 ProductCard, GridCard, FeedCard, ProfileHeaderCard를 포함합니다.

**파일 위치**:
- `packages/web/lib/design-system/card.tsx` (기본 Card)
- `packages/web/lib/design-system/product-card.tsx`
- `packages/web/lib/design-system/grid-card.tsx`
- `packages/web/lib/design-system/feed-card.tsx`
- `packages/web/lib/design-system/profile-header-card.tsx`

**시각적 참고**: [decoded.pen](../decoded.pen)

---

## Import

```tsx
// Card 기본
import {
  Card, CardHeader, CardContent, CardFooter, CardSkeleton
} from "@/lib/design-system";

// 특화 카드
import {
  ProductCard, GridCard, FeedCardBase, ProfileHeaderCard
} from "@/lib/design-system";

// Variants import
import { cardVariants } from "@/lib/design-system";

// TypeScript types
import type {
  CardProps, ProductCardProps, GridCardProps, FeedCardBaseProps, ProfileHeaderCardProps
} from "@/lib/design-system";
```

---

## Card (Base Component)

### 개요

기본 카드 컨테이너입니다.
Slot composition 패턴 (CardHeader, CardContent, CardFooter)과 variant 시스템을 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "elevated" \| "outline" \| "ghost"` | `"default"` | 카드 스타일 변형 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 패딩 크기 |
| `interactive` | `boolean` | `false` | Interactive 상태 (cursor-pointer, hover:shadow-lg) |
| `className` | `string` | - | 추가 CSS 클래스 |
| `children` | `ReactNode` | - | 카드 내용 |
| ...rest | `HTMLAttributes<HTMLDivElement>` | - | 표준 div 속성 |

### Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | 배경, 테두리, 작은 그림자 (shadow-sm) | 기본 카드 |
| `elevated` | 배경, 테두리, 중간 그림자 (shadow-md) | 강조 카드 |
| `outline` | 배경, 두꺼운 테두리 (border-2) | 아웃라인 카드 |
| `ghost` | 투명 배경, 테두리 없음 | 배경 없는 카드 |

### Sizes

| Size | Padding | Usage |
|------|---------|-------|
| `sm` | 12px (p-3) | 작은 카드 (ProductCard, GridCard) |
| `md` | 16px (p-4) | 기본 카드 |
| `lg` | 24px (p-6) | 큰 카드 (프로필, 설정) |

### Usage Examples

#### 기본 카드

```tsx
import { Card } from "@/lib/design-system";

function BasicCard() {
  return (
    <Card>
      <p>Basic card content</p>
    </Card>
  );
}
```

#### Variant와 Size 조합

```tsx
import { Card } from "@/lib/design-system";

function CardVariants() {
  return (
    <>
      <Card variant="default" size="md">Default</Card>
      <Card variant="elevated" size="lg">Elevated</Card>
      <Card variant="outline" size="sm">Outline</Card>
      <Card variant="ghost">Ghost</Card>
    </>
  );
}
```

#### Interactive 카드

```tsx
import { Card } from "@/lib/design-system";

function InteractiveCard() {
  return (
    <Card interactive onClick={() => console.log('clicked')}>
      {/* cursor-pointer + hover:shadow-lg 자동 적용 */}
      Click me
    </Card>
  );
}
```

---

## Card Slot Components

### CardHeader

헤더 섹션 (제목, 부제목, 메타 정보)

**Props**: `HTMLAttributes<HTMLDivElement>`

**Usage**:
```tsx
import { Card, CardHeader, Heading, Text } from "@/lib/design-system";

<Card>
  <CardHeader>
    <Heading variant="h4">Card Title</Heading>
    <Text variant="small" textColor="muted">Subtitle</Text>
  </CardHeader>
</Card>
```

### CardContent

메인 콘텐츠 섹션

**Props**: `HTMLAttributes<HTMLDivElement>`

**Usage**:
```tsx
import { Card, CardContent, Text } from "@/lib/design-system";

<Card>
  <CardContent>
    <Text>Main content goes here</Text>
  </CardContent>
</Card>
```

### CardFooter

푸터 섹션 (액션 버튼, 메타 정보)

**Props**: `HTMLAttributes<HTMLDivElement>`

**Usage**:
```tsx
import { Card, CardFooter } from "@/lib/design-system";

<Card>
  <CardFooter>
    <button className="btn-primary">Action</button>
    <button className="btn-secondary">Cancel</button>
  </CardFooter>
</Card>
```

### 전체 조합 예시

```tsx
import { Card, CardHeader, CardContent, CardFooter, Heading, Text } from "@/lib/design-system";

function CompleteCard() {
  return (
    <Card variant="elevated" size="lg">
      <CardHeader>
        <Heading variant="h3">Article Title</Heading>
        <Text variant="small" textColor="muted">
          By Author Name · 2 days ago
        </Text>
      </CardHeader>

      <CardContent>
        <Text>
          This is the main article content with multiple paragraphs...
        </Text>
      </CardContent>

      <CardFooter>
        <button className="btn-primary">Read More</button>
        <button className="btn-ghost">Share</button>
      </CardFooter>
    </Card>
  );
}
```

---

## CardSkeleton

### 개요

Card 로딩 상태를 위한 스켈레톤 컴포넌트입니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | CardProps['variant'] | `"default"` | 카드 variant (Card와 동일) |
| `size` | CardProps['size'] | `"md"` | 카드 size (Card와 동일) |
| `showHeader` | `boolean` | `true` | 헤더 스켈레톤 표시 |
| `showContent` | `boolean` | `true` | 콘텐츠 스켈레톤 표시 |
| `showFooter` | `boolean` | `true` | 푸터 스켈레톤 표시 |
| `aspectRatio` | `"4/5" \| "1/1" \| "16/9"` | - | 이미지 플레이스홀더 비율 |
| `className` | `string` | - | 추가 CSS 클래스 |

### Usage

```tsx
import { CardSkeleton } from "@/lib/design-system";

// 기본 스켈레톤
<CardSkeleton />

// 이미지가 있는 스켈레톤
<CardSkeleton aspectRatio="4/5" />

// 커스터마이징
<CardSkeleton
  variant="elevated"
  size="lg"
  showFooter={false}
  aspectRatio="16/9"
/>
```

---

## ProductCard

### 개요

제품 정보를 표시하는 카드입니다.
이미지, 브랜드, 제품명, 가격, 뱃지를 지원하며, ProductCard 레이아웃에 최적화되어 있습니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | - | 제품 이미지 URL |
| `brand` | `string` | required | 브랜드 이름 |
| `name` | `string` | required | 제품명 |
| `price` | `string \| number` | - | 가격 (₩ 자동 추가) |
| `originalPrice` | `string \| number` | - | 원가 (취소선 표시) |
| `badge` | `"TOP" \| "NEW" \| "BEST" \| "SALE"` | - | 뱃지 (왼쪽 상단) |
| `link` | `string` | required | 제품 링크 |
| `aspectRatio` | `"1/1" \| "3/4" \| "4/5"` | `"1/1"` | 이미지 비율 |
| `onClick` | `() => void` | - | 클릭 핸들러 (link 대신 사용 가능) |
| `className` | `string` | - | 추가 CSS 클래스 |

### Badge Colors

| Badge | Color | Usage |
|-------|-------|-------|
| `TOP` | Primary (blue) | 인기 상품 |
| `NEW` | Blue-500 | 신상품 |
| `BEST` | Amber-500 | 베스트셀러 |
| `SALE` | Destructive (red) | 할인 상품 |

### Usage Examples

#### 기본 제품 카드

```tsx
import { ProductCard } from "@/lib/design-system";

<ProductCard
  imageUrl="/product.jpg"
  brand="Nike"
  name="Air Max 90 Triple White"
  price={129000}
  link="/items/123"
/>
```

#### 할인 제품 카드

```tsx
<ProductCard
  imageUrl="/product.jpg"
  brand="Adidas"
  name="Ultraboost 22"
  price={159000}
  originalPrice={199000}
  badge="SALE"
  link="/items/456"
  aspectRatio="4/5"
/>
```

#### 제품 그리드

```tsx
import { ProductCard } from "@/lib/design-system";

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          imageUrl={product.image}
          brand={product.brand}
          name={product.name}
          price={product.price}
          badge={product.badge}
          link={`/items/${product.id}`}
        />
      ))}
    </div>
  );
}
```

### ProductCardSkeleton

```tsx
import { ProductCardSkeleton } from "@/lib/design-system";

// 로딩 상태
<ProductCardSkeleton aspectRatio="4/5" />

// 그리드 로딩
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[...Array(8)].map((_, i) => (
    <ProductCardSkeleton key={i} />
  ))}
</div>
```

---

## GridCard

### 개요

갤러리 레이아웃을 위한 카드입니다.
전체 이미지와 선택적 오버레이 콘텐츠를 지원하며, 다양한 aspect ratio를 제공합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | - | 이미지 URL |
| `aspectRatio` | `"1/1" \| "3/4" \| "4/3" \| "4/5" \| "16/9"` | `"4/5"` | 이미지 비율 |
| `overlay` | `ReactNode` | - | 오버레이 콘텐츠 (뱃지, 카운트 등) |
| `link` | `string` | - | 링크 |
| `onClick` | `() => void` | - | 클릭 핸들러 |
| `priority` | `boolean` | `false` | 이미지 우선 로딩 (above-fold) |
| `alt` | `string` | required | 이미지 alt 텍스트 |
| `className` | `string` | - | 추가 CSS 클래스 |

### Usage Examples

#### 기본 갤러리 카드

```tsx
import { GridCard } from "@/lib/design-system";

<GridCard
  imageUrl="/gallery.jpg"
  alt="Gallery image"
  aspectRatio="4/5"
  link="/gallery/123"
/>
```

#### 오버레이가 있는 카드

```tsx
<GridCard
  imageUrl="/photo.jpg"
  alt="Photo"
  overlay={
    <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded">
      <span className="text-white text-xs">12 items</span>
    </div>
  }
  link="/collections/456"
/>
```

#### 갤러리 그리드

```tsx
import { GridCard } from "@/lib/design-system";

function Gallery({ images }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {images.map((image, index) => (
        <GridCard
          key={image.id}
          imageUrl={image.url}
          alt={image.alt}
          aspectRatio="1/1"
          priority={index < 4}  // 첫 4개만 우선 로딩
          link={`/images/${image.id}`}
        />
      ))}
    </div>
  );
}
```

### GridCardSkeleton

```tsx
import { GridCardSkeleton } from "@/lib/design-system";

<GridCardSkeleton aspectRatio="1/1" />
```

---

## FeedCardBase

### 개요

소셜 피드를 위한 카드입니다.
이미지 콘텐츠와 오버레이, 선택적 푸터를 지원하며, Instagram 스타일 (4:5 비율)을 기본으로 합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | - | 이미지 URL |
| `aspectRatio` | `"4/5" \| "1/1" \| "16/9"` | `"4/5"` | 이미지 비율 |
| `overlay` | `ReactNode` | - | 오버레이 (우하단에 자동 위치) |
| `link` | `string` | - | 링크 |
| `onClick` | `() => void` | - | 클릭 핸들러 |
| `priority` | `boolean` | `false` | 이미지 우선 로딩 |
| `alt` | `string` | required | 이미지 alt 텍스트 |
| `children` | `ReactNode` | - | 푸터 콘텐츠 (p-4 패딩 자동 적용) |
| `className` | `string` | - | 추가 CSS 클래스 |

### Usage Examples

#### 기본 피드 카드

```tsx
import { FeedCardBase } from "@/lib/design-system";

<FeedCardBase
  imageUrl="/feed-image.jpg"
  alt="Feed item"
  link="/posts/123"
/>
```

#### 오버레이와 푸터

```tsx
import { FeedCardBase, Text } from "@/lib/design-system";

<FeedCardBase
  imageUrl="/feed-image.jpg"
  alt="Feed item"
  overlay={
    <span className="px-2 py-1 bg-black/50 rounded text-white text-xs">
      5 items
    </span>
  }
  link="/posts/123"
>
  <div className="space-y-1">
    <Text variant="small" className="font-semibold">@username</Text>
    <Text variant="caption" textColor="muted">2 hours ago</Text>
  </div>
</FeedCardBase>
```

#### 피드 그리드

```tsx
import { FeedCardBase } from "@/lib/design-system";

function FeedGrid({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map(post => (
        <FeedCardBase
          key={post.id}
          imageUrl={post.image}
          alt={post.title}
          link={`/posts/${post.id}`}
        >
          <div>
            <p className="font-semibold">{post.author}</p>
            <p className="text-sm text-muted-foreground">{post.timestamp}</p>
          </div>
        </FeedCardBase>
      ))}
    </div>
  );
}
```

### FeedCardBaseSkeleton

```tsx
import { FeedCardBaseSkeleton } from "@/lib/design-system";

<FeedCardBaseSkeleton showFooter={true} />
```

---

## ProfileHeaderCard

### 개요

프로필 헤더를 표시하는 카드입니다.
아바타, 이름, username, 바이오, 통계, 액션 버튼을 지원합니다.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `avatarUrl` | `string` | - | 아바타 이미지 URL (없으면 이니셜 표시) |
| `displayName` | `string` | required | 사용자 이름 |
| `username` | `string` | required | @username |
| `bio` | `string` | - | 바이오 (최대 2줄) |
| `actions` | `ReactNode` | - | 액션 버튼 (설정, 로그아웃 등) |
| `stats` | `Array<{ label: string; value: string \| number }>` | - | 통계 (Posts, Followers 등) |
| `onAvatarClick` | `() => void` | - | 아바타 클릭 핸들러 |
| `className` | `string` | - | 추가 CSS 클래스 |

### Usage Examples

#### 기본 프로필 카드

```tsx
import { ProfileHeaderCard } from "@/lib/design-system";

<ProfileHeaderCard
  avatarUrl="/avatar.jpg"
  displayName="John Doe"
  username="@johndoe"
  bio="Product designer and coffee enthusiast"
/>
```

#### 통계와 액션 버튼

```tsx
import { ProfileHeaderCard } from "@/lib/design-system";

<ProfileHeaderCard
  avatarUrl="/avatar.jpg"
  displayName="John Doe"
  username="@johndoe"
  bio="Product designer and coffee enthusiast"
  stats={[
    { label: "Posts", value: 42 },
    { label: "Followers", value: 1234 },
    { label: "Following", value: 567 }
  ]}
  actions={
    <>
      <button className="btn-primary">Edit Profile</button>
      <button className="btn-ghost">Settings</button>
    </>
  }
/>
```

#### 이니셜 폴백

```tsx
// avatarUrl이 없으면 자동으로 이니셜 표시
<ProfileHeaderCard
  displayName="John Doe"
  username="@johndoe"
  // avatarUrl 없음 → "J" 표시
/>
```

### ProfileHeaderCardSkeleton

```tsx
import { ProfileHeaderCardSkeleton } from "@/lib/design-system";

<ProfileHeaderCardSkeleton showStats={true} />
```

---

## Card Patterns

### 카드 그리드 레이아웃

```tsx
// 반응형 2-4 컬럼 그리드
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <ProductCard />
  <ProductCard />
  <ProductCard />
</div>

// 1-3 컬럼 피드 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <FeedCardBase />
  <FeedCardBase />
  <FeedCardBase />
</div>
```

### Interactive 카드 패턴

```tsx
// Link로 감싸기
<Link href="/items/123">
  <Card interactive>
    <CardContent>Clickable card</CardContent>
  </Card>
</Link>

// onClick 핸들러
<Card interactive onClick={() => handleClick()}>
  <CardContent>Clickable card</CardContent>
</Card>
```

### 로딩 상태 패턴

```tsx
{isLoading ? (
  <div className="grid grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-4 gap-4">
    {products.map(product => (
      <ProductCard key={product.id} {...product} />
    ))}
  </div>
)}
```

---

## Design Tokens 참조

Card 컴포넌트는 다음 토큰을 사용합니다:

- `colors.card`: 카드 배경
- `colors.cardForeground`: 카드 텍스트
- `colors.border`: 카드 테두리
- `shadows.sm`, `shadows.md`, `shadows.lg`: 카드 그림자
- `borderRadius.lg`: 카드 모서리
- `spacing[3]`, `spacing[4]`, `spacing[6]`: 카드 패딩

자세한 내용: [tokens.md](../tokens.md)

---

## Related Documentation

- [Design Tokens](../tokens.md) - Color, Spacing, Shadow 토큰
- [Typography Components](./typography.md) - Heading, Text (CardHeader에서 사용)
- [Design Patterns](../patterns.md) - 카드 레이아웃 패턴
- [decoded.pen](../decoded.pen) - 시각적 레퍼런스

---

> **Note**: 모든 카드 컴포넌트는 기본 Card를 기반으로 구축되었습니다.
> 일관된 스타일링과 interactive 상태를 위해 항상 디자인 시스템 카드를 사용하세요.
