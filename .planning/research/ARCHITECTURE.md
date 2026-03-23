# Architecture Research

**Domain:** Type-safe API client generation (Orval + Zod) integrated into existing Next.js monorepo
**Researched:** 2026-03-23
**Confidence:** HIGH (Orval v8.5.3 official docs verified, existing codebase read directly)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI Layer (React Components)                 │
│  lib/components/[feature]/   app/[route]/                        │
│  Components consume hooks exactly as today — NO component changes│
├─────────────────────────────────────────────────────────────────┤
│                     Hook Layer (React Query)                     │
├────────────────────────────┬────────────────────────────────────┤
│  EXISTING (keep as-is)     │  GENERATED (new, replace gradually) │
│  lib/hooks/useProfile.ts   │  lib/api/generated/               │
│  lib/hooks/usePosts.ts     │    posts/posts.ts   (hooks)        │
│  lib/hooks/useImages.ts    │    users/users.ts   (hooks)        │
│  lib/hooks/useSpots.ts     │    spots/spots.ts   (hooks)        │
│  lib/hooks/useComments.ts  │    solutions/...    (hooks)        │
│  ...                       │  lib/api/generated/model/          │
│                            │    post.ts  user.ts  spot.ts       │
│                            │  lib/api/generated/zod/            │
│                            │    posts.zod.ts  users.zod.ts      │
├────────────────────────────┴────────────────────────────────────┤
│                   API Client / Mutator Layer                     │
├────────────────────────────┬────────────────────────────────────┤
│  EXISTING (deprecate after │  NEW (single mutator for all        │
│  migration per domain)     │  generated hooks)                   │
│  lib/api/client.ts         │  lib/api/mutator.ts                │
│  lib/api/posts.ts          │    - Next.js proxy-aware            │
│  lib/api/users.ts          │    - Supabase JWT injection         │
│  lib/api/badges.ts ...     │    - Shared error handling          │
├────────────────────────────┴────────────────────────────────────┤
│               Next.js API Proxy Layer (completely unchanged)     │
│  app/api/v1/posts/route.ts   app/api/v1/users/route.ts          │
│  app/api/v1/spots/route.ts   app/api/v1/admin/...               │
│  All proxy routes stay — they are the stable URL contract        │
├─────────────────────────────────────────────────────────────────┤
│             State Layer (Zustand — completely unchanged)          │
│  lib/stores/authStore.ts   lib/stores/behaviorStore.ts           │
│  lib/stores/vtonStore.ts   lib/stores/magazineStore.ts           │
│  Zustand stores never call API directly; unchanged in v9.0       │
└─────────────────────────────────────────────────────────────────┘
                    ↕ proxy forwards to
┌─────────────────────────────────────────────────────────────────┐
│             Backend: packages/api-server (Rust/Axum)            │
│             OpenAPI spec at https://dev.decoded.style            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Change in v9.0 |
|-----------|---------------|----------------|
| `lib/api/generated/` | Orval-generated React Query hooks + model types | NEW — produced by codegen |
| `lib/api/generated/model/` | TypeScript type definitions generated from OpenAPI schemas | NEW — replaces `lib/api/types.ts` |
| `lib/api/generated/[tag]/[tag].zod.ts` | Zod validation schemas per domain | NEW — used for request body validation |
| `lib/api/mutator.ts` | Shared fetch wrapper injected into all generated hooks | NEW — replaces per-file auth logic |
| `orval.config.ts` | Orval code generation configuration | NEW in `packages/web/` |
| `lib/api/client.ts` | Existing manual apiClient fetch wrapper | KEEP during migration; delete after |
| `lib/api/posts.ts` etc. | Manual API function files per domain | DEPRECATE per domain; delete after migration |
| `lib/api/types.ts` | Manual TypeScript DTO types | DEPRECATE; delete after model/ replaces it |
| `lib/hooks/` | Existing React Query hooks | KEEP during migration; replace one domain at a time |
| `app/api/v1/` | Next.js proxy routes | UNCHANGED — generated hooks call same `/api/v1/*` URLs |
| `lib/stores/` | Zustand client state | UNCHANGED — no API calls inside stores |

## Recommended Project Structure

