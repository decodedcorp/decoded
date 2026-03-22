# Quick Task 041: Switch home page to Supabase direct queries

## Problem
Home page (`app/page.tsx`) fetches data via `fetchPostsServer` which calls the external backend API (`dev.decoded.style`). The backend is returning 400 on all routes (nginx issue).

## Solution
Switch from `fetchPostsServer` (external API) to existing Supabase server queries from `main-page.server.ts` which bypass the backend entirely.

## Tasks
1. Replace `fetchPostsServer` calls with Supabase direct queries (`fetchFeaturedPostServer`, `fetchArtistSpotlightServer`, `fetchWhatsNewPostsServer`, `fetchWeeklyBestPostsServer`)
2. Update mapper functions from API-based (`apiPostTo*`) to Supabase-based (`postTo*`, `styleCardServerTo*`)
3. Verify type safety and page renders correctly
