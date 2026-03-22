---
name: pencil-screen-ui
description: Pencil Screen 이미지와 decoded.pen 디자인 시스템을 참조하여 React/Next.js UI 컴포넌트를 생성합니다. "pencil ui", "screen ui", "디자인 구현", "UI 코드 생성" 요청 시 자동 적용.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-20250514
---

# Pencil Screen UI Generator

## 개요

`docs/pencil-screen/` 폴더의 디자인 스크린샷과 `docs/design-system/decoded.pen` 파일을 분석하여 Decoded 프로젝트의 코딩 컨벤션에 맞는 React/Next.js UI 컴포넌트를 생성합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "pencil ui", "펜슬 UI"
- "screen ui", "화면 UI"
- "디자인 구현", "UI 구현"
- "pencil-screen 참고"
- "decoded.pen 기반"

## 입력 소스

### 1. Pencil Screen 이미지 (Visual Reference)
```
docs/pencil-screen/
├── decoded_home_desktop.png      # 홈 데스크톱
├── decoded_home_mobile.png       # 홈 모바일
├── decoded_post_detail_desktop.png  # 포스트 상세 데스크톱
└── decoded_post_detail_mobile.png   # 포스트 상세 모바일
```

### 2. Pencil Design System (.pen 파일)
```
docs/design-system/decoded.pen    # 디자인 토큰, 컴포넌트 정의
```

### 3. 기존 디자인 시스템 컴포넌트
```
packages/web/lib/design-system/   # 구현된 컴포넌트
```

## 생성 프로세스

### Step 1: 디자인 분석

```
[Pencil Screen 이미지] → 시각적 레이아웃 파악
         ↓
[decoded.pen 파일] → 디자인 토큰 추출
         ↓
[기존 컴포넌트] → 재사용 가능 컴포넌트 확인
```

### Step 2: 컴포넌트 구조 결정

이미지에서 추출한 섹션별로 컴포넌트 분리:

```
페이지 (app/route/page.tsx)
├── 레이아웃 컴포넌트
├── 섹션 컴포넌트 (lib/components/feature/)
│   ├── Header Section
│   ├── Hero Section
│   ├── Content Grid
│   └── Footer Section
└── 재사용 컴포넌트 (lib/design-system/)
```

### Step 3: 코드 생성

## 디자인 토큰 매핑

### decoded.pen → Tailwind 클래스

| Pencil Token | CSS Variable | Tailwind Class |
|--------------|--------------|----------------|
| `$--primary` | `--primary` | `bg-primary`, `text-primary` |
| `$--secondary` | `--secondary` | `bg-secondary` |
| `$--background` | `--background` | `bg-background` |
| `$--foreground` | `--foreground` | `text-foreground` |
| `$--muted` | `--muted` | `bg-muted`, `text-muted` |
| `$--accent` | `--accent` | `bg-accent` |
| `$--border` | `--border` | `border-border` |
| `$--card` | `--card` | `bg-card` |

### Typography 매핑

| Pencil Font | Design System Component |
|-------------|------------------------|
| `fontSize: 24, fontWeight: 700` | `<Heading variant="h2">` |
| `fontSize: 18, fontWeight: 600` | `<Heading variant="h3">` |
| `fontSize: 14, fontWeight: 500` | `<Text variant="body">` |
| `fontSize: 12, fontWeight: 400` | `<Text variant="small">` |

### Spacing 매핑

| Pencil Value | Tailwind Class |
|--------------|----------------|
| `gap: 8` | `gap-2` |
| `gap: 16` | `gap-4` |
| `gap: 24` | `gap-6` |
| `gap: 32` | `gap-8` |
| `padding: 16` | `p-4` |
| `padding: 24` | `p-6` |

## 컴포넌트 템플릿

### 1. 섹션 컴포넌트 (Server)

```tsx
// lib/components/{feature}/{SectionName}Section.tsx
import { Heading, Text } from '@/lib/design-system';

export function {SectionName}Section() {
  return (
    <section className="py-10 md:py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Heading variant="h2">{Title}</Heading>
          <button className="text-sm text-primary">View All</button>
        </div>
        {/* Content */}
      </div>
    </section>
  );
}
```

### 2. 클라이언트 컴포넌트

