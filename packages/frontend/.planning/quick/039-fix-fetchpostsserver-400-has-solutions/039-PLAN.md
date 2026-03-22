# Quick Task 039: Fix fetchPostsServer 400 error (has_solutions)

## Problem
`fetchPostsServer` sends `has_solutions` query parameter to backend API, but the backend doesn't support it → returns 400.

## Root Cause
`has_solutions` was added to `PostsListParams` and `buildPostsQueryString` but the backend `GET /api/v1/posts` endpoint doesn't accept this parameter (not in API docs).

## Fix
Remove `has_solutions` from `page.tsx` calls. Both "decoded styles" and "need decoding" sections will show general recent posts until backend adds `has_solutions` support.

## Tasks
1. [x] Remove `has_solutions: true` from decodedStylesRes call in page.tsx
2. [x] Remove `has_solutions: false` from needDecodingRes call in page.tsx
3. [x] Verify build passes
