# Quick Task 003: Explore 페이지 things 그리드 + footer 제거

## Overview

Explore 페이지에서 Footer를 숨기고 기존 ThiingsGrid 레이아웃을 유지합니다.

## Current State

1. **ThiingsGrid**: 이미 사용 중 ✅ (`ExploreClient.tsx`)
2. **Footer**: `layout.tsx`에 전역으로 렌더링되어 모든 페이지에 표시됨
3. **중복 헤더**: `explore/page.tsx`에서 자체 헤더 렌더링 + `layout.tsx` ConditionalNav에서도 렌더링

## Tasks

### Task 1: Explore 페이지에서 Footer 숨기기

**Approach**: ConditionalFooter 컴포넌트 생성하여 pathname 기반으로 조건부 렌더링

**Files:**
- Create: `lib/components/ConditionalFooter.tsx`
- Edit: `app/layout.tsx` - DesktopFooter를 ConditionalFooter로 교체

**Implementation:**
```tsx
// ConditionalFooter.tsx
"use client";
import { usePathname } from "next/navigation";
import { DesktopFooter } from "@/lib/design-system";

const HIDDEN_FOOTER_PATHS = ["/explore"];

export function ConditionalFooter({ className }: { className?: string }) {
  const pathname = usePathname();
  const shouldHide = HIDDEN_FOOTER_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHide) return null;
  return <DesktopFooter className={className} />;
}
```

### Task 2: Explore 페이지 중복 헤더 제거

**Issue**: `explore/page.tsx`에서 `DesktopHeader`, `MobileHeader`를 직접 렌더링하고 있으나, `layout.tsx`의 `ConditionalNav`에서 이미 렌더링함

**Files:**
- Edit: `app/explore/page.tsx` - 중복 헤더 제거

## Success Criteria

- [ ] Explore 페이지에서 Footer가 숨겨짐
- [ ] ThiingsGrid가 전체 화면을 활용함
- [ ] 다른 페이지에서는 Footer가 정상 표시됨
- [ ] 중복 헤더 제거됨
