---
phase: 06-api-foundation-profile
plan: 03
subsystem: profile-edit
tags: [api, mutation, modal, profile, react-query]
depends_on:
  requires: ["06-01", "06-02"]
  provides: ["Profile edit modal", "updateMe mutation", "useUpdateProfile hook"]
  affects: ["track-a", "track-b"]
tech-stack:
  added: []
  patterns: ["React Query mutations", "Optimistic updates", "Modal with form state"]
key-files:
  created:
    - packages/web/lib/components/profile/ProfileEditModal.tsx
    - packages/web/app/api/v1/users/me/route.ts
  modified:
    - packages/web/lib/api/users.ts
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/components/profile/index.ts
    - packages/web/app/profile/page.tsx
    - packages/web/lib/components/profile/ProfileHeader.tsx
decisions:
  - decision: "Add API proxy route for /api/v1/users/me"
    rationale: "Avoid CORS issues by routing through Next.js API routes"
    date: "2026-01-29"
  - decision: "Sync profileStore on mutation success"
    rationale: "Dual state management: React Query cache + Zustand store for immediate UI updates"
    date: "2026-01-29"
metrics:
  duration: "~10 minutes"
  tasks_completed: 4
  files_changed: 7
  commits: 5
  completed: "2026-01-29"
verification:
  status: "pending"
  reason: "Backend database connection error - verification deferred"
  note: "Code complete, awaiting backend fix for human verification"
---

# Phase 06 Plan 03: Profile Edit UI Summary

**One-liner:** Profile edit modal with mutation hooks and API proxy for CORS-free profile updates

## What Was Built

Implemented complete profile editing functionality allowing users to modify their display_name, bio, and avatar_url.

### Core Deliverables

1. **API Mutation Function** (`packages/web/lib/api/users.ts`)
   - `updateMe(data: UpdateUserDto)`: PATCH /api/v1/users/me
   - Uses shared apiClient with auth injection

2. **React Query Mutation Hook** (`packages/web/lib/hooks/useProfile.ts`)
   - `useUpdateProfile()`: Mutation hook with cache invalidation
   - Syncs profileStore on success for immediate UI updates

3. **ProfileEditModal Component** (`packages/web/lib/components/profile/ProfileEditModal.tsx`)
   - Form fields: display_name, bio, avatar_url
   - Avatar preview with fallback
   - Client-side validation (min 2 chars for name, max 200 for bio)
   - Loading states and toast notifications
   - Animated modal with backdrop click to close

4. **API Proxy Route** (`packages/web/app/api/v1/users/me/route.ts`)
   - GET and PATCH handlers
   - Forwards requests to backend API
   - Handles auth header passthrough

5. **ProfileHeader Integration** (`packages/web/lib/components/profile/ProfileHeader.tsx`)
   - Added `onEditClick` prop
   - Settings button now opens edit modal

6. **Profile Page Wiring** (`packages/web/app/profile/page.tsx`)
   - Modal state management
   - ProfileEditModal rendered with open/close handlers

## Technical Implementation

### Mutation with Cache Sync

```typescript
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUserFromApi } = useProfileStore();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateMe(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.setQueryData(profileKeys.me(), updatedUser);
      setUserFromApi(updatedUser); // Sync Zustand store
    },
  });
}
```

### API Proxy Pattern

```typescript
// Next.js API route proxies to backend
const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: authHeader,
  },
  body: JSON.stringify(body),
});
```

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| PROF-02: Edit profile | ✅ Code Complete | ProfileEditModal + useUpdateProfile |

## Verification Status

**Status:** ⚠️ Pending

**Reason:** Backend database connection error prevented human verification testing.

**What's Verified:**
- Code compiles without TypeScript errors
- All exports present and correct
- Component renders without errors

**Pending Verification:**
- Modal opens from settings button
- Form pre-fills with current data
- Save persists changes to backend
- UI updates immediately after save

**Action Required:** Re-test when backend DB connection is restored.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| abe47e0 | feat(06-03): add updateMe mutation to API and hooks | users.ts, useProfile.ts |
| 62f5b38 | feat(06-03): create ProfileEditModal component | ProfileEditModal.tsx, index.ts |
| 00cd093 | feat(06-03): wire up ProfileHeader to open edit modal | page.tsx, ProfileHeader.tsx |
| 7cc63b0 | fix(06-03): add API proxy routes to avoid CORS issues | route.ts |
| e6806b1 | feat(06-03): sync profileStore on profile update | useProfile.ts |

---

**Plan Status:** ✅ Code Complete (Verification Pending)
**Duration:** ~10 minutes
**Next:** Phase 6 complete → Parallel Tracks A-D