```tsx
// lib/components/{feature}/{FeatureName}Client.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/lib/design-system';

interface {FeatureName}ClientProps {
  initialData: T[];
}

export function {FeatureName}Client({ initialData }: {FeatureName}ClientProps) {
  const [data, setData] = useState(initialData);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.map((item) => (
        <Card key={item.id} variant="elevated">
          <CardContent>{/* Item content */}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 3. 반응형 그리드

```tsx
// 모바일: 1-2열, 태블릿: 2-3열, 데스크톱: 3-4열
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {children}
</div>
```

## Pencil Screen 이미지 분석 가이드

### Home Desktop (decoded_home_desktop.png)
주요 섹션:
- Header: 로고, 네비게이션, 검색, 프로필
- Hero: 대형 배너 이미지
- Decoded's Pick: 수평 스크롤 카드
- Today's Decoded: 그리드 레이아웃
- Artist Spotlight: 2열 레이아웃
- What's New: 카드 그리드
- Discover Items: 카테고리별 탭
- Best Items / Weekly Best / Trending: 리스트/그리드 혼합
- Footer: 4열 링크 그룹

### Home Mobile (decoded_home_mobile.png)
반응형 변경사항:
- 네비게이션 → 햄버거 메뉴
- 그리드 2-4열 → 1-2열
- 수평 스크롤 유지
- 패딩 축소 (p-6 → p-4)

### Post Detail Desktop (decoded_post_detail_desktop.png)
주요 섹션:
- Hero 이미지 (전체 너비)
- 제목 + 태그
- 본문 텍스트 (dropcap)
- Detected Items 그리드
- Gallery 섹션
- Shop the Look 캐러셀
- Related Looks 그리드

### Post Detail Mobile (decoded_post_detail_mobile.png)
반응형 변경사항:
- 이미지 전체 너비
- 수직 스택 레이아웃
- 캐러셀 → 수평 스크롤

## 재사용 컴포넌트 활용

### 기존 디자인 시스템 Import

```tsx
import {
  // Typography
  Heading, Text,
  // Cards
  Card, CardHeader, CardContent, CardFooter,
  ProductCard, GridCard, FeedCardBase,
  // Inputs
  Input, SearchInput,
  // Headers
  DesktopHeader, MobileHeader, DesktopFooter,
  // Tokens
  typography, colors, spacing
} from '@/lib/design-system';
```

### 기존 컴포넌트 위치

| 컴포넌트 | 경로 |
|----------|------|
| Hero | `lib/components/main/HeroSection.tsx` |
| Product Card | `lib/design-system/cards/ProductCard.tsx` |
| Grid Card | `lib/design-system/cards/GridCard.tsx` |
| Feed Card | `lib/design-system/cards/FeedCardBase.tsx` |
| Section Header | `lib/components/main/index.ts` |

## 출력 규칙

### 파일 위치
- 페이지: `app/{route}/page.tsx`
- 섹션 컴포넌트: `lib/components/{feature}/`
- UI 컴포넌트: `lib/components/ui/` 또는 `lib/design-system/`

### 네이밍 컨벤션
| 유형 | 규칙 | 예시 |
|------|------|------|
| 파일명 | PascalCase | `HeroSection.tsx` |
| 컴포넌트 | PascalCase | `HeroSection` |
| CSS 클래스 | Tailwind | `bg-primary text-sm` |

### 반응형 브레이크포인트
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 검증 체크리스트

- [ ] Pencil Screen 이미지와 시각적 일치
- [ ] decoded.pen 디자인 토큰 사용
- [ ] 기존 디자인 시스템 컴포넌트 재사용
- [ ] 반응형 레이아웃 (데스크톱/모바일)
- [ ] TypeScript 타입 정의
- [ ] 접근성 속성 (aria-*)
- [ ] 다크 모드 지원 (CSS 변수 사용)

## 사용 예시

```
> pencil-screen의 home_desktop 참고해서 Hero 섹션 UI 구현해줘
> decoded.pen 기반으로 ProductCard 컴포넌트 만들어줘
> 모바일 포스트 상세 화면의 Gallery 섹션 코드 생성해줘
> pencil-screen 디자인대로 Today's Decoded 섹션 구현해줘
```

## 참조 문서

- `docs/pencil-screen/` - 디자인 스크린샷
- `docs/design-system/decoded.pen` - Pencil 디자인 파일
- `docs/design-system/README.md` - 디자인 시스템 문서
- `.planning/codebase/CONVENTIONS.md` - 코딩 컨벤션
