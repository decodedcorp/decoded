# Phase 42: Mutation Migration and Cache Wiring - Research

**Researched:** 2026-03-23
**Domain:** React Query mutation hooks, Orval-generated mutations, Zustand store sync, cache invalidation
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-05 | Mutation hook migration — POST/PATCH/DELETE + onSuccess cache invalidation | All manual `useMutation` wrappers map 1:1 to generated hooks; onSuccess logic must stay in call site wrappers |
| MIG-06 | Zustand store sync in mutation onSuccess (useUpdateProfile preserves store update) | `useUpdateProfile` must switch mutationFn to generated `useUpdateMyProfile`; store sync pattern already established |
| MIG-07 | Delete `lib/api/client.ts`, `lib/api/*.ts`, `lib/hooks/*.ts` wrapper files | After mutation migration, `comments.ts`, `spots.ts`, `solutions.ts`, `posts.ts` (mutation functions only) and `client.ts` can be deleted |
| MIG-09 | Document Supabase direct query vs Orval query cache invalidation boundary | Three coexisting data sources identified with clear boundary rules |

</phase_requirements>

## Summary

Phase 41 completed all READ hook migrations, deleted `types.ts`, and left four manual API files (`comments.ts`, `spots.ts`, `solutions.ts`, `posts.ts`) containing only mutation functions. These files all depend on `lib/api/client.ts`. Phase 42 replaces every remaining manual `useMutation` wrapper in the hook files with generated counterparts, wires `onSuccess` cache invalidation at the call site level, and then deletes the now-empty manual API files along with `client.ts`.

The primary complication is the `useUpdateProfile` mutation: its current implementation calls Supabase `auth.updateUser()` directly (not a REST API call), and Phase 41 noted this as the path to replace with the generated `useUpdateMyProfile` REST hook. The generated hook calls `PATCH /api/v1/users/me` with `UpdateUserDto`. The Zustand store sync in `onSuccess` must be preserved exactly.

A secondary complication is `ManualUpdateSolutionDto` vs generated `UpdateSolutionDto`. The generated DTO only has `{description, metadata, title}`. The manual DTO has `{product_url, product_name, brand, price, currency, image_url}`. These are genuinely different shapes — the backend may have a different contract for the PATCH endpoint than what the spec exposes. This must be verified before migrating `useUpdateSolution`.

**Primary recommendation:** Migrate mutations domain by domain (comments → spots → solutions → posts → users), fix the `setQueryData<any>` placeholders left in Phase 41, then delete manual files once no imports remain.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.x (project-installed) | `useMutation` call site wrappers with `onSuccess` | Already in use throughout the project |
| Orval generated hooks | v8.5.3 codegen | Generated `useMutation` functions wrapping `customInstance` | Replace manual `apiClient` calls |
| Zustand | project-installed | `useProfileStore.getState().setUserFromApi()` in onSuccess | Already established store sync pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `customInstance` (mutator) | project-local | Axios wrapper with Supabase JWT + Next.js proxy routing | Called by all generated mutations automatically |
| `queryClient.invalidateQueries` | TanStack Query | Cache invalidation in `onSuccess` | After every mutation that changes list/detail data |
| `queryClient.setQueryData` | TanStack Query | Optimistic cache update | When mutation returns the new entity directly |
| `queryClient.removeQueries` | TanStack Query | Remove stale cache entries | On DELETE mutations |

**Installation:** No new packages needed — all are already installed.

## Architecture Patterns

### Recommended Project Structure

The existing structure stays intact. Files to DELETE at end of Phase 42:

```
packages/web/lib/api/
├── client.ts           <- DELETE after all mutation calls migrated
├── comments.ts         <- DELETE after useComments.ts migrated
├── spots.ts            <- DELETE after useSpots.ts migrated
├── solutions.ts        <- DELETE after useSolutions.ts migrated
├── posts.ts            <- PARTIAL DELETE: remove updatePost/deletePost only
│                          (uploadImage, createPost*, fetchPostMagazine, fetchPostsServer stay)
├── mutation-types.ts   <- STAYS (used by non-migratable code paths)
├── index.ts            <- STAYS (re-exports mutation-types and upload functions)
└── generated/          <- STAYS (never edited)
```

