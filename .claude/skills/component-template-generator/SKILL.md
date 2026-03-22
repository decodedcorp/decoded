---
name: component-template-generator
description: 화면 스펙에서 React 컴포넌트 보일러플레이트 생성. "scaffold component", "create component" 요청 시 자동 적용.
allowed-tools: Read, Write, Edit, Glob, Grep
model: claude-sonnet-4-20250514
---

# Component Template Generator

## 개요

화면 명세(SCR-XXX-##)를 분석하여 React 컴포넌트 보일러플레이트를 자동 생성합니다.
프로젝트의 코딩 컨벤션과 디자인 시스템을 준수합니다.

## 트리거 조건

다음 키워드가 포함된 요청에서 자동 활성화:
- "scaffold component", "컴포넌트 스캐폴드"
- "create component", "컴포넌트 생성"
- "generate component", "컴포넌트 템플릿"
- "보일러플레이트 생성"

## 생성 프로세스

### Step 1: 화면 명세 분석

```
[specs/{feature}/screens/SCR-XXX-##.md]
  ↓
UI 요소 추출 (IMG, TXT, BTN, INP...)
  ↓
상태 정의 추출
  ↓
데이터 요구사항 추출
```

### Step 2: 컴포넌트 구조 결정

```
페이지 컴포넌트 (app/route/page.tsx)
├── 레이아웃 컴포넌트
├── 섹션 컴포넌트 (lib/components/feature/)
│   ├── 프레젠테이셔널 컴포넌트
│   └── 컨테이너 컴포넌트
└── UI 컴포넌트 (lib/components/ui/)
```

### Step 3: 코드 생성

## 컴포넌트 템플릿

### 1. 페이지 컴포넌트

```tsx
// app/{route}/page.tsx
import { Suspense } from 'react';
import { FeatureSection } from '@/lib/components/{feature}';
import { FeatureSkeleton } from '@/lib/components/{feature}/skeleton';

export const metadata = {
  title: '{페이지 제목}',
  description: '{페이지 설명}',
};

export default function FeaturePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<FeatureSkeleton />}>
        <FeatureSection />
      </Suspense>
    </main>
  );
}
```

### 2. 섹션 컴포넌트 (Server Component)

```tsx
// lib/components/{feature}/FeatureSection.tsx
import { fetchFeatureData } from '@/lib/api/{feature}';
import { FeatureClient } from './FeatureClient';

export async function FeatureSection() {
  const data = await fetchFeatureData();

  return <FeatureClient initialData={data} />;
}
```

### 3. 클라이언트 컴포넌트

```tsx
// lib/components/{feature}/FeatureClient.tsx
'use client';

import { useState } from 'react';
import type { FeatureData } from '@/lib/types/{feature}';

interface FeatureClientProps {
  initialData: FeatureData[];
}

export function FeatureClient({ initialData }: FeatureClientProps) {
  const [data, setData] = useState(initialData);

  // 상태 처리
  if (!data.length) {
    return <EmptyState message="데이터가 없습니다" />;
  }

  return (
    <div className="space-y-4">
      {/* UI 렌더링 */}
    </div>
  );
}
```

### 4. 스켈레톤 컴포넌트

```tsx
// lib/components/{feature}/skeleton.tsx
export function FeatureSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}
```

### 5. UI 컴포넌트

```tsx
// lib/components/ui/{ComponentName}.tsx
import { cn } from '@/lib/utils';

interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function ComponentName({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: ComponentNameProps) {
  return (
    <div
      className={cn(
        'base-styles',
        variant === 'outline' && 'outline-styles',
        size === 'sm' && 'small-styles',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

## 파일 구조 생성

```
lib/components/{feature}/
├── index.ts              # barrel export
├── FeatureSection.tsx    # Server component
├── FeatureClient.tsx     # Client component
├── FeatureCard.tsx       # 개별 아이템
├── skeleton.tsx          # 로딩 스켈레톤
└── types.ts              # 로컬 타입 (필요시)
```

### index.ts (Barrel Export)

```tsx
export { FeatureSection } from './FeatureSection';
export { FeatureClient } from './FeatureClient';
export { FeatureSkeleton } from './skeleton';
```

## 네이밍 컨벤션

| 유형 | 규칙 | 예시 |
|------|------|------|
| 파일명 | PascalCase | `FeatureCard.tsx` |
| 컴포넌트 | PascalCase | `FeatureCard` |
| 훅 | camelCase + use | `useFeatureData` |
| 유틸 | camelCase | `formatFeature` |
| 상수 | UPPER_SNAKE | `MAX_ITEMS` |

## 참조 파일

### 화면 명세
- `specs/{feature}/screens/` - 화면 스펙
- `specs/shared/templates/screen-template.md` - 템플릿

### 기존 컴포넌트
- `lib/components/` - 컴포넌트 패턴 참조
- `lib/components/ui/` - UI 컴포넌트

### 디자인 시스템
- `docs/design-system/` - 디자인 토큰

## 생성 후 체크리스트

- [ ] TypeScript 타입 정의
- [ ] Props interface 정의
- [ ] 상태 처리 (로딩, 에러, 빈 상태)
- [ ] 반응형 스타일
- [ ] 접근성 속성 (aria-*)
- [ ] barrel export 추가

## 사용 예시

```
> SCR-DISC-01 화면의 컴포넌트 스캐폴드 생성해줘
> PostGrid 컴포넌트 보일러플레이트 만들어줘
> 이 화면 명세에 맞는 React 컴포넌트 생성해줘
```
