---
phase: quick-054
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/page.tsx
autonomous: true
requirements: [QUICK-054]

must_haves:
  truths:
    - "Main page hero shows real DB post data (artist name, image from R2 CDN)"
    - "Main page grid shows real weekly best posts from DB"
    - "PersonalizeBanner still renders from mock JSON"
    - "Page degrades gracefully to mock data when DB returns null/empty"
  artifacts:
    - path: "packages/web/app/page.tsx"
      provides: "Async server component with Supabase queries"
      contains: "fetchFeaturedPostServer"
  key_links:
    - from: "packages/web/app/page.tsx"
      to: "lib/supabase/queries/main-page.server.ts"
      via: "import fetchFeaturedPostServer, fetchWeeklyBestPostsServer"
      pattern: "fetchFeaturedPostServer|fetchWeeklyBestPostsServer"
---

<objective>
Replace mock JSON imports for hero and grid sections in page.tsx with real Supabase DB queries.

Purpose: Show real post data (601 posts with R2 CDN images) on the main page instead of placeholder picsum images.
Output: Async page.tsx that fetches from DB with mock fallback.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/page.tsx
@packages/web/lib/supabase/queries/main-page.server.ts
@packages/web/lib/components/main-renewal/types.ts

<interfaces>
<!-- From main-page.server.ts -->
```typescript
export interface PostData {
  id: string;
  imageUrl: string | null;
  artistName: string | null;
  groupName: string | null;
  mediaTitle: string | null;
  mediaType: string | null;
  context: string | null;
  viewCount: number;
  createdAt: string;
}

export async function fetchFeaturedPostServer(): Promise<PostData | null>;
export async function fetchWeeklyBestPostsServer(limit?: number): Promise<PostData[]>;
```

<!-- From types.ts — target shapes to map into -->
```typescript
export interface MainHeroData {
  celebrityName: string;
  editorialTitle: string;
  editorialSubtitle?: string;
  heroImageUrl: string;
  ctaLink: string;
  ctaLabel?: string;
}

export interface GridItemData {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  category: string;
  link: string;
  spots?: GridItemSpot[];
  aspectRatio?: number;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace hero + grid mock imports with Supabase queries</name>
  <files>packages/web/app/page.tsx</files>
  <action>
Make page.tsx an async Server Component that fetches real data from Supabase, with mock fallback.

1. Add imports:
   - `import { fetchFeaturedPostServer, fetchWeeklyBestPostsServer } from "@/lib/supabase/queries/main-page.server";`
   - Keep `import bannerData from "@/lib/components/main-renewal/mock/personalize-banner.json";` as-is

2. Remove mock imports for hero and grid:
   - Remove `import heroData from "@/lib/components/main-renewal/mock/main-hero.json";`
   - Remove `import gridItems from "@/lib/components/main-renewal/mock/main-grid-items.json";`

3. Change `export default function Home()` to `export default async function Home()`

4. Add data fetching at top of function body:
   ```typescript
   const [featuredPost, weeklyBestPosts] = await Promise.all([
     fetchFeaturedPostServer(),
     fetchWeeklyBestPostsServer(8),
   ]);
   ```

5. Map PostData to MainHeroData with mock fallback:
   ```typescript
   const heroData: MainHeroData = featuredPost && featuredPost.imageUrl
     ? {
         celebrityName: (featuredPost.artistName || featuredPost.groupName || "DECODED").toUpperCase(),
         editorialTitle: featuredPost.context || featuredPost.mediaTitle || "Today's Featured Look",
         editorialSubtitle: featuredPost.groupName
           ? `${featuredPost.groupName} — Curated by AI`
           : "AI가 큐레이션한 오늘의 에디토리얼",
         heroImageUrl: featuredPost.imageUrl,
         ctaLink: `/posts/${featuredPost.id}`,
         ctaLabel: "VIEW EDITORIAL",
       }
     : (await import("@/lib/components/main-renewal/mock/main-hero.json")).default as MainHeroData;
   ```

6. Map PostData[] to GridItemData[] with mock fallback:
   ```typescript
   const gridItems: GridItemData[] = weeklyBestPosts.length > 0
     ? weeklyBestPosts
         .filter((p) => p.imageUrl)
         .map((post, i) => ({
           id: post.id,
           imageUrl: post.imageUrl!,
           title: post.artistName || post.groupName || "Unknown",
           subtitle: post.context || post.mediaTitle || undefined,
           category: post.mediaType || "Style",
           link: `/posts/${post.id}`,
           aspectRatio: [1.25, 1.0, 1.4, 0.8, 1.2, 1.0, 1.5, 0.9][i % 8],
         }))
     : ((await import("@/lib/components/main-renewal/mock/main-grid-items.json")).default as GridItemData[]);
   ```

   Note: aspectRatio uses a repeating pattern array for masonry height variation since DB posts don't have this metadata.

7. The JSX stays exactly the same — it already uses `heroData`, `gridItems`, and `bannerData` variables.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - page.tsx is async and calls fetchFeaturedPostServer + fetchWeeklyBestPostsServer
    - Hero shows real featured post data (artist name, R2 CDN image, link to post)
    - Grid shows real weekly best posts mapped to GridItemData
    - PersonalizeBanner still uses mock JSON
    - If DB returns null/empty, mock JSON loads as fallback
    - Build succeeds with no type errors
  </done>
</task>

</tasks>

<verification>
- `yarn build` passes without errors
- Visit `http://localhost:3000` — hero shows real celebrity/post image, grid shows real post thumbnails
- If Supabase is unreachable, page still renders with mock data
</verification>

<success_criteria>
- Main page hero displays real DB post (artist name, R2 CDN image URL, link to /posts/{id})
- Main page grid displays 8 real weekly best posts with real images
- PersonalizeBanner unchanged (still mock)
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/54-mock-json-supabase-db/54-SUMMARY.md`
</output>
