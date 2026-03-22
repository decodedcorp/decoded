# Quick Task 034: Remove post detail x-axis scroll

## Task
Post detail 모달의 스크롤 컨테이너에서 x축 스크롤(슬라이드)을 제거한다.

## Analysis
- `ImageDetailModal.tsx:688`의 스크롤 컨테이너에 `overflow-x-visible` 클래스가 적용되어 있어 콘텐츠가 수평으로 넘침
- `overflow-x-hidden`으로 변경하여 x축 오버플로우를 차단

## Tasks
1. `overflow-x-visible` → `overflow-x-hidden` 변경 (ImageDetailModal.tsx:688)
