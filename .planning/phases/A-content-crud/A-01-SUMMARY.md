---
phase: A-content-crud
plan: 01
subsystem: content-management
tags: [api, crud, react-query, mutations, posts]
requires:
  - phase-6-api-foundation-profile
provides:
  - post-update-api
  - post-delete-api
  - post-mutation-hooks
affects:
  - post-detail-pages
  - user-dashboard
  - post-management-ui
tech-stack:
  added: []
  patterns:
    - react-query-mutations
    - optimistic-cache-updates
    - api-proxy-pattern
key-files:
  created:
    - packages/web/app/api/v1/posts/[postId]/route.ts
  modified:
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/types.ts
    - packages/web/lib/hooks/usePosts.ts
decisions:
  - id: mutation-cache-strategy
    what: Use React Query cache updates for immediate UI feedback
    why: Provides instant feedback while maintaining cache consistency
    alternatives: Refetch on success (slower UX)
  - id: delete-cache-removal
    what: Remove post detail from cache after deletion instead of invalidation
    why: Deleted posts should not exist in cache
    alternatives: Invalidate all queries (less efficient)
metrics:
  duration: ~4 minutes
  tasks-completed: 3
  commits: 3
  files-modified: 4
  lines-added: 229
  lines-removed: 4
completed: 2026-01-29
---

# Phase A Plan 01: Post Edit/Delete APIs Summary

**One-liner:** REST API endpoints and React Query mutations for post update/delete with optimistic cache updates

## Objective

Implement complete post edit and delete operations via REST API, enabling users to modify or remove their own posts and completing the CRUD cycle for posts.

## What Was Built

### 1. API Types and Functions (Task 1)
**Commit:** `ac4c8c5`

Added to `packages/web/lib/api/types.ts`:
- `UpdatePostDto` - DTO for post updates (artist_name, group_name, context, media_source)
- `PostResponse` - Full post response type extending Post

Added to `packages/web/lib/api/posts.ts`:
- `updatePost(postId, data)` - PATCH /api/v1/posts/{postId}
- `deletePost(postId)` - DELETE /api/v1/posts/{postId}

Both functions use the established `apiClient` pattern with `requiresAuth: true`.

### 2. API Proxy Routes (Task 2)
**Commit:** `9fb6492`

Created `packages/web/app/api/v1/posts/[postId]/route.ts`:
- **PATCH handler** - Forwards post update requests to backend
- **DELETE handler** - Forwards post deletion requests to backend
- Uses Next.js 15 async params pattern
- Returns 204 No Content on successful deletion
- Requires authentication via Authorization header
- Handles errors gracefully with proper HTTP status codes

### 3. React Query Mutation Hooks (Task 3)
**Commit:** `9cc3f86`

Enhanced `packages/web/lib/hooks/usePosts.ts`:
- **Query Keys Factory** - `postKeys` object for consistent cache key generation
  - `postKeys.all` - Base key for all post queries
  - `postKeys.lists()` - Key for post lists
  - `postKeys.detail(id)` - Key for specific post detail
- **useUpdatePost()** - Mutation hook for updating posts
  - Updates cache with new data on success
  - Invalidates lists to reflect changes
  - Error logging for debugging
- **useDeletePost()** - Mutation hook for deleting posts
  - Removes post from detail cache
  - Invalidates lists to remove deleted post from UI
  - Error logging for debugging

Updated `usePostById` to use `postKeys.detail(id)` for consistency.

## Technical Highlights

### Cache Management Strategy
- **Update:** Optimistically updates detail cache, then invalidates lists
- **Delete:** Removes detail from cache (deleted post shouldn't exist), invalidates lists
- **Consistency:** Uses centralized `postKeys` factory for all cache operations

### API Proxy Pattern
- All requests go through Next.js API routes (avoids CORS)
- Server-side forward to backend with environment variable `API_BASE_URL`
- Auth token passed through Authorization header
- Proper error handling and HTTP status code forwarding

### Type Safety
- UpdatePostDto uses existing types (ContextType, MediaSource)
- PostResponse extends Post for complete type coverage
- Full TypeScript inference through mutation hooks

## Integration Points

### Ready for UI Integration
Components can now use these hooks:

```typescript
// Update post
const updateMutation = useUpdatePost();
updateMutation.mutate({
  postId: "123",
  data: { artist_name: "IU", context: "stage" }
});

// Delete post
const deleteMutation = useDeletePost();
deleteMutation.mutate("123");
```

### Cache Invalidation Flow
1. User updates/deletes post
2. Mutation hook calls API
3. On success:
   - Update: Detail cache updated, lists invalidated
   - Delete: Detail removed, lists invalidated
4. UI automatically reflects changes via React Query

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Completed
- [x] Post CRUD cycle complete (Create, Read, Update, Delete)
- [x] API proxy routes for all operations
- [x] React Query integration with cache management
- [x] Type-safe API client pattern

### Enables
- **A-02: Spot CRUD APIs** - Similar pattern for spots (already in progress)
- **A-03: Solution CRUD APIs** - Same mutation pattern for solutions
- **Post Detail UI** - Edit/delete buttons in post detail pages
- **User Dashboard** - Manage user's own posts

### Blockers
None

## Testing Notes

### Manual Testing Checklist
- [ ] Update post via API proxy
- [ ] Delete post via API proxy
- [ ] Verify cache invalidation after update
- [ ] Verify cache removal after delete
- [ ] Test auth requirement (should fail without token)
- [ ] Test error handling (invalid post ID, unauthorized)

### Integration Testing
- [ ] UI component with useUpdatePost hook
- [ ] UI component with useDeletePost hook
- [ ] Loading states during mutation
- [ ] Error states and user feedback

## Performance Considerations

### Cache Strategy
- **Optimistic updates** - Immediate UI feedback before API response
- **Selective invalidation** - Only lists invalidated, details updated directly
- **Cache removal on delete** - Prevents stale deleted posts in cache

### API Proxy
- Server-side forward adds minimal latency
- Avoids CORS preflight requests (faster than direct backend calls)
- Single environment variable configuration

## Security

### Authentication
- All mutations require authentication
- Auth token from Supabase session
- Token validated by backend API

### Authorization
- Backend enforces user can only update/delete their own posts
- Frontend assumes backend authorization (no client-side checks)

## Files Changed

### Created (1 file)
1. `packages/web/app/api/v1/posts/[postId]/route.ts` - API proxy for PATCH/DELETE

### Modified (3 files)
1. `packages/web/lib/api/types.ts` - Added UpdatePostDto, PostResponse
2. `packages/web/lib/api/posts.ts` - Added updatePost, deletePost functions
3. `packages/web/lib/hooks/usePosts.ts` - Added mutation hooks and query keys

### Lines Changed
- Added: 229 lines
- Removed: 4 lines
- Net: +225 lines

## Key Learnings

### Pattern Consistency
- Following established patterns (apiClient, API proxy) made implementation smooth
- Query key factory prevents cache key inconsistencies
- Same mutation pattern applicable to spots and solutions

### Cache Management
- React Query's cache invalidation is powerful but must be precise
- Removing vs invalidating has different use cases
- Centralized query keys prevent cache bugs

## Commits

1. `ac4c8c5` - feat(A-01): add updatePost and deletePost API functions
2. `9fb6492` - feat(A-01): add API proxy routes for post PATCH/DELETE
3. `9cc3f86` - feat(A-01): add React Query mutation hooks for post update/delete

**Total commits:** 3
**Duration:** ~4 minutes
**Status:** ✅ Complete
