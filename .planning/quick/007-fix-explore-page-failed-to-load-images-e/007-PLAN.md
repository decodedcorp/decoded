---
phase: quick-007
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/explore/ExploreClient.tsx
  - packages/shared/supabase/queries/images-adapter.ts
autonomous: true

must_haves:
  truths:
    - "Explore page loads images successfully"
    - "Error messages show actual error details for debugging"
    - "Supabase client is properly initialized before queries run"
  artifacts:
    - path: "packages/web/app/explore/ExploreClient.tsx"
      provides: "Better error display with actual error message"
    - path: "packages/shared/supabase/queries/images-adapter.ts"
      provides: "Improved error handling in unified adapter"
  key_links:
    - from: "ExploreClient.tsx"
      to: "useInfiniteFilteredImages"
      via: "React Query hook"
    - from: "images-adapter.ts"
      to: "getSupabaseClient()"
      via: "Supabase client singleton"
---

<objective>
Fix explore page "Failed to load images" error

Purpose: The explore page shows a generic error message instead of loading images. Need to diagnose and fix the root cause.

Output: Working explore page with proper error handling and debugging capability
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@packages/web/app/explore/ExploreClient.tsx
@packages/shared/supabase/queries/images-adapter.ts
@packages/shared/supabase/queries/images.ts
@packages/web/lib/hooks/useImages.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Improve error handling and add debugging to diagnose issue</name>
  <files>
    packages/web/app/explore/ExploreClient.tsx
    packages/shared/supabase/queries/images-adapter.ts
  </files>
  <action>
    1. In ExploreClient.tsx, improve error display to show actual error details:
       - Show error.message if error is Error instance
       - Use JSON.stringify for non-Error objects
       - Add console.error to log full error details

    2. In images-adapter.ts, wrap fetchImagesByPostImage in try-catch:
       - The current code only catches orphan fetch errors
       - If fetchImagesByPostImage throws, it propagates up unhandled
       - Add proper error handling and re-throw with context

    3. Add defensive check for Supabase client initialization:
       - Import isSupabaseInitialized from shared
       - Check before making queries, provide helpful error
  </action>
  <verify>
    - Run `yarn build` to verify no TypeScript errors
    - Run `yarn dev` and visit /explore
    - Check browser console for error details
    - Verify error message displays actual issue
  </verify>
  <done>
    Error page shows actual error message instead of generic "Something went wrong".
    Console logs provide debugging information about the failure.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix root cause based on error diagnosis</name>
  <files>
    Depends on Task 1 diagnosis - likely one of:
    - packages/shared/supabase/queries/images.ts (query issue)
    - packages/web/lib/supabase/init.ts (initialization order)
    - packages/shared/supabase/queries/images-adapter.ts (adapter logic)
  </files>
  <action>
    Based on the error message revealed in Task 1:

    IF "Supabase client not initialized":
    - Ensure init.ts import is in correct order
    - Consider lazy initialization pattern in queries

    IF database/query error:
    - Check Supabase RLS policies
    - Verify get_orphan_images RPC function exists
    - Check query syntax against table schema

    IF type mismatch or null data:
    - Add null checks in data transformation
    - Ensure proper type guards

    Fix the identified root cause and verify the explore page loads.
  </action>
  <verify>
    - Run `yarn build` passes
    - Run `yarn dev` and visit /explore
    - Images load successfully in the grid
    - No errors in browser console
    - Filter and search still work correctly
  </verify>
  <done>
    Explore page displays images successfully.
    No error state shown unless there's a genuine network/server issue.
  </done>
</task>

</tasks>

<verification>
1. Build succeeds: `yarn build`
2. Dev server runs without errors: `yarn dev`
3. /explore page loads and displays images
4. Filter by category works (fashion, beauty, etc.)
5. Search functionality works
6. Infinite scroll loads more images
7. No console errors during normal operation
</verification>

<success_criteria>
- Explore page loads images without showing error state
- Error handling provides useful debugging information when issues occur
- Build passes with no TypeScript errors
- All existing functionality preserved (filters, search, infinite scroll)
</success_criteria>

<output>
After completion, create `.planning/quick/007-fix-explore-page-failed-to-load-images-e/007-SUMMARY.md`
</output>
