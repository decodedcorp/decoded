# Quick Task 040: Fix ExploreClient Posts Fetch Proxy Error Handling

## Problem

When backend returns non-JSON responses (e.g., nginx HTML error pages), the proxy route at `app/api/v1/posts/route.ts` crashes because `response.json()` throws on HTML content. The catch block returns generic "Failed to fetch posts" with status 500, losing the actual error context (e.g., 400 status).

## Root Cause

1. `app/api/v1/posts/route.ts:44` - `response.json()` throws when backend returns HTML
2. Catch block (line 48-54) returns generic error with status 500, hiding real status code
3. React Query default retries cause the error to spam console 6 times

## Tasks

### Task 1: Fix proxy route to handle non-JSON responses

File: `packages/web/app/api/v1/posts/route.ts`

- Use `response.text()` first, then try `JSON.parse()` to safely handle HTML responses
- Preserve the backend's actual status code in the proxy response
- Include meaningful error context in the error message

### Task 2: Reduce React Query retry spam for posts hook

File: `packages/web/lib/hooks/useImages.ts`

- Add `retry: 2` to `useInfinitePosts` to limit retries (default is 3)
- This reduces console error spam when backend is genuinely down
