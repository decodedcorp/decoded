---
phase: 44-memory-leak-prevention
plan: "02"
subsystem: fetch-cancellation
tags: [abort-signal, react-query, memory-leak, fetch, admin-hooks, vton]
dependency_graph:
  requires: []
  provides: [AbortSignal-support-apiClient, AbortSignal-support-adminFetch, AbortController-vton, AbortSignal-uploadImage]
  affects: [packages/web/lib/api/client.ts, packages/web/lib/hooks/admin, packages/web/lib/components/vton/VtonModal.tsx, packages/web/lib/api/posts.ts]
tech_stack:
  added: []
  patterns: [AbortController-cleanup-useEffect, AbortSignal-queryFn-context, AbortError-guard-catch]
key_files:
  created: []
  modified:
    - packages/web/lib/api/client.ts
    - packages/web/lib/hooks/admin/useDashboard.ts
    - packages/web/lib/hooks/admin/useServerLogs.ts
    - packages/web/lib/hooks/admin/usePipeline.ts
    - packages/web/lib/hooks/admin/useAudit.ts
    - packages/web/lib/hooks/admin/useAiCost.ts
    - packages/web/lib/components/vton/VtonModal.tsx
    - packages/web/lib/api/posts.ts
decisions:
  - AbortSignal threaded through RequestInit (not a separate parameter) to keep adminFetch backwards-compatible
  - Explicit `{ signal?: AbortSignal }` type annotation on queryFn context parameter to handle missing @tanstack/react-query types in worktree
  - abortRef in useLogStream also clears on stopInterval so pause/resume cleanly cancels in-flight requests
  - VtonModal uses a single shared abortControllerRef for both handleTryOn and handleSaveToProfile (only one can run at a time)
  - items fetch in VtonModal uses a per-effect local AbortController (not the shared ref) since it runs on state changes, not user actions
metrics:
  duration: "18 minutes"
  completed: "2026-03-26"
  tasks_completed: 2
  files_modified: 8
---

# Phase 44 Plan 02: AbortSignal/AbortController Fetch Cancellation Summary

AbortSignal wired through all fetch paths — apiClient, 5 adminFetch helpers, useLogStream polling, VtonModal direct fetches, and uploadImage retry loop — so React Query and component cleanup can cancel in-flight requests.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add AbortSignal to apiClient and adminFetch helpers | dfef782b | signal in ApiClientOptions + fetch(); adminFetch accepts RequestInit; all queryFn callbacks pass signal; useLogStream abortRef with cleanup |
| 2 | Add AbortController to VtonModal and uploadImage | 4e0c4c89 | abortControllerRef in VtonModal; cleanup useEffect; AbortError guards in handleTryOn/handleSaveToProfile; per-effect controller for items fetch; signal in uploadImage; AbortError skip-retry |

## Implementation Details

### apiClient (client.ts)
Added `signal?: AbortSignal` to `ApiClientOptions` interface. Destructured and forwarded to the `fetch()` call options. All callers that use `apiClient` via React Query's generated hooks will automatically benefit once the generated hooks are updated to pass signal.

### adminFetch helpers (5 admin hooks)
Each hook file had its own local `adminFetch<T>(url: string): Promise<T>` function. Updated all 5 to accept `adminFetch<T>(url: string, init?: RequestInit): Promise<T>` and pass `init` to `fetch()`. Updated all React Query `queryFn` callbacks to use `({ signal }: { signal?: AbortSignal }) => adminFetch(..., { signal })` pattern.

Hooks updated:
- `useDashboard.ts` — 3 queryFn callbacks (stats, chart, today)
- `useServerLogs.ts` — 1 queryFn callback (paginated list)
- `usePipeline.ts` — 2 queryFn callbacks (list, detail)
- `useAudit.ts` — 2 queryFn callbacks (list, detail)
- `useAiCost.ts` — 2 queryFn callbacks (kpi, chart)

### useLogStream polling (useServerLogs.ts)
Added `abortRef = useRef<AbortController | null>(null)`. In `stopInterval()`, calls `abortRef.current?.abort()` to cancel any in-flight poll when streaming stops. In `poll()`, creates a fresh `AbortController` before each fetch and passes its signal to `adminFetch`. Added `AbortError` guard in the catch block to silently ignore cancellations.

### VtonModal (VtonModal.tsx)
Added `abortControllerRef = useRef<AbortController | null>(null)`. Added `useEffect(() => () => abortControllerRef.current?.abort(), [])` cleanup on unmount. Updated `handleTryOn` and `handleSaveToProfile` to abort-then-recreate the controller before each fetch, pass `signal` to `fetch()`, and guard `catch` with `if (err.name === "AbortError") return`. Updated items-list `useEffect` to use a local per-effect `AbortController` with cleanup return.

### uploadImage (posts.ts)
Added `signal?: AbortSignal` to `UploadImageOptions` interface. Destructured and passed to the `fetch()` call. Added `AbortError` check at the top of the `catch` block: `if (lastError.name === "AbortError") throw lastError;` — ensures aborted requests do not trigger the retry loop.

## Verification

- `signal` in `ApiClientOptions` interface and in `fetch()` call: confirmed
- `AbortController` in admin hooks: 2 (useServerLogs abortRef + useServerLogs per-poll)
- `({ signal })` pattern in queryFn: 10 queryFn callbacks across 5 hooks
- `AbortError` guards: 8 occurrences across hooks, VtonModal, and posts.ts
- TypeScript: no new errors introduced (pre-existing 1244 environment errors unchanged)

## Deviations from Plan

### Auto-added: Explicit signal type annotation on queryFn context

**Found during:** Task 1 TypeScript verification
**Issue:** Missing `@tanstack/react-query` node_modules in this worktree caused TypeScript to infer queryFn context as `any`, making `{ signal }` destructure produce implicit `any` errors
**Fix:** Added `{ signal }: { signal?: AbortSignal }` explicit type annotation on all queryFn callbacks
**Files modified:** All 5 admin hook files
**Impact:** No behavior change — matches what @tanstack/react-query types would infer at runtime

### Auto-added: AbortController for VtonModal items-list fetch

**Found during:** Task 2 implementation
**Issue:** The items-list fetch in VtonModal (useEffect for category/search changes) also had no cancellation — a category change would race with the previous category's in-flight request
**Fix:** Added per-effect local `AbortController` with cleanup return in the items fetch effect
**Files modified:** VtonModal.tsx
**Impact:** Prevents stale category results from overwriting fresh ones

## Self-Check

- [x] packages/web/lib/api/client.ts — modified, contains `signal`
- [x] packages/web/lib/hooks/admin/useDashboard.ts — modified, contains `({ signal }`
- [x] packages/web/lib/hooks/admin/useServerLogs.ts — modified, contains `AbortController` and `AbortError`
- [x] packages/web/lib/hooks/admin/usePipeline.ts — modified, contains `({ signal }`
- [x] packages/web/lib/hooks/admin/useAudit.ts — modified, contains `({ signal }`
- [x] packages/web/lib/hooks/admin/useAiCost.ts — modified, contains `({ signal }`
- [x] packages/web/lib/components/vton/VtonModal.tsx — modified, contains `AbortController`, `AbortError`, cleanup effect
- [x] packages/web/lib/api/posts.ts — modified, contains `signal`, `AbortError`
- [x] Commits dfef782b and 4e0c4c89 exist

## Self-Check: PASSED