```
packages/web/
├── orval.config.ts                  # NEW: Orval generation config (root of packages/web)
├── lib/
│   ├── api/
│   │   ├── generated/               # NEW: Orval output directory — ADD TO .gitignore
│   │   │   ├── model/               # Generated TypeScript types (one file per schema)
│   │   │   │   ├── post.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── spot.ts
│   │   │   │   ├── solution.ts
│   │   │   │   └── index.ts         # Barrel export
│   │   │   ├── posts/               # Generated hooks per tag (tags-split mode)
│   │   │   │   ├── posts.ts         # useGetPosts, useCreatePost, useDeletePost...
│   │   │   │   └── posts.zod.ts     # Zod schemas for posts requests/responses
│   │   │   ├── users/
│   │   │   │   ├── users.ts
│   │   │   │   └── users.zod.ts
│   │   │   ├── spots/
│   │   │   │   ├── spots.ts
│   │   │   │   └── spots.zod.ts
│   │   │   ├── solutions/
│   │   │   ├── badges/
│   │   │   ├── rankings/
│   │   │   ├── admin/
│   │   │   └── index.ts             # Barrel export for all generated code
│   │   ├── mutator.ts               # NEW: shared fetch mutator for generated hooks
│   │   ├── client.ts                # EXISTING: keep during migration
│   │   ├── posts.ts                 # EXISTING: deprecate after posts/ migrated
│   │   ├── users.ts                 # EXISTING: deprecate after users/ migrated
│   │   ├── types.ts                 # EXISTING: deprecate after model/ replaces it
│   │   └── index.ts                 # Update exports as migration progresses
│   └── hooks/
│       ├── usePosts.ts              # EXISTING: thin wrapper or swap queryFn
│       ├── useProfile.ts            # EXISTING: thin wrapper or swap queryFn
│       └── ...                      # Swap per domain; delete wrappers when stable
```

### Structure Rationale

- **`lib/api/generated/` in `packages/web/` — not `packages/shared/`:** Generated hooks depend on `@tanstack/react-query`. React Query hooks require a `QueryClientProvider` in the component tree. The mobile app (Expo 54) has a different React Query setup, and sharing hooks across packages causes the documented "No QueryClient set" error (TanStack/query issues #3595, #7965). The mobile app also uses React Native — web-specific patterns (`window.location.origin`, Next.js proxy cookies) cannot be shared. Keep generated code colocated with the consuming app.

- **`tags-split` mode:** One folder per OpenAPI tag with separate files for hooks and Zod schemas. Keeps domains independently navigable. Avoids a single giant file that is impossible to diff during code review.

- **`lib/api/mutator.ts` as the single auth layer:** All generated hooks share one custom mutator. This replaces the per-file auth logic spread across `client.ts`, `posts.ts`, and `users.ts`. The existing `client.ts` pattern (check session, inject `Authorization: Bearer`) is preserved exactly.

- **`lib/api/generated/` gitignored:** Generated files must not be committed. They are produced at build/pre-push time from the OpenAPI spec. Committing them creates stale drift risk — when the backend changes a field, TypeScript would still compile against the stale type.

## Architectural Patterns

### Pattern 1: Custom Fetch Mutator (Auth Injection)

**What:** A single function that Orval injects into every generated hook as the HTTP transport. It handles JWT retrieval from Supabase, the Next.js proxy base URL, and error normalization. This directly replaces the logic in `lib/api/client.ts:apiClient()`.

**When to use:** Required. This is the primary integration point between Orval-generated code and the existing Supabase auth system.

**Trade-offs:** Centralizes auth in one place (good). The mutator runs on every request including public ones — the Supabase `getSession()` call adds a small async overhead. Acceptable given the existing code already does this on every request.

**Example:**
```typescript
// lib/api/mutator.ts
import { supabaseBrowserClient } from "@/lib/supabase/client";

export interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  data?: unknown;
  signal?: AbortSignal;
}

export const decodedFetcher = async <T>(config: RequestConfig): Promise<T> => {
  const { url, method, params, headers = {}, data, signal } = config;

  // Inject Supabase JWT — same as existing lib/api/client.ts:getAuthToken()
  const { data: { session } } = await supabaseBrowserClient.auth.getSession();
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  // Build URL with query params (Orval passes params separately from the URL)
  // Use relative URL so requests route through Next.js proxy (avoids CORS)
  const fullUrl = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        fullUrl.searchParams.set(k, String(v));
      }
    });
  }

  const response = await fetch(fullUrl.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message ?? `API Error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};
