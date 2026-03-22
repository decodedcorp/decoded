---
phase: quick-051
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/supabase/queries/profile.ts
  - packages/web/lib/components/profile/PostsGrid.tsx
  - packages/web/lib/components/profile/SpotsList.tsx
  - packages/web/lib/components/profile/SolutionsList.tsx
  - packages/web/lib/components/profile/ProfileBio.tsx
  - packages/web/app/profile/ProfileClient.tsx
autonomous: true
requirements: [QUICK-051]

must_haves:
  truths:
    - "PostsGrid shows real posts from DB when userId is provided"
    - "SpotsList shows real spots from DB when userId is provided"
    - "SolutionsList shows real solutions from DB when userId is provided"
    - "ProfileBio shows real bio from user data instead of mock text"
    - "All components show loading spinners during fetch"
    - "All components show empty states when no data exists"
  artifacts:
    - path: "packages/web/lib/supabase/queries/profile.ts"
      provides: "Supabase queries for user-scoped spots, solutions, posts"
    - path: "packages/web/lib/components/profile/PostsGrid.tsx"
      provides: "PostsGrid using real DB data"
    - path: "packages/web/lib/components/profile/SpotsList.tsx"
      provides: "SpotsList using real DB data"
    - path: "packages/web/lib/components/profile/SolutionsList.tsx"
      provides: "SolutionsList using real DB data"
    - path: "packages/web/lib/components/profile/ProfileBio.tsx"
      provides: "ProfileBio with real bio prop, no mock social links"
  key_links:
    - from: "packages/web/lib/components/profile/PostsGrid.tsx"
      to: "packages/web/lib/supabase/queries/profile.ts"
      via: "useQuery calling fetchPostsByUser"
      pattern: "fetchPostsByUser"
    - from: "packages/web/lib/components/profile/SpotsList.tsx"
      to: "packages/web/lib/supabase/queries/profile.ts"
      via: "useQuery calling fetchSpotsByUser"
      pattern: "fetchSpotsByUser"
    - from: "packages/web/lib/components/profile/SolutionsList.tsx"
      to: "packages/web/lib/supabase/queries/profile.ts"
      via: "useQuery calling fetchSolutionsByUser"
      pattern: "fetchSolutionsByUser"
---

<objective>
Replace hardcoded mock data in 4 Profile components (PostsGrid, SpotsList, SolutionsList, ProfileBio) with real Supabase DB queries.

Purpose: Profile page currently shows fake placeholder data. Real user data exists in Supabase tables (posts: 601 rows, spots: 1,534 rows, solutions: 1,582 rows, users: 8 rows).
Output: 4 components fetching and displaying real data with loading/empty states.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/supabase/queries/posts.ts (existing Supabase query patterns -- follow fetchPostsByUser pattern)
@packages/web/lib/supabase/types.ts (SpotRow, SolutionRow, PostRow, UserRow type definitions)
@packages/web/lib/supabase/client.ts (supabaseBrowserClient import)
@packages/web/app/profile/ProfileClient.tsx (parent component -- already calls useMe(), has userData)

<interfaces>
<!-- Supabase Row types from packages/web/lib/supabase/types.ts -->

PostRow: { id, user_id, image_url, media_type, media_title, media_metadata, group_name, artist_name, context, view_count, status, created_at, updated_at, trending_score }

SpotRow: { id, post_id, user_id, position_left, position_top, subcategory_id, status, created_at, updated_at }

SolutionRow: { id, spot_id, user_id, match_type, title, price_amount, price_currency, original_url, affiliate_url, thumbnail_url, description, accurate_count, different_count, is_verified, is_adopted, adopted_at, click_count, purchase_count, status, created_at, updated_at, metadata, comment, qna, keywords }

UserResponse (from useMe()): { id, email, username, rank, total_points, is_admin, avatar_url, bio, display_name }

<!-- Existing query pattern from packages/web/lib/supabase/queries/posts.ts -->
fetchPostsByUser(userId, limit=20): Promise<PostRow[]>
  -- uses supabaseBrowserClient.from("posts").select("*").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(limit)

<!-- Current component props (keep unchanged) -->
SpotsListProps: { spots?: SpotItem[], className?: string }
SolutionsListProps: { solutions?: SolutionItem[], className?: string }
PostsGridProps: { posts?: PostItem[], className?: string }
ProfileBioProps: { bio?: string, socialLinks?: SocialLink[], className?: string }

<!-- ProfileClient.tsx already has: -->
const { data: userData } = useMe();  // line 177 -- userData.bio available
<ProfileBio className="px-4" />      // line 348 -- currently no props passed
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Supabase profile queries and wire PostsGrid + SpotsList + SolutionsList</name>
  <files>
    packages/web/lib/supabase/queries/profile.ts
    packages/web/lib/components/profile/PostsGrid.tsx
    packages/web/lib/components/profile/SpotsList.tsx
    packages/web/lib/components/profile/SolutionsList.tsx
  </files>
  <action>
1. **Create `packages/web/lib/supabase/queries/profile.ts`** with three query functions following existing patterns in `posts.ts`:

   - `fetchPostsByUserProfile(userId: string, limit = 20): Promise<PostRow[]>` -- query `posts` table filtered by `user_id`, `status = 'active'`, ordered by `created_at desc`. Include spot count via a count subquery or just return posts (spot_count not in PostRow, count spots separately or skip).

   - `fetchSpotsByUser(userId: string, limit = 20): Promise<(SpotRow & { post: { image_url: string | null } | null })[]>` -- query `spots` table filtered by `user_id`, ordered by `created_at desc`, with `.select("*, post:posts(image_url)")` to join the post's image_url for the thumbnail display. The component needs an image and the spot itself has no image -- use the post's image.

   - `fetchSolutionsByUser(userId: string, limit = 20): Promise<SolutionRow[]>` -- query `solutions` table filtered by `user_id`, `status = 'active'`, ordered by `created_at desc`.

   Follow existing pattern: use `supabaseBrowserClient`, handle errors with dev console.error, return empty array on error.

