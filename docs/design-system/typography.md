# Typography System

> Last Updated: 2026-01-08

---

## Overview

Decoded 앱의 타이포그래피 시스템입니다. 브랜드 아이덴티티를 유지하면서 가독성을 최적화합니다.

---

## Font Families

### Primary Fonts

| Token | Font | Usage | Fallback |
|-------|------|-------|----------|
| `font-serif` | Playfair Display | 제목, 브랜드, 강조 | Georgia, serif |
| `font-sans` | Inter | 본문, UI, 버튼 | system-ui, sans-serif |

### Font Loading

```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
```

---

## Font Sizes

### Scale

| Class | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `text-xs` | 12px (0.75rem) | 16px (1rem) | 0 | 캡션, 라벨, 메타 정보 |
| `text-sm` | 14px (0.875rem) | 20px (1.25rem) | 0 | 보조 텍스트, 작은 버튼 |
| `text-base` | 16px (1rem) | 24px (1.5rem) | 0 | 본문, 기본 UI |
| `text-lg` | 18px (1.125rem) | 28px (1.75rem) | -0.01em | 강조 본문 |
| `text-xl` | 20px (1.25rem) | 28px (1.75rem) | -0.01em | 소제목, 카드 제목 |
| `text-2xl` | 24px (1.5rem) | 32px (2rem) | -0.02em | 섹션 제목 |
| `text-3xl` | 30px (1.875rem) | 36px (2.25rem) | -0.02em | 페이지 제목 |
| `text-4xl` | 36px (2.25rem) | 40px (2.5rem) | -0.025em | 대제목 |
| `text-5xl` | 48px (3rem) | 48px (3rem) | -0.025em | Hero 제목 |

### Responsive Sizes

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Page Title | text-2xl | text-3xl | text-4xl |
| Section Title | text-xl | text-2xl | text-2xl |
| Card Title | text-base | text-lg | text-lg |
| Body | text-sm | text-base | text-base |
| Caption | text-xs | text-xs | text-sm |

---

## Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | 본문, 설명 텍스트 |
| `font-medium` | 500 | 강조, 레이블 |
| `font-semibold` | 600 | 버튼, 제목, 네비게이션 |
| `font-bold` | 700 | 대제목, 강한 강조 |

---

## Text Colors

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `text-foreground` | #1a1a1a | #fafafa | 기본 텍스트 |
| `text-muted-foreground` | #737373 | #a3a3a3 | 보조 텍스트 |
| `text-primary` | #1a1a1a | #fafafa | 링크, 강조 |
| `text-destructive` | #dc2626 | #f87171 | 에러, 경고 |

### Usage Guidelines

```tsx
// 기본 텍스트
<p className="text-foreground">메인 콘텐츠</p>

// 보조 텍스트
<span className="text-muted-foreground">부가 정보</span>

// 에러 메시지
<p className="text-destructive text-sm">필수 입력 항목입니다</p>
```

---

## Text Styles

### Headings

```tsx
// Page Title
<h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
  페이지 제목
</h1>

// Section Title
<h2 className="font-sans text-xl md:text-2xl font-semibold">
  섹션 제목
</h2>

// Card Title
<h3 className="font-sans text-lg font-semibold">
  카드 제목
</h3>

// Subsection
<h4 className="font-sans text-base font-medium text-muted-foreground">
  소제목
</h4>
```

### Body Text

```tsx
// Default Body
<p className="text-base leading-relaxed">
  본문 텍스트입니다.
</p>

// Small Body
<p className="text-sm text-muted-foreground">
  보조 설명 텍스트입니다.
</p>

// Caption
<span className="text-xs text-muted-foreground">
  메타 정보
</span>
```

### UI Text

```tsx
// Button Text
<button className="text-sm font-semibold">
  저장하기
</button>

// Label
<label className="text-sm font-medium">
  이메일
</label>

// Link
<a className="text-sm font-medium text-primary hover:underline">
  더 보기
</a>

// Badge
<span className="text-xs font-medium px-2 py-0.5 rounded-full">
  NEW
</span>
```

---

## Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `leading-none` | 1 | 아이콘 버튼 |
| `leading-tight` | 1.25 | 제목 |
| `leading-snug` | 1.375 | 부제목 |
| `leading-normal` | 1.5 | 본문 (기본) |
| `leading-relaxed` | 1.625 | 긴 본문 |
| `leading-loose` | 2 | 강조 인용 |

---

## Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tracking-tighter` | -0.05em | 대형 제목 |
| `tracking-tight` | -0.025em | 제목 |
| `tracking-normal` | 0 | 본문 (기본) |
| `tracking-wide` | 0.025em | 작은 대문자 |
| `tracking-wider` | 0.05em | 버튼, 라벨 |
| `tracking-widest` | 0.1em | 오버라인 |

---

## Text Utilities

### Truncation

```tsx
// Single line ellipsis
<p className="truncate">긴 텍스트가 잘립니다...</p>

// Multi-line clamp
<p className="line-clamp-2">
  여러 줄 텍스트가 2줄에서 잘립니다...
</p>
```

### Alignment

```tsx
<p className="text-left">왼쪽 정렬</p>
<p className="text-center">가운데 정렬</p>
<p className="text-right">오른쪽 정렬</p>
```

### Decoration

```tsx
<span className="underline">밑줄</span>
<span className="line-through">취소선</span>
<span className="no-underline">밑줄 제거</span>
```

---

## Accessibility

### Minimum Sizes

- **Body text**: 최소 14px (모바일), 16px (데스크톱)
- **Small text**: 최소 12px (캡션, 라벨)
- **Touch targets**: 최소 44px 높이

### Contrast Ratios

- **Normal text**: 최소 4.5:1
- **Large text** (18px+): 최소 3:1
- **UI components**: 최소 3:1

### Best Practices

1. 본문에는 `text-base` 이상 사용
2. `text-xs`는 비필수 정보에만 사용
3. 긴 문단은 `leading-relaxed` 적용
4. 다크 모드에서 밝기 조정 확인

---

## Code Example

```tsx
// 전체 페이지 예시
<article>
  <header>
    <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
      K-POP
    </span>
    <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mt-2">
      BTS 정국의 공항 패션
    </h1>
    <p className="text-muted-foreground mt-2">
      2024년 1월 15일 · 조회 1.2K
    </p>
  </header>

  <main className="mt-6">
    <p className="text-base leading-relaxed">
      정국이 인천공항에서 착용한 오버사이즈 코트가 화제입니다...
    </p>
  </main>

  <footer className="mt-4">
    <a className="text-sm font-medium text-primary hover:underline">
      더 보기 →
    </a>
  </footer>
</article>
```