### Pattern 1: Generated Mutation Hook Wrapping — onSuccess at Call Site

All generated mutations use a discriminated `options.mutation` parameter pattern. The `onSuccess` and cache invalidation belong in the wrapper hook, NOT passed into the generated hook's options:

```typescript
// CORRECT: onSuccess in the wrapper useMutation call
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  // Import generated hook
  return useCreateCommentGenerated({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
      },
    },
  });
}
```

Alternatively (and equivalently), keep the existing `useMutation` wrapper and just replace the `mutationFn` body to call the generated raw function instead of the manual `apiClient` function:

```typescript
// ALSO CORRECT: replace mutationFn only, keep onSuccess structure unchanged
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) =>
      createCommentGenerated(postId, dto),  // generated raw fn instead of apiClient
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}
```

The second pattern (replace `mutationFn`, keep `onSuccess` intact) is SAFER because it minimizes diff surface, keeps existing cache key logic, and avoids needing to thread `postId` through generated hook options.

### Pattern 2: Generated Mutation Variables Shape

Generated mutation hooks wrap variables in an object. The raw generated function signatures differ from the `apiClient` wrappers. Key shapes:

| Endpoint | Generated raw fn signature | Generated hook variables type |
|----------|---------------------------|-------------------------------|
| `POST /posts/{id}/spots` | `createSpot(postId, createSpotDto)` | `{postId: string; data: BodyType<CreateSpotDto>}` |
| `PATCH /spots/{id}` | `updateSpot(spotId, updateSpotDto)` | `{spotId: string; data: BodyType<UpdateSpotDto>}` |
| `DELETE /spots/{id}` | `deleteSpot(spotId)` | `{spotId: string}` |
| `POST /posts/{id}/comments` | `createComment(postId, createCommentDto)` | `{postId: string; data: BodyType<CreateCommentDto>}` |
| `DELETE /comments/{id}` | `deleteComment(commentId)` | `{commentId: string}` |
| `POST /spots/{id}/solutions` | `createSolution(spotId, createSolutionDto)` | `{spotId: string; data: BodyType<CreateSolutionDto>}` |
| `PATCH /solutions/{id}` | `updateSolution(solutionId, updateSolutionDto)` | `{solutionId: string; data: BodyType<UpdateSolutionDto>}` |
| `DELETE /solutions/{id}` | `deleteSolution(solutionId)` | `{solutionId: string}` |
| `PATCH /api/v1/users/me` | `updateMyProfile(updateUserDto)` | `{data: BodyType<UpdateUserDto>}` |
| `PATCH /posts/{id}` | `updatePost(postId, updatePostDto)` | `{postId: string; data: BodyType<UpdatePostDto>}` |
| `DELETE /posts/{id}` | `deletePost(postId)` | `{postId: string}` |

When calling the raw function directly in a `mutationFn`, import from `generated/X/x` (not the hook). This avoids the wrapping:

```typescript
// import the raw function, not the hook
import {
  createComment as createCommentGenerated,
} from "@/lib/api/generated/comments/comments";

// mutationFn becomes:
mutationFn: ({ postId, dto }: { postId: string; dto: CreateCommentDto }) =>
  createCommentGenerated(postId, dto)
```

### Pattern 3: Zustand Store Sync in useUpdateProfile

The `useUpdateProfile` mutation currently calls Supabase `auth.updateUser()` directly. Phase 42 MUST replace this with the REST call while preserving the `onSuccess` store sync:

```typescript
// AFTER migration — mutationFn calls generated REST endpoint
import { updateMyProfile } from "@/lib/api/generated/users/users";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateMyProfile(data),
    onSuccess: (updatedUser) => {
      // Preserve React Query cache update
      queryClient.setQueryData(profileKeys.me(), updatedUser);

      // Preserve Zustand store sync — this is the critical side-effect
      import("@/lib/stores/profileStore").then(({ useProfileStore }) => {
        useProfileStore.getState().setUserFromApi(updatedUser);
      });

      // Preserve background refetch
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    onError: (error) => {
      console.error("[useUpdateProfile] Failed to update profile:", error);
    },
  });
}
```

