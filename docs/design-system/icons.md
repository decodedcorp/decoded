# Icon System

> Last Updated: 2026-01-08

---

## Overview

Decoded 앱의 아이콘 시스템입니다. Lucide Icons를 기본으로 사용하며, 일관된 크기와 스타일을 적용합니다.

---

## Icon Library

### Primary: Lucide Icons

```bash
yarn add lucide-react
```

```tsx
import { Search, Heart, Share2, ChevronRight } from 'lucide-react';
```

**선택 이유:**
- 일관된 디자인 언어
- 트리 쉐이킹 지원 (작은 번들)
- React 컴포넌트 형태
- 활발한 유지보수

---

## Icon Sizes

### Standard Sizes

| Size | Tailwind | px | Usage |
|------|----------|-----|-------|
| `xs` | `h-3 w-3` | 12px | 인라인 텍스트, 뱃지 |
| `sm` | `h-4 w-4` | 16px | 버튼 내 아이콘, 작은 UI |
| `md` | `h-5 w-5` | 20px | 기본 크기, 네비게이션 |
| `lg` | `h-6 w-6` | 24px | 강조, 카드 헤더 |
| `xl` | `h-8 w-8` | 32px | 큰 아이콘, 빈 상태 |
| `2xl` | `h-10 w-10` | 40px | Hero, 특수 상황 |
| `3xl` | `h-12 w-12` | 48px | 빈 상태 일러스트 |

### Size by Context

| Context | Size | Example |
|---------|------|---------|
| Button (sm) | h-4 w-4 | `<Search className="h-4 w-4" />` |
| Button (md) | h-5 w-5 | `<Search className="h-5 w-5" />` |
| Button (lg) | h-6 w-6 | `<Search className="h-6 w-6" />` |
| Navigation | h-5 w-5 | `<Home className="h-5 w-5" />` |
| Input prefix | h-4 w-4 | `<Search className="h-4 w-4" />` |
| Card action | h-5 w-5 | `<Heart className="h-5 w-5" />` |
| Toast | h-5 w-5 | `<Check className="h-5 w-5" />` |
| Empty state | h-12 w-12 | `<Inbox className="h-12 w-12" />` |

---

## Icon Colors

### Semantic Colors

| State | Tailwind | Usage |
|-------|----------|-------|
| Default | `text-foreground` | 기본 상태 |
| Muted | `text-muted-foreground` | 비활성, 보조 |
| Primary | `text-primary` | 강조, 선택됨 |
| Destructive | `text-destructive` | 삭제, 경고 |
| Success | `text-green-500` | 완료, 성공 |
| Warning | `text-amber-500` | 주의 |

### Interactive States

```tsx
// 호버 색상 변경
<button className="text-muted-foreground hover:text-foreground">
  <Heart className="h-5 w-5" />
</button>

// 활성 상태
<button className="text-primary">
  <Heart className="h-5 w-5 fill-current" />
</button>
```

---

## Icon Variants

### Outline (기본)

```tsx
<Heart className="h-5 w-5" />
// 빈 하트
```

### Filled

```tsx
<Heart className="h-5 w-5 fill-current" />
// 채워진 하트
```

### With Animation

```tsx
// 로딩 스피너
<Loader2 className="h-5 w-5 animate-spin" />

// 펄스 효과
<Bell className="h-5 w-5 animate-pulse" />
```

---

## Common Icons

### Navigation

| Icon | Name | Usage |
|------|------|-------|
| `Home` | 홈 | 홈 화면 |
| `Search` | 검색 | 검색 기능 |
| `User` | 사용자 | 프로필, 계정 |
| `Menu` | 메뉴 | 햄버거 메뉴 |
| `X` | 닫기 | 모달/패널 닫기 |
| `ChevronLeft` | 뒤로 | 뒤로 가기 |
| `ChevronRight` | 앞으로 | 더 보기, 화살표 |

### Actions