```

```typescript
// packages/web/orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  "decoded-api": {
    input: {
      // Download spec from backend at codegen time; or use local file during dev
      target: "https://dev.decoded.style/api-docs/openapi.json",
    },
    output: {
      mode: "tags-split",               // One folder per OpenAPI tag
      target: "lib/api/generated",      // Hooks go here
      schemas: "lib/api/generated/model", // TypeScript types go here
      client: "react-query",
      httpClient: "fetch",              // Use fetch (not axios) to match existing code
      clean: true,                      // Delete stale generated files on each run
      prettier: true,                   // Format output (uses packages/web/.prettierrc)
      override: {
        mutator: {
          path: "lib/api/mutator.ts",
          name: "decodedFetcher",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,                 // Include AbortSignal for request cancellation
          options: {
            staleTime: 60000,           // 1 minute — matches existing hooks
            gcTime: 300000,             // 5 minutes — matches existing hooks
          },
        },
        zod: {
          generate: {
            response: true,             // Validate API responses at runtime
            body: true,                 // Validate request bodies before send
          },
        },
      },
    },
  },
});
```

### Pattern 2: Thin Wrapper Migration (Existing Hook Preservation)

**What:** During migration, keep `lib/hooks/` hooks but replace their `queryFn` with calls to generated API functions rather than manual `lib/api/` functions. Components continue using the same hook API — zero component changes.

**When to use:** For hooks with business logic beyond a raw fetch: `useInfinitePosts` (page mapping), `useCreatePost` (multi-step), `useTrackDwellTime` (side effects). Generated hooks are pure API wrappers; the mapping logic stays in the existing hook.

**Trade-offs:** Maintains backward compatibility, allows domain-by-domain rollout. Thin redundancy during migration is acceptable. Remove wrappers after validation is complete.

**Example:**
```typescript
// lib/hooks/usePosts.ts — AFTER swapping queryFn (thin wrapper)

// Previously: import { fetchPosts } from "@/lib/api/posts"
// After:      import the raw fetch function from generated code
import { getPostsQueryOptions } from "@/lib/api/generated/posts/posts";

export function useInfinitePosts(params: UseInfinitePostsParams) {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite", params],
    queryFn: async ({ pageParam }) => {
      // Use generated queryFn internally; keep custom page-mapping logic
      const response = await getPostsQueryOptions({ page: pageParam as number, ...mappedParams }).queryFn!();
      return {
        items: response.data,
        currentPage: response.pagination.current_page,
        hasMore: response.pagination.current_page < response.pagination.total_pages,
      };
    },
    // ... rest of infinite query config
  });
}
```

### Pattern 3: Zod Runtime Validation at Mutation Boundary

**What:** Use generated Zod schemas to validate user-supplied request bodies before they leave the component. Responses are already typed by TypeScript — runtime Zod validation of responses is optional.

**When to use:** For mutation hooks (POST/PATCH) where user input is involved. Catches malformed form data before a network round-trip. Not needed for GET hooks where TypeScript types suffice.

**Trade-offs:** Adds a parse step on each mutation. Cost is negligible for form submissions. Do not use for high-frequency reads.

**Example:**
```typescript
// In a component — validate before calling mutation
import { createPostBody } from "@/lib/api/generated/posts/posts.zod";
import { useCreatePost } from "@/lib/api/generated/posts/posts";

const { mutate: createPost } = useCreatePost();

const handleSubmit = (formData: unknown) => {
  const parsed = createPostBody.safeParse(formData);
  if (!parsed.success) {
    toast.error(parsed.error.issues[0].message);
    return;
  }
  createPost({ data: parsed.data });
};
```

### Pattern 4: Cache Invalidation in Generated Mutation Hooks

**What:** Generated `useCreate*` and `useUpdate*` hooks do not automatically invalidate related queries. Add `onSuccess` cache invalidation via the `mutation` option prop — same pattern as existing `useMutation` hooks.

**When to use:** Every mutation that modifies data that other queries display. This is the same pattern used today in `useUpdatePost` and `useDeletePost`.

**Trade-offs:** Cache invalidation logic must be added manually at the call site (not in the generated file). This is intentional — the generated file regenerates and would overwrite any manual additions.

**Example:**
```typescript
// Component or feature hook wrapping the generated mutation
const queryClient = useQueryClient();