The `rank: null as any` hack in the inlined `updateMe` function disappears because the generated `PATCH /api/v1/users/me` returns a real `UserResponse` from the backend.

### Pattern 4: setQueryData Type Fix (Spot Mutations)

Phase 41 left `setQueryData<any>` in `useCreateSpot`, `useUpdateSpot`, `useDeleteSpot` because the cache now holds `SpotListItem[]` (from generated read hook) but mutation functions return `Spot` (manual type). After migration, the generated `createSpot` returns `SpotResponse` and `updateSpot` returns `SpotResponse`. The `SpotListItem` and `SpotResponse` have different shapes, so `invalidateQueries` is safer than `setQueryData` for spot mutations:

```typescript
// Replace setQueryData<any> with simple invalidation
onSuccess: (_, { postId }) => {
  queryClient.invalidateQueries({ queryKey: spotKeys.list(postId) });
},
```

### Pattern 5: Cache Boundary Documentation

Three coexisting data sources with distinct cache key namespaces:

| Layer | What it queries | Cache keys | Invalidation |
|-------|----------------|------------|-------------|
| **Orval generated hooks** | REST API via `customInstance` | Generated keys (e.g., `/api/v1/posts/{id}/spots`) + overridden project keys (e.g., `spotKeys.list(postId)`) | `queryClient.invalidateQueries({queryKey: spotKeys.list(postId)})` |
| **Supabase direct queries** | Supabase client (PostgREST) | Manual keys (e.g., `postKeys.detail(id)`, `fetchPostWithSpotsAndSolutions`) | Independent — REST mutations do NOT invalidate Supabase cache |
| **Server-only fetches** | `fetchPostsServer` in posts.ts | N/A (server component, no cache key) | Next.js `next: {revalidate: 60}` header only |

**Critical boundary rule:** REST mutations (`useCreateSpot`, etc.) only invalidate REST query cache keys. Supabase queries (`usePostById` via `fetchPostWithSpotsAndSolutions`) are NOT invalidated when REST mutations succeed. This is by design — the two data paths serve different UI features and do not share cache.

The known cross-boundary case: `useAdoptSolution`/`useUnadoptSolution` already invalidate `["posts", "detail"]` which is the Supabase-based `usePostById` key. This pattern must be preserved after migration.

### Anti-Patterns to Avoid

- **Removing onSuccess from hook wrappers:** Generated hooks accept `mutation.onSuccess` but the pattern in this codebase is to own `onSuccess` in the wrapper. Don't delete existing invalidation logic.
- **Direct import of generated hook instead of raw function in useMutation:** If you keep the manual `useMutation` wrapper, import the raw function (e.g., `createSpot` from generated) not the generated hook (e.g., `useCreateSpot` from generated). Hooks cannot be used outside React components.
- **Using setQueryData with type mismatch:** Mutations return `SpotResponse`, cache holds `SpotListItem[]`. Use `invalidateQueries` unless shapes are structurally compatible.
- **Deleting posts.ts before extracting non-mutation code:** `posts.ts` contains `uploadImage`, `createPost`, `createPostWithFile`, `createPostWithFileAndSolutions`, `fetchPostMagazine`, `fetchPostsServer` — these are NOT migratable (binary upload, server-side, no generated equivalent). Only `updatePost` and `deletePost` are replaced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP mutation with auth | Manual `apiClient({ path, method, body, requiresAuth })` | Generated mutation raw fn via `customInstance` | customInstance already handles Supabase JWT + proxy routing |
| Response type casting | `apiClient<ManualType>(...)` | Generated fn returns typed `SpotResponse`/`SolutionResponse` etc. | OpenAPI spec types are authoritative |
| Cache invalidation after mutation | Custom cache update logic | `queryClient.invalidateQueries({ queryKey: ... })` | TanStack Query manages stale/refetch lifecycle |

## Common Pitfalls

