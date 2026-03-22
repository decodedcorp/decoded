# Spacing System

> Last Updated: 2026-01-08

---

## Overview

Decoded 앱의 간격 시스템입니다. 4px 기준 스케일을 사용하여 일관된 레이아웃을 구성합니다.

---

## Base Unit

**4px (0.25rem)** 을 기준 단위로 사용합니다.

```
4px × 1 = 4px
4px × 2 = 8px
4px × 3 = 12px
4px × 4 = 16px
...
```

---

## Spacing Scale

### Core Scale

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| `space-0` | `p-0`, `m-0` | 0px | 리셋 |
| `space-0.5` | `p-0.5`, `m-0.5` | 2px | 미세 조정 |
| `space-1` | `p-1`, `m-1` | 4px | 아이콘-텍스트 간격 |
| `space-1.5` | `p-1.5`, `m-1.5` | 6px | 작은 내부 간격 |
| `space-2` | `p-2`, `m-2` | 8px | 요소 내부 간격 |
| `space-2.5` | `p-2.5`, `m-2.5` | 10px | 버튼 내부 패딩 |
| `space-3` | `p-3`, `m-3` | 12px | 컴포넌트 내부 |
| `space-4` | `p-4`, `m-4` | 16px | 카드 패딩, 섹션 내부 |
| `space-5` | `p-5`, `m-5` | 20px | 중간 간격 |
| `space-6` | `p-6`, `m-6` | 24px | 섹션 간 간격 |
| `space-8` | `p-8`, `m-8` | 32px | 큰 섹션 간 간격 |
| `space-10` | `p-10`, `m-10` | 40px | 페이지 섹션 |
| `space-12` | `p-12`, `m-12` | 48px | 대형 간격 |
| `space-16` | `p-16`, `m-16` | 64px | 페이지 간격 |

### Extended Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-20` | 80px | Hero 섹션 |
| `space-24` | 96px | 페이지 상단/하단 |
| `space-32` | 128px | 대형 여백 |

---

## Usage Guidelines

### Component Spacing

| Component | Internal Padding | External Margin |
|-----------|------------------|-----------------|
| Button (sm) | px-3 py-1.5 | - |
| Button (md) | px-4 py-2 | - |
| Button (lg) | px-6 py-3 | - |
| Card | p-4 | mb-4 |
| Input | px-3 py-2 | mb-4 |
| Modal | p-6 | - |
| Section | py-8 | - |

### Layout Spacing

| Context | Spacing | Tailwind |
|---------|---------|----------|
| 인라인 요소 간 | 4-8px | `gap-1`, `gap-2` |
| 폼 필드 간 | 16px | `space-y-4` |
| 카드 그리드 간 | 16px | `gap-4` |
| 섹션 간 | 32-48px | `space-y-8`, `space-y-12` |
| 페이지 여백 | 16-32px | `px-4`, `px-8` |

---

## Container System

### Max Widths

| Token | Width | Usage |
|-------|-------|-------|
| `max-w-sm` | 384px | 작은 모달 |
| `max-w-md` | 448px | 폼 컨테이너 |
| `max-w-lg` | 512px | 중간 모달 |
| `max-w-xl` | 576px | 콘텐츠 영역 |
| `max-w-2xl` | 672px | 기사/포스트 |
| `max-w-4xl` | 896px | 와이드 콘텐츠 |
| `max-w-6xl` | 1152px | 페이지 컨테이너 |
| `max-w-7xl` | 1280px | 최대 컨테이너 |

### Breakpoint Container

```tsx
// 반응형 컨테이너
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  {/* 콘텐츠 */}
</div>
```

| Breakpoint | Container Padding | Max Width |
|------------|-------------------|-----------|
| Mobile (< 640px) | 16px (px-4) | 100% |
| Tablet (640-1024px) | 24px (px-6) | 768px |
| Desktop (> 1024px) | 32px (px-8) | 1280px |

---

## Grid System

### Grid Gaps

| Context | Gap | Tailwind |
|---------|-----|----------|
| 이미지 그리드 | 8px | `gap-2` |
| 카드 그리드 | 16px | `gap-4` |
| 대시보드 | 24px | `gap-6` |

### Column Configuration

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile | 1-2 | 8px |
| Tablet | 2-3 | 16px |
| Desktop | 3-4 | 16px |

```tsx
// 반응형 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## Responsive Spacing

### Mobile First Approach

```tsx
// 기본: 모바일, sm/md/lg: 상위 브레이크포인트
<section className="py-8 md:py-12 lg:py-16">
  <div className="px-4 md:px-6 lg:px-8">
    <h2 className="mb-4 md:mb-6">제목</h2>
    <div className="space-y-4 md:space-y-6">
      {/* 콘텐츠 */}
    </div>
  </div>
</section>
```

### Spacing Variants by Breakpoint

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Page padding | 16px | 24px | 32px |
| Section gap | 32px | 48px | 64px |
| Card padding | 12px | 16px | 16px |
| Card gap | 8px | 16px | 16px |

---

## Specific Patterns

### Header

```tsx
<header className="h-14 md:h-16 px-4 md:px-6">
  <div className="flex items-center gap-4">
    {/* Logo + Navigation */}
  </div>
</header>
```

### Card

```tsx
<div className="p-4 rounded-lg">
  <div className="space-y-2">
    <h3 className="text-lg font-semibold">제목</h3>
    <p className="text-muted-foreground">설명</p>
  </div>
  <div className="mt-4 flex gap-2">
    <Button>액션</Button>
  </div>
</div>
```

### Form

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">라벨</label>
    <input className="px-3 py-2" />
  </div>
  <div className="space-y-2">
    <label className="text-sm font-medium">라벨</label>
    <input className="px-3 py-2" />
  </div>
  <div className="pt-4">
    <Button>제출</Button>
  </div>
</form>
```

### Modal

```tsx
<div className="p-6">
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">모달 제목</h2>
    <p className="text-muted-foreground">모달 설명</p>
  </div>
  <div className="mt-6 flex gap-2 justify-end">
    <Button variant="ghost">취소</Button>
    <Button>확인</Button>
  </div>
</div>
```

---

## Negative Spacing

특수한 경우 음수 마진을 사용합니다:

```tsx
// 전체 너비 이미지 (컨테이너 패딩 무시)
<div className="-mx-4 md:-mx-6">
  <img className="w-full" />
</div>

// 겹치는 요소
<div className="-mt-8 relative z-10">
  <Card />
</div>
```

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | 기본 |
| `z-10` | 10 | 플로팅 요소 |
| `z-20` | 20 | 드롭다운 |
| `z-30` | 30 | 헤더 |
| `z-40` | 40 | 사이드바 |
| `z-50` | 50 | 모달 백드롭 |
| `z-[60]` | 60 | 모달 콘텐츠 |
| `z-[70]` | 70 | 토스트 |
| `z-[100]` | 100 | 툴팁, 팝오버 |

---

## Touch Targets

모바일에서 터치 타겟 최소 크기:

| Element | Minimum Size |
|---------|--------------|
| Button | 44px × 44px |
| Link | 44px height |
| Icon Button | 44px × 44px |
| List Item | 48px height |

```tsx
// 터치 영역 확장
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="h-5 w-5" />
</button>
```
