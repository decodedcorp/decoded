# Quick Task 019: Manual Spot Creation Flow - Summary

## Completed: 2026-02-05

## Changes Made

### Flow Change
**Before:** upload → analyze (AI 자동 감지) → post 생성
**After:** upload → 사용자가 수동으로 spot 찍기 → post 생성

### 1. requestStore 수정
**File**: `packages/web/lib/stores/requestStore.ts`

새로운 액션 추가:
- `addSpot(x, y, categoryCode?)` - 클릭 위치에 새 spot 추가
- `removeSpot(spotId)` - spot 삭제 및 리인덱싱

### 2. DetectionView 수정
**File**: `packages/web/lib/components/request/DetectionView.tsx`

- `onImageClick` prop 추가 - 이미지 클릭 시 normalized 좌표 전달
- 클릭 영역 오버레이 추가 (cursor: crosshair)
- 안내 메시지 변경: "이미지를 탭하여 아이템 위치를 표시하세요"

### 3. Layout 컴포넌트 수정
**Files**:
- `MobileDetectionLayout.tsx`
- `DesktopDetectionLayout.tsx`

- `onAddSpot` prop 추가
- DetectionView에 `onImageClick` 전달
- 헤더 텍스트 변경: "Detected Items" → "Spots"

### 4. detect 페이지 수정
**Files**:
- `app/request/detect/page.tsx`
- `app/@modal/(.)request/detect/page.tsx`

- analyze 호출 제거 (startDetection 미사용)
- `addSpot` 액션 연결
- 타이틀 변경: "Detecting Items" → "Add Spots"

## Files Changed
- `packages/web/lib/stores/requestStore.ts`
- `packages/web/lib/components/request/DetectionView.tsx`
- `packages/web/lib/components/request/MobileDetectionLayout.tsx`
- `packages/web/lib/components/request/DesktopDetectionLayout.tsx`
- `packages/web/app/request/detect/page.tsx`
- `packages/web/app/@modal/(.)request/detect/page.tsx`

## New User Flow

```
1. 이미지 업로드 (/request/upload)
2. Next 클릭 → /request/detect로 이동
3. 이미지 위 원하는 위치 클릭 → spot 추가됨
4. spot 카드에서 solution 정보 입력 (선택)
5. Next 클릭 → post 생성
```

## Verification
- [x] TypeScript type check passed
- [x] analyze API 호출 없음
- [x] 이미지 클릭 시 spot 추가 동작
- [x] spot 자동 선택 및 카드 표시
