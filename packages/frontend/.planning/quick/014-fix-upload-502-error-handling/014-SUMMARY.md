# Quick Task 014 Summary: Fix Upload 502 Error Handling

## Completed: 2026-02-05
## Commit: 49c288b

## Problem
POST `/api/v1/posts/upload` 요청 시 502 Bad Gateway 발생하면:
1. 백엔드가 HTML 에러 페이지 반환
2. 프론트엔드가 JSON 파싱 시도 → 추가 에러 발생
3. 사용자에게 불친절한 에러 메시지 표시

## Solution

### 1. API Route 개선 (`route.ts`)
- 502/503/504 상태 코드 명시적 처리
- Content-Type 헤더 확인 후 JSON 파싱
- 구조화된 에러 응답 (`code`, `retryable` 필드 추가)

### 2. 재시도 로직 추가 (`posts.ts`)
- 최대 2회 자동 재시도 (502/503/504 및 네트워크 에러)
- 지수 백오프 (1초 → 2초)
- 재시도 중 progress 표시 업데이트

### 3. 에러 메시지 개선 (`useImageUpload.ts`)
- 서버 에러 시 한국어 친절한 메시지 표시
- 기존 retry 버튼 기능 유지

## Files Changed
- `packages/web/app/api/v1/posts/upload/route.ts`
- `packages/web/lib/api/posts.ts`
- `packages/web/lib/hooks/useImageUpload.ts`

## Testing
- 502 에러 시: 자동 2회 재시도 후 "서버가 일시적으로 응답하지 않습니다" 메시지
- HTML 응답 시: JSON 파싱 에러 없이 정상 에러 처리
- 재시도 버튼: 수동 재시도 정상 동작