### Pitfall 1: ManualUpdateSolutionDto vs Generated UpdateSolutionDto Shape Mismatch

**What goes wrong:** Generated `UpdateSolutionDto` only has `{description, metadata, title}`. The manual `ManualUpdateSolutionDto` used by `useUpdateSolution` has `{product_url, product_name, brand, price, currency, image_url}` — completely different fields.

**Why it happens:** The OpenAPI spec's `UpdateSolutionDto` may not reflect the full backend contract for PATCH /api/v1/solutions/{id}. The spec was generated from utoipa annotations, and the backend may accept more fields than the spec documents.

**How to avoid:** Before migrating `useUpdateSolution`:
1. Check if the backend actually accepts `product_url`, `brand`, etc. via PATCH /solutions/{id} (look at the Axum handler)
2. If yes: the OpenAPI spec is incomplete — use `ManualUpdateSolutionDto` and pass it via `customInstance` directly (or keep using `apiClient` for this one mutation)
3. If no: the active UI does not actually use those fields — switch to generated `UpdateSolutionDto`

**Warning signs:** TypeScript error when trying to pass `ManualUpdateSolutionDto` to generated `updateSolution()` which expects `UpdateSolutionDto`.

### Pitfall 2: SpotResponse vs SpotListItem in setQueryData

**What goes wrong:** `useCreateSpot` optimistic update tries `setQueryData(spotKeys.list(postId), [...old, newSpot])` where `newSpot` is `SpotResponse` (from generated mutation) but the cache holds `SpotListItem[]`. Types are structurally incompatible (`SpotResponse` lacks `solution_count`, has `status`, `user_id`).

**Why it happens:** Phase 41 left `setQueryData<any>` as a placeholder. The shapes differ because `SpotListItem` is the GET list shape and `SpotResponse` is the POST/PATCH shape.

**How to avoid:** Replace `setQueryData` with `invalidateQueries` for spot mutations. The extra network round-trip is acceptable — optimistic updates require compatible types.

### Pitfall 3: Deleting client.ts While Non-Mutation Code Still Uses It

**What goes wrong:** `posts.ts` functions (`uploadImage`, `fetchPostMagazine`, etc.) still call `apiClient` from `client.ts`. Deleting `client.ts` before cleaning up these non-mutation functions breaks the upload flow.

**Why it happens:** `posts.ts` cannot be fully deleted — only `updatePost` and `deletePost` are migratable. The remaining functions use `apiClient` or raw `fetch` with `getAuthToken`.

**How to avoid:** Delete `client.ts` only in the FINAL plan step after verifying zero remaining imports with grep. The deletion sequence must be: migrate mutations → clean non-mutation exports from `index.ts` → delete API stub files → delete `client.ts` only when `grep -r "from.*client"` returns 0 results in lib/ and app/.

### Pitfall 4: useUpdateProfile Still Uses Supabase auth.updateUser After Migration

**What goes wrong:** The migrated `useUpdateProfile` appears to work (TypeScript passes) but actually calls Supabase auth metadata update instead of the REST backend. The profile change persists in auth metadata but not in the backend user table.

**Why it happens:** The inline `updateMe` function in `useProfile.ts` was deliberately kept from the deleted `users.ts` as a temporary measure. It calls `supabaseBrowserClient.auth.updateUser()`, not the REST API.

**How to avoid:** In Plan 42-01 or 42-02, replace the inlined `updateMe` call with the generated `updateMyProfile` raw function. The generated function calls `PATCH /api/v1/users/me` which updates the backend user table. The `rank: null as any` hack disappears automatically.

### Pitfall 5: Comments Manual Types Still Defined in comments.ts

**What goes wrong:** After deleting `comments.ts`, anything importing `CommentUser`, `CommentResponse`, or `CreateCommentDto` from `@/lib/api/comments` breaks.

**Why it happens:** `comments.ts` still defines its own `CommentUser`, `CommentResponse`, `CreateCommentDto` interfaces. Phase 41 migrated the read hook to use generated `CommentResponse` but the mutation hooks in `useComments.ts` still import `CreateCommentDto` from `@/lib/api/comments`.