| Icon | Name | Usage |
|------|------|-------|
| `Heart` | 좋아요 | 좋아요/저장 |
| `Share2` | 공유 | 공유하기 |
| `Bookmark` | 북마크 | 저장하기 |
| `Download` | 다운로드 | 다운로드 |
| `ExternalLink` | 외부 링크 | 새 탭 열기 |
| `Copy` | 복사 | 클립보드 복사 |

### Feedback

| Icon | Name | Usage |
|------|------|-------|
| `Check` | 체크 | 성공, 완료 |
| `AlertCircle` | 경고 | 에러 |
| `AlertTriangle` | 주의 | 경고 |
| `Info` | 정보 | 안내 |
| `Loader2` | 로딩 | 로딩 중 |

### Content

| Icon | Name | Usage |
|------|------|-------|
| `Image` | 이미지 | 이미지 관련 |
| `Camera` | 카메라 | 촬영, 업로드 |
| `Filter` | 필터 | 필터링 |
| `SlidersHorizontal` | 설정 | 상세 필터 |
| `Tag` | 태그 | 태그, 라벨 |

### E-commerce

| Icon | Name | Usage |
|------|------|-------|
| `ShoppingBag` | 쇼핑백 | 구매하기 |
| `CreditCard` | 카드 | 결제 |
| `Truck` | 배송 | 배송 정보 |
| `Package` | 패키지 | 상품 |

---

## Usage Patterns

### Icon Button

```tsx
// 아이콘만 있는 버튼
<button
  className="p-2 rounded-full hover:bg-accent"
  aria-label="검색"
>
  <Search className="h-5 w-5" />
</button>
```

### Icon + Text Button

```tsx
// 왼쪽 아이콘
<button className="inline-flex items-center gap-2">
  <Plus className="h-4 w-4" />
  <span>추가하기</span>
</button>

// 오른쪽 아이콘
<button className="inline-flex items-center gap-2">
  <span>더 보기</span>
  <ChevronRight className="h-4 w-4" />
</button>
```

### Input with Icon

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <input className="pl-10 pr-4 py-2" placeholder="검색..." />
</div>
```

### Badge with Icon

```tsx
<span className="inline-flex items-center gap-1 text-xs">
  <Check className="h-3 w-3 text-green-500" />
  인증됨
</span>
```

### Empty State

```tsx
<div className="flex flex-col items-center py-12">
  <Inbox className="h-12 w-12 text-muted-foreground" />
  <p className="mt-4 text-muted-foreground">
    검색 결과가 없습니다
  </p>
</div>
```

---

## Accessibility

### Required Attributes

```tsx
// 아이콘 버튼에는 반드시 aria-label 추가
<button aria-label="닫기">
  <X className="h-5 w-5" />
</button>

// 장식용 아이콘은 aria-hidden
<span className="flex items-center gap-2">
  <Heart className="h-4 w-4" aria-hidden="true" />
  좋아요 128
</span>

// 의미 있는 아이콘은 role과 title
<AlertCircle
  className="h-5 w-5 text-destructive"
  role="img"
  aria-label="오류"
/>
```

### Focus States

```tsx
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
  <Search className="h-5 w-5" />
</button>
```

---

## Icon Component Wrapper

재사용 가능한 아이콘 래퍼 컴포넌트:

```tsx
// lib/components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  return <IconComponent className={cn(sizeClasses[size], className)} />;
}

// 사용
<Icon icon={Search} size="md" className="text-muted-foreground" />
```

---

## Custom Icons

프로젝트 전용 커스텀 아이콘이 필요한 경우:

```tsx
// lib/components/icons/DecodedLogo.tsx
export function DecodedLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
    >
      {/* SVG path */}
    </svg>
  );
}
```

---

## Best Practices

1. **일관된 크기**: 같은 컨텍스트에서는 동일한 크기 사용
2. **적절한 색상**: 상태와 의미에 맞는 색상 적용
3. **접근성**: 인터랙티브 아이콘에는 항상 레이블 제공
4. **성능**: 필요한 아이콘만 import (트리 쉐이킹)
5. **일관성**: Lucide 스타일과 일치하는 커스텀 아이콘 제작
