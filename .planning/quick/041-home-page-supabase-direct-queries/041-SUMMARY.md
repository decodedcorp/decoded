# Quick Task 041: Summary

## What Changed
- `packages/web/app/page.tsx`: Replaced all `fetchPostsServer` calls (external API) with Supabase direct queries from `main-page.server.ts`

## Before
- 5x `fetchPostsServer()` calls to external backend API via `NEXT_PUBLIC_API_BASE_URL`
- Backend (`dev.decoded.style`) returning 400 on all routes

## After
- Direct Supabase queries: `fetchFeaturedPostServer`, `fetchArtistSpotlightServer`, `fetchWhatsNewPostsServer`, `fetchWeeklyBestPostsServer`
- No dependency on external backend for home page
- Page returns 200, renders correctly

## Commit
8c68ec3 - fix: switch home page from external API to Supabase direct queries
