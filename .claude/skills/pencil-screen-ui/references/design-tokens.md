# Design Token Reference

## decoded.pen 토큰 → Tailwind 매핑

### Colors

| Pencil Variable | CSS Variable | Tailwind | 용도 |
|-----------------|--------------|----------|------|
| `$--primary` | `--primary` | `bg-primary`, `text-primary` | 주요 액션, CTA |
| `$--primary-foreground` | `--primary-foreground` | `text-primary-foreground` | primary 위 텍스트 |
| `$--secondary` | `--secondary` | `bg-secondary` | 보조 액션 |
| `$--background` | `--background` | `bg-background` | 페이지 배경 |
| `$--foreground` | `--foreground` | `text-foreground` | 기본 텍스트 |
| `$--muted` | `--muted` | `bg-muted`, `text-muted` | 비활성, 보조 텍스트 |
| `$--muted-foreground` | `--muted-foreground` | `text-muted-foreground` | muted 위 텍스트 |
| `$--accent` | `--accent` | `bg-accent` | 강조 |
| `$--border` | `--border` | `border-border` | 테두리 |
| `$--card` | `--card` | `bg-card` | 카드 배경 |
| `$--destructive` | `--destructive` | `bg-destructive` | 삭제, 에러 |

### Spacing (4px 기반)

| Pencil Value | Tailwind | 실제 값 |
|--------------|----------|--------|
| `4` | `1` | 4px |
| `8` | `2` | 8px |
| `12` | `3` | 12px |
| `16` | `4` | 16px |
| `20` | `5` | 20px |
| `24` | `6` | 24px |
| `32` | `8` | 32px |
| `40` | `10` | 40px |
| `48` | `12` | 48px |
| `64` | `16` | 64px |

### Border Radius

| Pencil Value | Tailwind |
|--------------|----------|
| `4` | `rounded` |
| `6` | `rounded-md` |
| `8` | `rounded-lg` |
| `12` | `rounded-xl` |
| `16` | `rounded-2xl` |
| `9999` | `rounded-full` |

### Typography

| Pencil Spec | Design System | Tailwind |
|-------------|---------------|----------|
| `fontSize: 32, fontWeight: 700` | `<Heading variant="h1">` | `text-3xl font-bold` |
| `fontSize: 24, fontWeight: 700` | `<Heading variant="h2">` | `text-2xl font-bold` |
| `fontSize: 18, fontWeight: 600` | `<Heading variant="h3">` | `text-lg font-semibold` |
| `fontSize: 16, fontWeight: 500` | `<Text variant="body">` | `text-base font-medium` |
| `fontSize: 14, fontWeight: 400` | `<Text variant="body">` | `text-sm` |
| `fontSize: 12, fontWeight: 400` | `<Text variant="small">` | `text-xs` |

### Font Family

| Pencil Font | CSS Variable | Tailwind |
|-------------|--------------|----------|
| `Inter` | `--font-sans` | `font-sans` |
| `JetBrains Mono` | `--font-mono` | `font-mono` |

## 컴포넌트 스타일 매핑

### Button Variants (decoded.pen)

```tsx
// Button/Default
<Button className="h-10 px-4 bg-primary text-primary-foreground rounded-md gap-2">
  <Icon className="w-4 h-4" />
  <span className="text-sm font-medium">Button</span>
</Button>

// Button/Secondary
<Button variant="secondary" className="h-10 px-4 bg-secondary text-foreground rounded-md gap-2">
  <Icon className="w-4 h-4" />
  <span className="text-sm font-medium">Button</span>
</Button>

// Button/Outline
<Button variant="outline" className="h-10 px-4 border border-border bg-transparent text-foreground rounded-md gap-2">
  <Icon className="w-4 h-4" />
  <span className="text-sm font-medium">Button</span>
</Button>
```

### Card Variants

```tsx
// Card (기본)
<div className="bg-card border border-border rounded-lg p-4">
  {children}
</div>

// Card (elevated)
<div className="bg-card rounded-lg p-4 shadow-md">
  {children}
</div>

// Card (interactive)
<div className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow">
  {children}
</div>
```

### Input Variants

```tsx
// Input (기본)
<input className="h-10 px-3 bg-background border border-border rounded-md text-sm placeholder:text-muted-foreground" />

// Input (with icon)
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <input className="h-10 pl-10 pr-3 bg-background border border-border rounded-md text-sm" />
</div>

// Input (search)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <input className="h-10 pl-10 pr-10 bg-muted rounded-full text-sm" />
</div>
```

## 레이아웃 패턴

### Section Wrapper

```tsx
// 기본 섹션 래퍼
<section className="py-10 md:py-16 px-4 md:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    {children}
  </div>
</section>

// 배경색이 있는 섹션
<section className="py-10 md:py-16 px-4 md:px-6 lg:px-8 bg-card">
  <div className="max-w-7xl mx-auto">
    {children}
  </div>
</section>
```

### Grid Layouts

```tsx
// 2열 그리드
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {children}
</div>

// 3열 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {children}
</div>

// 4열 그리드
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {children}
</div>

// 6열 그리드 (아이템)
<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
  {children}
</div>
```

### Horizontal Scroll

```tsx
// 수평 스크롤 (모바일)
<div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 w-64 snap-start">
      {/* Card content */}
    </div>
  ))}
</div>
```

## 다크 모드 지원

CSS 변수를 사용하면 자동으로 다크 모드가 지원됩니다:

```tsx
// 올바른 사용 (다크 모드 자동 지원)
<div className="bg-background text-foreground" />
<div className="bg-card border-border" />
<div className="text-muted-foreground" />

// 피해야 할 사용 (하드코딩된 색상)
<div className="bg-white text-black" />  // ❌
<div className="bg-[#1F1F1F]" />          // ❌
```

## Lucide Icons

decoded.pen에서 사용하는 아이콘:

```tsx
import {
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Menu,
  User,
  Settings,
  LogOut,
  Camera,
  Image,
  Upload
} from 'lucide-react';
```
