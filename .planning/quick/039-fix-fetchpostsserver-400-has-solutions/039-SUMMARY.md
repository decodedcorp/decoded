# Quick Task 039: Summary

## What Changed
- `packages/web/app/page.tsx`: Removed `has_solutions` parameter from two `fetchPostsServer` calls that were causing 400 errors

## Why
Backend `GET /api/v1/posts` doesn't support `has_solutions` query parameter. The parameter was added to the frontend types but never implemented on the backend.

## Impact
- Home page no longer gets 400 errors on load
- "Decoded Styles" and "Need Decoding" sections now show general recent posts (same data)
- To differentiate these sections properly, backend needs to add `has_solutions` filter support

## Files Modified
- `packages/web/app/page.tsx` (lines 22-30)
