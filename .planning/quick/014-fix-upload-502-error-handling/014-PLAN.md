# Quick Task 014: Fix Upload 502 Error Handling

## Problem
POST `/api/v1/posts/upload` returns 502 Bad Gateway with HTML response. Current code tries to parse as JSON, causing additional errors.

## Tasks

### Task 1: Improve API Route Error Handling
**File:** `packages/web/app/api/v1/posts/upload/route.ts`

Changes:
1. Check `content-type` header before parsing as JSON
2. Handle 502/503/504 status codes with clear error messages
3. Return structured error response for all failure cases

### Task 2: Add Retry Logic to Upload Function
**File:** `packages/web/lib/api/posts.ts`

Changes:
1. Add retry logic (max 2 retries for 502/503/504)
2. Exponential backoff (1s, 2s delays)
3. Better error message for server unavailable

### Task 3: Update useImageUpload Hook
**File:** `packages/web/lib/hooks/useImageUpload.ts`

Changes:
1. Show user-friendly error message for server errors
2. Enable retry button for server errors (already exists)

## Acceptance Criteria
- [ ] 502 HTML response doesn't cause JSON parse error
- [ ] User sees "서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요."
- [ ] Auto-retry happens 2 times before showing error
- [ ] Manual retry button works after all retries exhausted