**How to avoid:** Before deleting `comments.ts`, update `useComments.ts` to import `CreateCommentDto` from `@/lib/api/generated/models`. The generated `CreateCommentDto` has `{content: string; parent_id?: string | null}` which is structurally identical to the manual version.

## Code Examples

Verified patterns from official sources:

### Replacing Manual Mutation with Generated Raw Function

```typescript
// BEFORE (Phase 41 state — still uses manual apiClient wrapper)
import { createComment, type CreateCommentDto } from "@/lib/api/comments";

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createComment(postId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}

// AFTER (Phase 42 — uses generated raw function, manual import removed)
import {
  createComment as createCommentGenerated,
} from "@/lib/api/generated/comments/comments";
import type { CreateCommentDto } from "@/lib/api/generated/models";

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createCommentGenerated(postId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}
```

### Wiring useUpdateProfile to Generated REST Mutation

```typescript
// AFTER migration — replaces Supabase auth.updateUser with REST
import { updateMyProfile } from "@/lib/api/generated/users/users";
import type { UpdateUserDto } from "@/lib/api/generated/models";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateMyProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(profileKeys.me(), updatedUser);
      import("@/lib/stores/profileStore").then(({ useProfileStore }) => {
        useProfileStore.getState().setUserFromApi(updatedUser);
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    onError: (error) => {
      console.error("[useUpdateProfile] Failed to update profile:", error);
    },
  });
}
```

### Cache Boundary Documentation Comment (for mutation-boundary.ts or inline)

