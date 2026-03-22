# Quick Task 018: Solution Input UI - Summary

## Completed: 2026-02-05

## Changes Made

### 1. SolutionInputForm Component (New)
**File**: `packages/web/lib/components/request/SolutionInputForm.tsx`

새로운 solution 입력 폼 컴포넌트:
- 상품명 (필수)
- 구매 링크 (필수)
- 가격 (선택)
- 저장/취소 버튼

### 2. DetectedItemCard Enhancement
**File**: `packages/web/lib/components/request/DetectedItemCard.tsx`

확장 가능한 카드로 업그레이드:
- 선택 시 "상품 정보 추가" 버튼 표시
- 클릭 시 SolutionInputForm 확장
- 저장된 solution 요약 표시
- 수정/외부 링크 버튼

### 3. useSpotCardSync Hook Update
**File**: `packages/web/lib/hooks/useSpotCardSync.ts`

- ref 타입을 `HTMLElement`로 일반화 (HTMLButtonElement → HTMLElement)

### 4. Layout Components Update
**Files**:
- `MobileDetectionLayout.tsx`
- `DesktopDetectionLayout.tsx`

- `onSaveSolution` prop 추가
- ref 타입 업데이트

### 5. Page Components Update
**Files**:
- `app/request/detect/page.tsx`
- `app/@modal/(.)request/detect/page.tsx`

- `setSpotSolution` action 연결
- `onSaveSolution` prop 전달

## Files Changed
- `packages/web/lib/components/request/SolutionInputForm.tsx` (new)
- `packages/web/lib/components/request/DetectedItemCard.tsx` (modified)
- `packages/web/lib/hooks/useSpotCardSync.ts` (modified)
- `packages/web/lib/components/request/MobileDetectionLayout.tsx` (modified)
- `packages/web/lib/components/request/DesktopDetectionLayout.tsx` (modified)
- `packages/web/app/request/detect/page.tsx` (modified)
- `packages/web/app/@modal/(.)request/detect/page.tsx` (modified)

## UI Flow

```
1. 감지된 아이템 카드 클릭
2. 카드 선택됨 (하이라이트)
3. "상품 정보 추가" 버튼 표시
4. 버튼 클릭 → SolutionInputForm 확장
5. 정보 입력 후 저장
6. Solution 요약 표시 (제목, 가격, 링크)
7. 필요시 수정 가능
```

## Verification
- [x] TypeScript type check passed
- [x] ESLint passed (no new errors)
- [x] 카드 선택 시 확장 동작
- [x] Solution 입력/저장 기능
- [x] Solution 요약 표시
