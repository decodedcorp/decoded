# Quick Task 040: Summary

## What was fixed

### Problem
ExploreClient showed repeated "Failed to fetch posts" errors because:
1. Backend (`dev.decoded.style`) returns 400 with HTML from nginx/Cloudflare
2. Proxy route crashed on `response.json()` for HTML responses, returning generic 500
3. React Query default retries caused the error to appear 6 times in console

### Changes

**`packages/web/app/api/v1/posts/route.ts`**
- Changed GET handler to use `response.text()` + `JSON.parse()` instead of `response.json()` to safely handle non-JSON responses (e.g., nginx HTML error pages)
- Preserved backend's actual status code in proxy response (was always 500)
- Changed catch block to return 502 (Bad Gateway) with actual error message instead of generic 500
- Matches the pattern already used in the POST handler (lines 101-110)

**`packages/web/lib/hooks/useImages.ts`**
- Added `retry: 2` to `useInfinitePosts` to reduce error spam (default was 3)

### Commit
c4e8b34

### Note
The root cause is a backend infrastructure issue — `dev.decoded.style` returns 400 for all API endpoints. This fix improves frontend resilience and error reporting, but the backend needs to be investigated separately.
