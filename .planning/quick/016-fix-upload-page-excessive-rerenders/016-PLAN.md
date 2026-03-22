# Quick Task 016: Fix Upload Page Excessive Re-renders

## Problem

Upload 페이지 (`/request/upload`) 진입 시 과도한 리렌더링 발생. Quick 013에서 request 페이지 최적화를 했지만 upload 페이지의 하위 컴포넌트들에서 추가적인 최적화가 필요함.

## Root Cause Analysis

1. **ImagePreviewGrid에서 inline callback 생성**
   - `onRemove={() => onRemove(image.id)}` 매번 새 함수 참조 생성
   - `onRetry={onRetry ? () => onRetry(image.id) : undefined}` 매번 새 함수 참조 생성
   - 각 이미지마다 새 callback이 생성되어 ImagePreview 컴포넌트 리렌더링 유발

2. **ImagePreview 컴포넌트 memo 미적용**
   - props가 바뀌지 않아도 부모 리렌더링 시 같이 리렌더링
   - upload progress 업데이트 시 전체 그리드가 불필요하게 리렌더링

3. **DropZone 컴포넌트 memo 미적용**
   - `onFilesSelected` prop만 받지만 부모 리렌더링 시 같이 리렌더링
   - ImagePreviewGrid 내부의 compact DropZone도 동일 문제

## Solution

### Task 1: ImagePreviewGrid callback 최적화

ImagePreviewGrid에서 inline callback 대신 useCallback + id 전달 패턴 사용.

**Files:** `packages/web/lib/components/request/ImagePreviewGrid.tsx`

**Action:**
1. onRemove, onRetry를 id를 받는 callback으로 변경 (현재 구조 유지)
2. ImagePreview에 image.id를 전달하고 내부에서 id와 함께 호출
3. 불필요한 inline function 제거

**Verify:** `yarn lint` 통과

**Done:** ImagePreviewGrid에서 inline callback 제거됨

### Task 2: ImagePreview/DropZone에 React.memo 적용

자주 변하지 않는 컴포넌트에 memo 적용하여 불필요한 리렌더링 방지.

**Files:**
- `packages/web/lib/components/request/ImagePreview.tsx`
- `packages/web/lib/components/request/DropZone.tsx`

**Action:**
1. ImagePreview: React.memo로 감싸고, image 객체의 변화만 감지하도록 custom comparator 추가
   - 비교 대상: image.id, image.status, image.progress, image.error
2. DropZone: React.memo로 감싸기 (props가 단순하므로 기본 비교로 충분)

**Verify:** `yarn build` 성공

**Done:** 두 컴포넌트 memo 적용 완료

### Task 3: 기능 검증

**Files:** None (검증만)

**Action:**
1. `/request/upload` 페이지 접속
2. 이미지 드래그앤드롭 또는 클릭하여 업로드
3. 업로드 progress 표시 확인
4. 업로드 완료 후 체크마크 표시 확인
5. 이미지 삭제 기능 확인
6. Next 버튼 클릭하여 detect 페이지 이동 확인

**Verify:** 모든 기능 정상 동작, React DevTools에서 불필요한 리렌더링 감소 확인

**Done:** Upload 페이지 기능 정상 동작, 리렌더링 최적화 완료

## Files to Modify

- `packages/web/lib/components/request/ImagePreviewGrid.tsx`
- `packages/web/lib/components/request/ImagePreview.tsx`
- `packages/web/lib/components/request/DropZone.tsx`

## Success Criteria

- Upload 페이지 리렌더링 횟수 현저히 감소
- 이미지 업로드/삭제/재시도 기능 정상 동작
- `yarn build` 성공
