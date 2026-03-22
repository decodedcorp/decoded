---
phase: 06-api-foundation-profile
plan: 02
subsystem: api-client
tags: [api, react-query, profile, hooks, zustand]
depends_on:
  requires: ["06-01"]
  provides: ["Profile API functions", "Profile React Query hooks", "API-sync actions"]
  affects: ["06-03", "track-c"]
tech-stack:
  added: []
  patterns: ["React Query infinite queries", "API response mapping", "Store sync from API"]
key-files:
  created:
    - packages/web/lib/api/users.ts
    - packages/web/lib/hooks/useProfile.ts
  modified:
    - packages/web/lib/stores/profileStore.ts
    - packages/web/lib/api/index.ts
decisions:
  - decision: "Use fetch* naming for API functions (fetchMe, fetchUserStats, etc.)"
    rationale: "Consistent with React Query conventions and distinguishes from get* selectors"
    date: "2026-01-29"
  - decision: "Keep mock data in profileStore as fallback"
    rationale: "Preserves UI during loading states and when API is unavailable"
    date: "2026-01-29"
  - decision: "Map API points to earnings in store"
    rationale: "Gamification phase (Track C) will handle full points/earnings system"
    date: "2026-01-29"
metrics:
  duration: "3 minutes"
  tasks_completed: 3
  files_changed: 4
  commits: 3
  completed: "2026-01-29"
---

# Phase 06 Plan 02: Profile Read APIs Summary

**One-liner:** Profile API client with React Query hooks for user data, stats, and paginated activities

## What Was Built

Created comprehensive profile data fetching infrastructure connecting the backend API to the frontend.

### Core Deliverables

1. **User API Functions** (`packages/web/lib/api/users.ts`)
   - `fetchMe()`: Current user profile (authenticated)
   - `fetchUserStats()`: User statistics (authenticated)
   - `fetchUserActivities()`: Paginated activity history (authenticated)
   - `fetchUserById()`: Public user profile (no auth)
   - Query string builder for activities pagination

2. **React Query Hooks** (`packages/web/lib/hooks/useProfile.ts`)
   - `useMe()`: Current user profile with options support
   - `useUserStats()`: User statistics hook
   - `useUserActivities()`: Infinite query for paginated activities
   - `useUser()`: Public user profile hook
   - Query keys: `profileKeys.me`, `.stats`, `.activities`, `.user`

3. **Store Integration** (`packages/web/lib/stores/profileStore.ts`)
   - `setUserFromApi()`: Sync user data from API response
   - `setStatsFromApi()`: Sync stats data from API response
   - Field mapping: `display_name`, `username`, `avatar_url`, `bio`
   - Points → earnings mapping (temporary until Track C)

4. **API Index Exports** (`packages/web/lib/api/index.ts`)
   - Exported all user API functions for easy consumption
   - Centralized API surface for profile features

## Technical Implementation

### API Client Pattern

All functions use the shared `apiClient` from plan 06-01:

```typescript
export async function fetchMe(): Promise<UserResponse> {
  return apiClient<UserResponse>({
    path: "/api/v1/users/me",
    method: "GET",
    requiresAuth: true,
  });
}
```

Benefits:
- Automatic JWT token injection
- Standardized error handling
- Type safety with OpenAPI-matching types

### React Query Integration

Hooks follow project conventions from `usePosts.ts`:

```typescript
export function useMe(
  options?: Omit<UseQueryOptions<UserResponse, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
```

Stale times optimized for data volatility:
- Profile: 5 minutes (changes infrequently)
- Stats: 2 minutes (updates more often)
- Activities: 1 minute (real-time feel)

### Infinite Query for Activities

Used React Query's `useInfiniteQuery` for pagination:

```typescript
export function useUserActivities(params?: UseUserActivitiesParams) {
  return useInfiniteQuery({
    queryKey: profileKeys.activities(params),
    queryFn: async ({ pageParam }): Promise<PaginatedActivitiesResponse> => {
      const page = (pageParam as number) ?? 1;
      return fetchUserActivities({
        type: params?.type,
        page,
        per_page: params?.perPage ?? 20,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60,
  });
}
```

Supports:
- Type filtering (post, spot, solution)
- Custom page size
- Automatic next page detection

### Store Sync Pattern

Profile store can now sync from API responses:

```typescript
setUserFromApi: (apiUser) => {
  set({
    user: {
      id: apiUser.id,
      displayName: apiUser.display_name || apiUser.username,
      username: `@${apiUser.username}`,
      avatarUrl: apiUser.avatar_url || undefined,
      bio: apiUser.bio || undefined,
    },
  });
}
```

Maps API snake_case to store camelCase and handles optional fields.

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| PROF-01: View own profile | ✅ Complete | `useMe()` hook |
| PROF-03: View stats | ✅ Complete | `useUserStats()` hook |
| PROF-04: View activities | ✅ Complete | `useUserActivities()` infinite query |
| PROF-05: View other profiles | ✅ Complete | `useUser(userId)` hook |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Enables

- **Plan 06-03 (Profile Edit)**: Can now fetch user data to populate edit form
- **Track C (Gamification)**: Points/earnings data flow established
- **Track B (Engagement)**: User activities provide engagement history

### Blockers

None identified.

### Outstanding Items

- **Gamification data**: Badge and ranking APIs deferred to Track C
- **Real-time updates**: Activity feed real-time sync deferred to v2
- **Avatar upload**: Image upload for avatars handled in Track D (Monetization)

## Files Modified

### Created
- `packages/web/lib/api/users.ts` - User API functions
- `packages/web/lib/hooks/useProfile.ts` - Profile React Query hooks

### Modified
- `packages/web/lib/stores/profileStore.ts` - Added API sync actions
- `packages/web/lib/api/index.ts` - Added user API exports

## Testing Notes

### Manual Testing

All endpoints require backend API running at `https://dev.decoded.style/api/v1`.

**Test fetchMe:**
```typescript
const { data, isLoading, error } = useMe();
// Should return authenticated user's profile
```

**Test useUserActivities:**
```typescript
const { data, fetchNextPage, hasNextPage } = useUserActivities({ perPage: 10 });
// Should paginate through user activities
```

**Test store sync:**
```typescript
const { setUserFromApi } = useProfileStore();
const userData = await fetchMe();
setUserFromApi(userData);
// Should update store user with API data
```

### TypeScript Validation

✅ Compilation successful - all types match OpenAPI spec

## Performance Considerations

1. **Stale time optimization**: Longer stale times for infrequently changing data
2. **Query key structure**: Efficient cache invalidation with hierarchical keys
3. **Infinite query**: Loads activities on demand, not all at once
4. **Options passthrough**: Allows consumers to override stale times per use case

## Future Improvements

1. **Optimistic updates**: For profile edits (already in useUpdateProfile)
2. **Activity real-time**: WebSocket subscription for live activity feed
3. **Prefetching**: Prefetch user stats when profile loads
4. **Error boundaries**: Graceful degradation when API unavailable

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 7bbeab5 | feat(06-02): add user API functions for profile endpoints | users.ts |
| 9902cb4 | feat(06-02): add React Query hooks for profile data | useProfile.ts, index.ts, users.ts |
| d8e4b98 | feat(06-02): integrate profileStore with API data | profileStore.ts |

---

**Plan Status:** ✅ Complete (3/3 tasks)
**Duration:** 3 minutes
**Next Plan:** 06-03 (Profile Edit UI)