const { mutate: deletePost } = useDeletePost({
  mutation: {
    onSuccess: (_, postId) => {
      queryClient.removeQueries({ queryKey: getPostQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: getPostsQueryKey() });
    },
  },
});
```

## Data Flow

### Request Flow (Generated Hook Path)

```
Component calls useGetPosts({ params })
    ↓ (from lib/api/generated/posts/posts.ts)
React Query executes queryFn
    ↓
decodedFetcher({ url: "/api/v1/posts", method: "GET", params })
    ↓ calls supabaseBrowserClient.auth.getSession() — injects JWT
fetch("http://localhost:3000/api/v1/posts?page=1&...")
    ↓
Next.js Proxy Route: app/api/v1/posts/route.ts (UNCHANGED)
    ↓ reads API_BASE_URL server env var, forwards request
Rust/Axum Backend: https://dev.decoded.style/api/v1/posts
    ↓ returns JSON
decodedFetcher returns typed T (typed by Orval from OpenAPI schema)
    ↓
React Query stores in cache with queryKey ["posts", "list", params]
    ↓
Component receives { data, isLoading, isError }
```

Critical insight: the Next.js proxy layer (`app/api/v1/`) is unchanged. Generated hooks use relative URLs (same as the existing `lib/api/client.ts` with `API_BASE_URL = ""`). The proxy is the stable contract between browser and backend — it handles CORS, server-side secrets, and FormData forwarding.

### State Management (Unchanged)

```
Zustand Stores (authStore, vtonStore, magazineStore, behaviorStore ...)
    │
    │ remain isolated from API calls
    │ only update via React Query onSuccess callbacks
    │ or direct user actions (UI events)
    │
    ↓ no changes to any lib/stores/ files during v9.0 migration
```

### Migration Data Flow

```
Phase A: Generated code exists alongside manual code
  components → existing lib/hooks/ → lib/api/[domain].ts → apiClient
  (migration target) → generated lib/api/generated/ → decodedFetcher → proxy

Phase B: Swap queryFn in existing hooks to generated functions
  components → lib/hooks/usePosts.ts (wrapper) → generated queryFn → proxy

Phase C: Point components directly at generated hooks where wrappers are trivial
  components → lib/api/generated/posts/posts.ts (useGetPosts) → proxy

Phase D: Delete manual files; generated model/ is type SSOT
  DELETE: lib/api/client.ts, lib/api/posts.ts, lib/api/users.ts, lib/api/types.ts
  RESULT: lib/api/generated/model/ is the single source of truth for all API types
