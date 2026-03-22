# Quick Task 011: Fix Request Page Excessive Re-renders

## Problem

Request 페이지에서 Fast Refresh가 과도하게 발생 (로그에서 15+ rebuilds 관찰)

## Root Cause Analysis

1. **Zustand action selector 패턴 문제**
   - `useRequestStore((s) => s.resetRequestFlow)` 같은 패턴이 매번 새 함수 참조 생성
   - 함수 내용은 같지만 참조가 달라 리렌더링 유발

2. **useImageUpload 훅의 다수 개별 selector**
   - 6개의 개별 `useRequestStore` 호출
   - 각각 독립적으로 상태 변화 감지 → 불필요한 렌더링

3. **useCallback 의존성 과다**
   - `handleFilesSelected`: `images.length` 변경마다 새 함수
   - `uploadToStorage`: 9개 의존성으로 자주 재생성

## Solution

### Task 1: requestStore에 action getter 추가

```typescript
// Store 외부에서 action 직접 접근 (렌더링 없이)
export const getRequestActions = () => useRequestStore.getState();
```

### Task 2: useImageUpload 최적화

1. Action들을 `getState()` 패턴으로 변경
2. `useCallback` 의존성 최소화 (ref 패턴 활용)
3. 불필요한 selector 제거

### Task 3: RequestUploadPage 최적화

1. Action selector를 `getState()` 패턴으로 변경
2. `canProceed` selector 유지 (상태 기반이므로 필요)

## Files to Modify

- `packages/web/lib/stores/requestStore.ts`
- `packages/web/lib/hooks/useImageUpload.ts`
- `packages/web/app/request/upload/page.tsx`

## Success Criteria

- Fast Refresh 로그에서 연속 rebuilds 현저히 감소
- 이미지 업로드 기능 정상 동작 유지