2. **Update `PostsGrid.tsx`**:
   - Remove `MOCK_POSTS` array entirely.
   - Add `userId?: string` to `PostsGridProps` (keep `posts` optional prop for backward compat).
   - If `userId` is provided and `posts` is not, use `useQuery` from `@tanstack/react-query` to call `fetchPostsByUserProfile(userId)`. Map `PostRow` to `PostItem` shape: `{ id: row.id, imageUrl: row.image_url || '', title: row.media_title || row.artist_name || 'Untitled', itemCount: 0 }`. (Item count requires spots query -- skip for now, show 0 or omit.)
   - Add a loading spinner (same pattern as ProfileClient: `<div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>`).
   - Keep existing empty state.
   - If neither `userId` nor `posts` is provided, show empty state (no more mock fallback).

3. **Update `SpotsList.tsx`**:
   - Remove `MOCK_SPOTS` array entirely.
   - Add `userId?: string` to `SpotsListProps`.
   - If `userId` is provided and `spots` is not, use `useQuery` to call `fetchSpotsByUser(userId)`. Map to `SpotItem` shape: `{ id: row.id, imageUrl: row.post?.image_url || '', label: row.subcategory_id (or 'Spot'), category: row.status, createdAt: row.created_at }`.
   - Add loading spinner. Keep empty state.
   - Remove mock fallback default.

4. **Update `SolutionsList.tsx`**:
   - Remove `MOCK_SOLUTIONS` array entirely.
   - Add `userId?: string` to `SolutionsListProps`.
   - If `userId` is provided and `solutions` is not, use `useQuery` to call `fetchSolutionsByUser(userId)`. Map to `SolutionItem` shape: `{ id: row.id, imageUrl: row.thumbnail_url || '', itemName: row.title, brand: row.description || '', price: row.price_amount ? formatPrice(row.price_amount, row.price_currency) : undefined, verified: row.is_verified }`.
   - Add loading spinner. Keep empty state.
   - Remove mock fallback default.

For all three components, use query keys like `["profile", "posts", userId]`, `["profile", "spots", userId]`, `["profile", "solutions", userId]` with `enabled: !!userId`.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - MOCK_POSTS, MOCK_SPOTS, MOCK_SOLUTIONS arrays removed from all three components
    - Each component accepts `userId` prop and fetches real data via Supabase queries
    - Loading spinners shown during fetch
    - Empty states shown when no data
    - Type check passes
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire ProfileBio with real data and connect userId in ProfileClient</name>
  <files>
    packages/web/lib/components/profile/ProfileBio.tsx
    packages/web/app/profile/ProfileClient.tsx
  </files>
  <action>
1. **Update `ProfileBio.tsx`**:
   - Remove `MOCK_SOCIAL_LINKS` array.
   - Change default `bio` value from the mock string to `undefined`.
   - Change default `socialLinks` value to `[]` (empty array -- no social_links column in users table, defer to future feature).
   - When `bio` is undefined/null, show a subtle placeholder: `<p className="text-sm text-muted-foreground italic">No bio yet</p>`.
   - Keep the socialLinks rendering logic (it will just show nothing when empty).

2. **Update `ProfileClient.tsx`**:
   - Pass `bio` from `userData` to `ProfileBio`: change `<ProfileBio className="px-4" />` to `<ProfileBio bio={userData?.bio ?? undefined} className="px-4" />`.
   - Pass `userId` from `userData` to the three list components. Find where PostsGrid, SpotsList, SolutionsList are imported -- they are imported but currently NOT rendered in `renderTabContent()` (which uses ActivityItemCard). There are two options:
     a) If these components are NOT used anywhere in the render, just ensure they accept `userId` prop for future use (no wiring needed in ProfileClient now).
     b) If they ARE rendered somewhere we missed, wire `userId={userData?.id}`.
   - Based on analysis, `renderTabContent()` only renders `ActivityItemCard` items. PostsGrid/SpotsList/SolutionsList are imported but not rendered. So: just wire `ProfileBio` with real bio. The other 3 components are ready for future use with `userId` prop.
   - Remove unused imports of `PostsGrid`, `SpotsList`, `SolutionsList` from ProfileClient if they are truly unused (check grep first -- they may be used in other files). If only imported here but unused, remove to clean up.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - ProfileBio renders real bio from useMe() data
    - MOCK_SOCIAL_LINKS removed
    - Mock bio default string removed
    - ProfileBio shows "No bio yet" placeholder when bio is null/undefined
    - ProfileClient passes userData.bio to ProfileBio
    - Unused imports cleaned up
    - Type check passes
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors in the modified files
2. `yarn build` completes without errors
3. Profile page loads and shows real bio (or "No bio yet" if user has no bio)
4. PostsGrid/SpotsList/SolutionsList accept userId prop and fetch real data when provided
</verification>

<success_criteria>
- All 4 mock data arrays (MOCK_POSTS, MOCK_SPOTS, MOCK_SOLUTIONS, MOCK_SOCIAL_LINKS) removed
- Components fetch real data from Supabase when userId is provided
- ProfileBio displays real bio text from useMe() API response
- Loading and empty states present in all data-fetching components
- TypeScript compilation passes
</success_criteria>

<output>
After completion, create `.planning/quick/51-db/51-SUMMARY.md`
</output>