```typescript
/**
 * Cache Invalidation Boundaries — Phase 42 documented
 *
 * REST API cache (Orval generated hooks):
 *   - Keys: spotKeys, solutionKeys, commentKeys, postKeys (list), profileKeys
 *   - Invalidated by: REST mutations (useCreateSpot, useUpdateSolution, etc.)
 *   - NOT invalidated by: Supabase direct queries
 *
 * Supabase direct query cache:
 *   - Keys: postKeys.detail(id) via fetchPostWithSpotsAndSolutions
 *   - Invalidated by: useAdoptSolution / useUnadoptSolution (explicit cross-boundary invalidation)
 *   - NOT invalidated by: general REST mutations
 *
 * Server-side fetches (posts.ts fetchPostsServer):
 *   - No React Query cache — uses Next.js revalidate header
 *   - NOT invalidated by client mutations
 */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `apiClient({ path, method, body })` | `customInstance(axiosRequestConfig)` | Phase 40 | Auth handled in mutator, not per-call |
| Manual `UpdateUserDto` (Supabase metadata) | Generated `UpdateUserDto` (backend REST) | Phase 42 | Profile updates go to backend, not Supabase auth |
| `setQueryData<any>` on spot mutations | `invalidateQueries` | Phase 42 | Type safety restored, no optimistic hacks |
| Manual `types.ts` as type source | `generated/models` as source of truth | Phase 41 | Types match OpenAPI spec |

**Deprecated/outdated:**
- `lib/api/client.ts` `apiClient()` function: Replaced by generated `customInstance` mutator. Will be deleted in Phase 42.
- `lib/api/comments.ts`, `spots.ts`, `solutions.ts` mutation functions: Replaced by generated raw functions. Will be deleted after migration.
- `updateMe` inlined in `useProfile.ts`: Temporary from Phase 41. Will be replaced by `updateMyProfile` from generated users.

## Open Questions

1. **ManualUpdateSolutionDto vs UpdateSolutionDto backend contract**
   - What we know: Generated `UpdateSolutionDto = {description, metadata, title}`. Manual `ManualUpdateSolutionDto = {product_url, product_name, brand, price, currency, image_url}`.
   - What's unclear: Does the backend Axum handler for `PATCH /api/v1/solutions/{id}` actually accept `product_url` and friends? Or are those legacy fields?
   - Recommendation: Check `packages/api-server/` handler before migrating. If backend accepts both shape variants, the OpenAPI spec is incomplete and this mutation must keep using `apiClient` with `ManualUpdateSolutionDto`. If the fields are unused/legacy, switch to generated `UpdateSolutionDto`.

2. **`createPost` / `createPostWithSolution` in posts.ts**
   - What we know: These use `apiClient` and have complex business logic in `useCreatePost.ts`. There is no generated `useCreatePost` hook (POST /api/v1/posts endpoint exists but is a multipart/JSON hybrid).
   - What's unclear: Whether MIG-05 intends to migrate these specific POST endpoints or only standard CRUD mutations.
   - Recommendation: Keep `createPost`, `createPostWithSolution`, `createPostWithFile`, `createPostWithFileAndSolutions` in `posts.ts`. They fall under the same exclusion as upload endpoints. Only migrate `updatePost` and `deletePost`.

## Validation Architecture

> `workflow.nyquist_validation` is not set in config.json — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in packages/web |
| Config file | None — see Wave 0 |
| Quick run command | `bunx tsc --noEmit` (type check only) |
| Full suite command | `bunx tsc --noEmit` (no test runner configured) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-05 | All POST/PATCH/DELETE hooks call generated raw functions | type-check | `bunx tsc --noEmit` | ✅ (TypeScript validates import graph) |
| MIG-06 | useUpdateProfile onSuccess still calls profileStore.setUserFromApi | manual-only | N/A | ❌ Wave 0 |
| MIG-07 | lib/api/client.ts and lib/api/*.ts wrapper files deleted | grep check | `grep -r "from.*@/lib/api/client" packages/web/lib packages/web/app` | ✅ (grep is the check) |
| MIG-09 | Cache boundary documented and queryClient.invalidateQueries placed correctly | manual-only | N/A | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `bunx tsc --noEmit` in `packages/web/`
- **Per wave merge:** `bunx tsc --noEmit` + `grep` for deleted import paths
- **Phase gate:** TypeScript exits 0 + all deleted file paths return 0 grep matches

### Wave 0 Gaps
- [ ] No automated test for Zustand store sync behavior — manual UI verification required: update profile, confirm header avatar changes immediately
- [ ] No automated test for cache invalidation correctness — manual verification: create spot, confirm list refreshes

*(No test framework to install — project uses TypeScript type-checking as the sole automated correctness tool)*

## Sources

### Primary (HIGH confidence)
- `packages/web/lib/api/generated/spots/spots.ts` — generated mutation hook signatures verified directly
- `packages/web/lib/api/generated/solutions/solutions.ts` — generated mutation hook signatures verified directly
- `packages/web/lib/api/generated/comments/comments.ts` — generated mutation hook signatures verified directly
- `packages/web/lib/api/generated/users/users.ts` — `useUpdateMyProfile` and `updateMyProfile` signature verified
- `packages/web/lib/api/generated/posts/posts.ts` — `useDeletePost`, `useUpdatePost` signatures verified
- `packages/web/lib/api/generated/models/updateSolutionDto.ts` — confirmed shape `{description, metadata, title}` only
- `packages/web/lib/api/generated/models/spotResponse.ts` — confirmed `SpotResponse` differs from `SpotListItem`
- `.planning/phases/41-read-hook-migration/41-02-SUMMARY.md` — `setQueryData<any>` placeholder documented
- `.planning/phases/41-read-hook-migration/41-03-SUMMARY.md` — `updateMe` inlined decision documented
- `.planning/phases/41-read-hook-migration/41-04-SUMMARY.md` — `ManualUpdateSolutionDto` divergence documented

### Secondary (MEDIUM confidence)
- Current state of `packages/web/lib/hooks/useProfile.ts` — `useUpdateProfile` + `updateMe` inline verified
- Current state of `packages/web/lib/hooks/useSpots.ts` — `setQueryData<any>` placeholders confirmed
- Current state of `packages/web/lib/api/index.ts` — what is still exported confirmed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from installed packages and existing usage
- Architecture: HIGH — generated file shapes verified by reading actual generated code
- Pitfalls: HIGH — ManualUpdateSolutionDto mismatch verified from generated model file; other pitfalls from Phase 41 SUMMARY decisions

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable codebase, generated files regenerated on API change)
