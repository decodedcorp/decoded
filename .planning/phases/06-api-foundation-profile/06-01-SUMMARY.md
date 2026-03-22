---
phase: 06-api-foundation-profile
plan: 01
subsystem: api-client
tags: [api, authentication, typescript, refactor]

# Dependency graph
requires:
  - "Supabase client for auth token retrieval"
  - "Existing API types and error handling patterns"
provides:
  - "Shared API client with auth injection"
  - "User-related TypeScript types matching OpenAPI spec"
  - "Centralized error handling for all API calls"
affects:
  - "06-02: Profile endpoint implementations will use apiClient"
  - "06-03: User stats/activity endpoints will use apiClient"
  - "Track A/B/C/D: All future API integrations will use this pattern"

# Tech tracking
tech-stack.added:
  - "None (refactored existing patterns)"
tech-stack.patterns:
  - pattern: "Centralized API client with auth injection"
    location: "packages/web/lib/api/client.ts"
    usage: "All authenticated API calls use apiClient({ requiresAuth: true })"
  - pattern: "Generic typed responses"
    usage: "apiClient<ResponseType>(...) provides type safety"

# File tracking
key-files.created:
  - path: "packages/web/lib/api/client.ts"
    purpose: "Shared fetch wrapper with auth and error handling"
    exports: ["apiClient", "getAuthToken", "ApiClientOptions"]
key-files.modified:
  - path: "packages/web/lib/api/types.ts"
    changes: "Added User, UserStats, UserActivity types"
  - path: "packages/web/lib/api/posts.ts"
    changes: "Refactored to use shared apiClient"
  - path: "packages/web/lib/api/index.ts"
    changes: "Re-exports apiClient and types"

# Decisions
decisions:
  - what: "Use single apiClient function with options pattern"
    why: "More flexible than separate functions per HTTP method"
    alternatives: "Separate get/post/patch/delete functions"
  - what: "Keep uploadImage's inline error handling"
    why: "FormData requires special handling with progress callbacks"
    alternatives: "Extend apiClient to support onProgress callback"
  - what: "Auto-inject auth token when requiresAuth: true"
    why: "Eliminates repetitive auth code in every endpoint function"
    impact: "All future endpoints automatically get auth handling"

# Metrics
duration: "3 minutes"
completed: "2026-01-29"
---

# Phase 06 Plan 01: API Client Foundation Summary

**One-liner:** Shared API client with JWT auth injection and typed User interfaces

## What Was Built

Created a reusable API client foundation that eliminates code duplication across all backend API calls:

1. **Shared API Client (`client.ts`)**
   - `apiClient<T>()` function with generic type support
   - Automatic JWT token injection from Supabase session
   - Configurable auth requirement per request
   - Standardized error handling with typed ApiError
   - Support for both JSON and FormData bodies

2. **User-Related Types (`types.ts`)**
   - `UserResponse` - Profile data from /users/me
   - `UpdateUserDto` - Profile update payload
   - `UserStatsResponse` - Stats from /users/me/stats
   - `UserActivityItem` - Activity feed items
   - `PaginatedActivitiesResponse` - Activity list with pagination

3. **Refactored Posts API (`posts.ts`)**
   - Migrated `analyzeImage`, `createPost`, `fetchPosts` to use apiClient
   - Removed duplicate `getAuthToken` and `handleApiError` functions
   - Simplified code from ~50 lines to ~10 lines per function

## Technical Implementation

### API Client Pattern

```typescript
// Authenticated request
const user = await apiClient<UserResponse>({
  path: "/api/v1/users/me",
  method: "GET",
  requiresAuth: true,
});

// Public request with body
const result = await apiClient<AnalyzeResponse>({
  path: "/api/v1/posts/analyze",
  method: "POST",
  body: { image_url: "https://..." },
  requiresAuth: false,
});
```

### Auth Token Flow

1. Check if `requiresAuth: true`
2. Call `getAuthToken()` → retrieves JWT from Supabase session
3. Inject `Authorization: Bearer {token}` header
4. Throw error if no token and auth required

### Error Handling

All non-2xx responses:
1. Parse JSON error body (if available)
2. Extract `message` from ApiError interface
3. Throw Error with descriptive message
4. Fallback to HTTP status text if JSON parsing fails

## Files Changed

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `lib/api/client.ts` | +95 | New shared API client |
| `lib/api/types.ts` | +67 | User-related types |
| `lib/api/posts.ts` | -56 | Refactored to use client |
| `lib/api/index.ts` | +3 | Export apiClient |

**Total:** +109 lines (net reduction after eliminating duplication)

## Verification Results

✅ TypeScript compilation successful (`yarn tsc --noEmit`)
✅ All exports verified (apiClient, UserResponse, UserStatsResponse)
✅ Only one getAuthToken definition (in client.ts)
✅ Posts.ts successfully refactored to use shared client

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing error handling in uploadImage after refactor**
- **Found during:** Task 3 refactor
- **Issue:** uploadImage still referenced removed `handleApiError` function
- **Fix:** Imported ApiError type and added inline error handling
- **Files modified:** packages/web/lib/api/posts.ts
- **Commit:** d4a5272

**Reason:** uploadImage needs special handling for FormData and progress callbacks, so it couldn't use apiClient directly. Error handling was preserved inline.

## Next Phase Readiness

### What's Ready

- ✅ API client pattern established for all future endpoints
- ✅ User types match backend OpenAPI spec
- ✅ Auth injection working with Supabase session
- ✅ Error handling standardized

### What's Needed for Plan 02

1. **Profile Endpoint Functions**
   - Use apiClient pattern established here
   - Import UserResponse, UpdateUserDto types
   - Follow same structure as refactored posts.ts

2. **Test Endpoints Against Backend**
   - Verify https://dev.decoded.style/api/v1 is accessible
   - Confirm OpenAPI spec matches our types
   - Test auth token flow with real Supabase session

### Blockers/Concerns

None - foundation is complete and ready for endpoint implementations.

## Knowledge Transfer

### For Future Claude Sessions

**Context needed:**
- "We have a shared apiClient in lib/api/client.ts that handles auth and errors"
- "All API types are in lib/api/types.ts matching OpenAPI spec"
- "Pattern: apiClient<ResponseType>({ path, method, body?, requiresAuth? })"

**Common tasks:**
- Adding new endpoint: Import apiClient, create typed function
- Adding new types: Add to types.ts with OpenAPI comments
- Debugging auth: Check getAuthToken in client.ts

**Anti-patterns to avoid:**
- ❌ Manually adding Authorization headers (use requiresAuth: true)
- ❌ Custom error handling (apiClient handles it)
- ❌ Duplicate getAuthToken functions (import from client)

---

**Commits:**
- 6af11ff: feat(06-01): create shared API client with auth injection
- 7c0f91e: feat(06-01): add User-related TypeScript types
- 82f995a: refactor(06-01): migrate posts.ts to use shared API client
- d4a5272: fix(06-01): handle error in uploadImage after refactor

**Duration:** 3 minutes
**Status:** ✅ Complete - All tasks passed verification
