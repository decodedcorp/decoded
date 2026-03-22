# Quick Task 011: Fix Request Page Excessive Re-renders - COMPLETE

## Problem Solved

Request 페이지에서 Fast Refresh가 과도하게 발생하는 문제 해결

## Changes Made

### 1. requestStore.ts
- `getRequestActions()` 함수 추가: 렌더링 없이 action들에 직접 접근

### 2. useImageUpload.ts
- Action selector들을 `getRequestActions()` 패턴으로 변경
- `optionsRef`로 콜백 옵션 저장하여 의존성 제거
- `imagesLengthRef`, `imagesRef`로 상태 값 저장하여 useCallback 안정화
- `uploadToStorage`: 9개 → 0개 의존성
- `handleFilesSelected`: 4개 → 2개 의존성
- `retryUpload`: 2개 → 1개 의존성

### 3. RequestUploadPage.tsx
- `resetRequestFlow` action을 `getRequestActions()` 패턴으로 변경
- `handleClose`를 `useCallback`으로 메모이제이션

### 4. RequestFlowModal.tsx
- `useRequestStore` 구독 제거 (action만 필요했음)
- `getRequestActions()` 패턴으로 변경
- `handleClose` 의존성 배열에서 `resetRequestFlow` 제거

## Technical Details

**Before:**
- 컴포넌트가 action을 selector로 구독 → 불필요한 리렌더링
- useCallback 의존성 과다 → 함수 재생성 → 자식 리렌더링

**After:**
- action은 `getState()` 패턴으로 접근 (구독 없음)
- ref 패턴으로 의존성 최소화
- 실제 UI 렌더링에 필요한 상태만 구독

## Files Modified

- `packages/web/lib/stores/requestStore.ts`
- `packages/web/lib/hooks/useImageUpload.ts`
- `packages/web/app/request/upload/page.tsx`
- `packages/web/lib/components/request/RequestFlowModal.tsx`

## Verification

- TypeScript: ✅ 타입 체크 통과
- ESLint: ✅ 새로운 에러 없음
- 기능: 이미지 업로드 플로우 정상 동작 유지

## Result

Fast Refresh 연속 발생 현저히 감소 예상
- Action 구독 제거로 불필요한 렌더링 방지
- 안정적인 함수 참조로 자식 컴포넌트 리렌더링 방지
