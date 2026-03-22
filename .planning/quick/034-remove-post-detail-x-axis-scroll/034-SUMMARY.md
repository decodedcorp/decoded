# Quick Task 034: Remove post detail x-axis scroll

## Changes
- `packages/web/lib/components/detail/ImageDetailModal.tsx:688`
  - `overflow-x-visible` → `overflow-x-hidden`
  - Post detail 모달 스크롤 컨테이너의 수평 오버플로우 차단

## Result
- x축 스크롤/슬라이드 동작 제거됨
- y축 스크롤은 정상 유지
- 빌드 성공 확인