```

## Integration Points

### External Services

| Service | Integration Pattern | Change in v9.0 |
|---------|---------------------|----------------|
| OpenAPI spec at `dev.decoded.style` | Input to Orval at codegen time only — not a runtime dependency | NEW: spec fetched during `bun run generate` |
| Supabase Auth | `decodedFetcher` calls `supabaseBrowserClient.auth.getSession()` — same as `lib/api/client.ts:getAuthToken()` | Mutator replicates existing pattern |
| Next.js Proxy (`app/api/v1/`) | Generated hooks call relative `/api/v1/*` URLs — proxy unchanged | No change |
| Rust/Axum Backend | Reached only through Next.js proxy — browser never calls it directly | No change |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `lib/api/generated/` ↔ `lib/hooks/` | Direct import (thin wrapper or replacement) | Both coexist during migration; wrappers deleted after |
| `lib/api/generated/` ↔ `lib/stores/` | None — stores do not call API directly | Stores updated via React Query `onSuccess` callbacks, unchanged |
| `lib/api/generated/model/` ↔ `lib/api/types.ts` | Parallel during migration; `types.ts` deleted at end | Do not re-export from both; prefer generated types immediately |
| `lib/api/mutator.ts` ↔ `lib/api/client.ts` | Independent during migration — different functions | `mutator.ts` is a clean rewrite; `client.ts` stays until all manual functions are gone |
| `orval.config.ts` ↔ Turborepo | `generate` task declared in `turbo.json`, cached by spec hash | Input fingerprint: downloaded spec file; output: `lib/api/generated/` |

### New and Modified Files

| File | Status | Purpose |
|------|--------|---------|
| `packages/web/orval.config.ts` | NEW | Orval generation config |
| `packages/web/lib/api/mutator.ts` | NEW | Shared fetch wrapper for all generated hooks |
| `packages/web/lib/api/generated/` | NEW (gitignored) | Orval output: hooks, model types, Zod schemas |
| `packages/web/.gitignore` | MODIFIED | Add `lib/api/generated/` |
| `packages/web/package.json` | MODIFIED | Add `"generate": "orval"` script; add `orval` devDependency |
| `turbo.json` (root) | MODIFIED | Add `generate` task with `dependsOn: []` (no Turborepo deps; spec is external) |
| `packages/web/lib/api/client.ts` | UNCHANGED during migration | Deleted in Phase D |
| `packages/web/lib/api/types.ts` | UNCHANGED during migration | Deleted in Phase D |
| `packages/web/lib/api/[domain].ts` | UNCHANGED during migration | Deleted per domain as migration completes |

## Build Order for Migration

The migration is phased to keep the app deployable at each step.

**Phase 1 — Scaffold (no behavior change to production)**
1. Install `orval` as devDependency in `packages/web`: `bun add -d orval`
2. Create `packages/web/orval.config.ts` (see Pattern 1 above)
3. Create `packages/web/lib/api/mutator.ts`
4. Add `"generate": "orval"` to `packages/web/package.json` scripts
5. Add `lib/api/generated/` to `packages/web/.gitignore`
6. Run `bun run generate` — confirm files appear in `lib/api/generated/`
7. Run `bun run typecheck` — fix any type collisions between generated `model/` and existing `lib/api/types.ts` (expect name overlaps; use `import type` aliasing temporarily)
8. Add `generate` step before typecheck in `packages/web/scripts/pre-push.sh`

**Phase 2 — Validate parity (no production change)**
1. Import one generated hook in isolation (e.g., in `app/debug/supabase/page.tsx`)
2. Confirm generated `useGetPosts` returns same shape as `fetchPosts` today
3. Confirm auth token injected correctly (check Network tab in browser)
4. Confirm query keys are compatible with existing cache (safe to coexist)
5. Document any shape differences between generated model/ and existing types.ts

**Phase 3 — Migrate read hooks domain by domain**

Recommended order (least complex to most):

```
badges → rankings → categories → comments → spots → solutions → users → posts → admin
```

For each domain:
- Replace `queryFn` in `lib/hooks/use[Domain].ts` with generated fetch function
- Keep hook signature unchanged — zero component changes
- Delete `lib/api/[domain].ts`
- Run `bun run typecheck` + `bun run test:visual` on affected pages

**Phase 4 — Migrate mutation hooks**

Mutations need extra care because they have `onSuccess` cache invalidation and store syncing logic:
- Use generated `useCreate[Resource]` as the base hook
- Pass `onSuccess`, `onError` via the `mutation` option at the call site
- Migrate `useUpdateProfile` last (it syncs with `profileStore` on success)

**Phase 5 — Cleanup**
1. Delete `lib/api/client.ts` (replaced by `mutator.ts`)
2. Delete `lib/api/types.ts` (replaced by `lib/api/generated/model/`)
3. Delete remaining `lib/api/[domain].ts` files
4. Update `lib/api/index.ts` to export only from `generated/`
5. Remove type aliases added in Phase 1 to handle overlaps
6. Run full build: `bun run build` — confirm success
7. Run `bun run test:visual` — confirm no visual regressions

**Dependency graph for build order:**

```
mutator.ts must exist BEFORE generate runs (orval imports and validates it)
generate must succeed BEFORE typecheck (generated types feed type-checking)
typecheck must pass BEFORE migration begins (baseline correctness)
domain migrations are sequential, not parallel (safer debugging)
cleanup is the final gate (all domains migrated and verified first)
```

## Anti-Patterns

### Anti-Pattern 1: Generated Code in `packages/shared`

**What people do:** Put Orval-generated hooks in `packages/shared` so mobile app can theoretically reuse them.

**Why it is wrong:** React Query hooks require `QueryClientProvider` in the component tree. Sharing hooks across package boundaries causes the "No QueryClient set" error (TanStack/query issues #3595, #7965). The mobile app uses Expo with a different React Query setup and React Native — web-specific patterns (`window.location.origin`, Next.js proxy cookies, browser fetch) cannot be shared.

**Do this instead:** Keep generated hooks in `packages/web/lib/api/generated/`. If mobile needs API type definitions, share only the plain TypeScript model types (no hooks, no React dependencies) via `packages/shared/types/`. Zod schemas are also safe to share (no framework dependency) if mobile input validation is needed.

### Anti-Pattern 2: Committing Generated Files

**What people do:** Commit `lib/api/generated/` to avoid needing spec access at build time.

**Why it is wrong:** Generated files drift from the spec between manual regenerations. When the backend changes a field, TypeScript still compiles against the stale generated type — the type safety guarantee disappears silently.

**Do this instead:** Add `lib/api/generated/` to `.gitignore`. Run `bun run generate` as part of pre-push CI (`just ci-web`) and as a Turborepo prebuild step. The OpenAPI spec at `dev.decoded.style` is the authoritative source; codegen must run against it.

### Anti-Pattern 3: Removing the Next.js Proxy Layer

**What people do:** Point the Orval mutator directly at `https://dev.decoded.style` to "simplify" the stack.

**Why it is wrong:** The proxy (`app/api/v1/`) exists to avoid CORS (browser cannot reach the Rust backend directly), inject `API_BASE_URL` server secrets, and handle FormData for file uploads. The browser has no access to server-only env vars. Bypassing the proxy breaks file upload endpoints and exposes the backend URL.

**Do this instead:** Keep `decodedFetcher` using relative URLs (empty base). File upload endpoints (`/api/v1/posts/upload`, `/api/v1/posts` with FormData) require a custom override or remain in the manual `lib/api/posts.ts` — Orval cannot auto-generate multipart form handling.

### Anti-Pattern 4: Full Cutover Before Validation

**What people do:** Delete all of `lib/hooks/` and `lib/api/` in one commit to "clean up" technical debt.

**Why it is wrong:** Existing hooks contain business logic beyond raw fetch: `useInfinitePosts` page-mapping, `useCreatePost` multi-step flow, `useUpdateProfile` store syncing. Generated hooks are pure API calls. Mapping logic must be verified to exist (or explicitly rewritten) before deleting the originals.

**Do this instead:** Follow the phased migration. Generate first, validate parity, swap per domain, delete only after each domain's visual QA passes.

### Anti-Pattern 5: Generating Infinite Query Without OpenAPI Pagination Markers

**What people do:** Expect Orval to auto-generate `useInfiniteQuery` hooks for paginated endpoints.

**Why it is wrong:** Orval generates `useInfiniteQuery` only when the operation has `useInfiniteQueryParam` configured in `orval.config.ts`, or when the OpenAPI spec uses pagination extensions. Without explicit config, it generates a plain `useQuery`. The infinite scroll logic in `useInfinitePosts` must remain as a wrapper.

**Do this instead:** Add `override.operations["GetPosts"].query.useInfinite = true` and `useInfiniteQueryParam: "page"` in `orval.config.ts` for each paginated endpoint. Alternatively, keep the existing infinite query hooks as thin wrappers that call the generated base fetch function.

## Sources

- Orval v8.5.3 official documentation (verified March 2026): https://orval.dev/
- Orval React Query guide: https://www.orval.dev/guides/react-query
- Orval output configuration reference: https://orval.dev/docs/reference/configuration/output/
- Orval Zod generation guide: https://www.orval.dev/guides/client-with-zod
- Orval GitHub repo (v8.5.3, March 6 2026): https://github.com/orval-labs/orval
- TanStack Query shared library issue (hooks across packages): https://github.com/TanStack/query/issues/3595
- TanStack Query QueryClient provider issue: https://github.com/TanStack/query/issues/7965
- Orval Zod generation deep-wiki: https://deepwiki.com/orval-labs/orval/5.1-zod-generation-configuration
- Existing codebase (read directly): `packages/web/lib/api/client.ts`, `lib/api/types.ts`, `lib/hooks/usePosts.ts`, `lib/hooks/useProfile.ts`, `app/api/v1/posts/route.ts`

---

*Architecture research for: decoded-monorepo v9.0 — Orval + Zod Type-Safe API Generation*
*Researched: 2026-03-23*
